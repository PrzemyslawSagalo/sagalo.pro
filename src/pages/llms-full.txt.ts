import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCanonicalUrl } from './llms.txt';

export interface FullDocEntryLike {
  id: string;
  body?: string;
  data: {
    title: string;
    tags?: string[];
  };
}

const JSX_STRING_LITERAL = '(?:(?:"(?:[^"\\\\]|\\\\.)*")|(?:\'(?:[^\'\\\\]|\\\\.)*\')|(?:`(?:[^`\\\\]|\\\\.)*`))';
const JSX_EXPR_INNER = `(?:[^}"\'\`]|${JSX_STRING_LITERAL})*`;
const JSX_ATTR_VALUE_PATTERN = `(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^\'\\\\]|\\\\.)*)'|\\{(${JSX_EXPR_INNER})\\})`;
const TAG_ATTR_PATTERN = `(?:[^>"\'\`{}]|${JSX_STRING_LITERAL}|\\{${JSX_EXPR_INNER}\\})*`;

function decodeJsxValue(rawVal: string): string {
  const trimmed = rawVal.trim();
  const quoteMatch = trimmed.match(/^(['"`])([\s\S]*)\1$/);
  if (!quoteMatch) {
    return trimmed;
  }
  const quote = quoteMatch[1];
  let unquoted = quoteMatch[2];
  if (quote === '"' || quote === "'") {
    unquoted = unquoted.replace(new RegExp(`\\\\${quote}`, 'g'), quote);
  }
  return unquoted;
}

function parseAttributes(attrs: string): Map<string, string> {
  const map = new Map<string, string>();
  const regex = new RegExp(`([a-zA-Z0-9_-]+)\\s*=\\s*${JSX_ATTR_VALUE_PATTERN}`, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrs)) !== null) {
    const key = match[1].toLowerCase();
    let val: string;
    if (match[2] !== undefined) {
      val = match[2].replace(/\\"/g, '"');
    } else if (match[3] !== undefined) {
      val = match[3].replace(/\\'/g, "'");
    } else if (match[4] !== undefined) {
      val = decodeJsxValue(match[4]);
    } else {
      val = '';
    }
    if (!map.has(key)) {
      map.set(key, val);
    }
  }
  return map;
}

function isEscaped(str: string, index: number): boolean {
  let count = 0;
  let p = index - 1;
  while (p >= 0 && str[p] === '\\') {
    count++;
    p--;
  }
  return count % 2 === 1;
}

function isInsideJsxTag(prefix: string): boolean {
  const lastLt = prefix.lastIndexOf('<');
  if (lastLt === -1) return false;
  const tagSlice = prefix.slice(lastLt);
  if (!/^<[A-Za-z][A-Za-z0-9._-]*\b/.test(tagSlice)) return false;
  let inQuote: string | null = null;
  let inExpr = 0;
  for (let idx = 1; idx < tagSlice.length; idx++) {
    const ch = tagSlice[idx];
    if (inQuote) {
      if (ch === inQuote && !isEscaped(tagSlice, idx)) {
        inQuote = null;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === '{') {
        inExpr++;
      } else if (ch === '}') {
        inExpr = Math.max(0, inExpr - 1);
      } else if (ch === '>' && inExpr === 0) {
        return false;
      }
    }
  }
  return true;
}

function protectInlineCodeSpans(str: string, codeBlocks: string[]): string {
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '`') {
      if (isEscaped(str, i)) {
        result += '`';
        i++;
        continue;
      }

      const runStart = i;
      while (i < str.length && str[i] === '`') i++;
      const runLen = i - runStart;

      // Check if this single backtick is a JSX attribute template expression (e.g. title={`...`})
      if (
        runLen === 1 &&
        /[a-zA-Z0-9_-]+\s*=\s*\{\s*$/.test(str.slice(0, runStart)) &&
        isInsideJsxTag(str.slice(0, runStart))
      ) {
        // Find closing backtick of template literal
        let j = i;
        while (j < str.length && (str[j] !== '`' || isEscaped(str, j))) j++;
        if (j < str.length && str.slice(j + 1).match(/^\s*\}/)) {
          const val = str.slice(runStart + 1, j);
          const escaped = val.replace(/(?<!\\)"/g, '\\"');
          result += `"${escaped}"`;
          i = j + 1;
          continue;
        }
      }

      // Standard CommonMark code span scanning in strict source order
      // CommonMark: code spans cannot cross paragraph boundaries (blank lines).
      let closeStart = -1;
      let j = i;
      while (j < str.length) {
        if (str[j] === '\n') {
          let k = j + 1;
          while (k < str.length && (str[k] === ' ' || str[k] === '\t' || str[k] === '\r')) k++;
          if (k < str.length && str[k] === '\n') {
            break;
          }
          j++;
        } else if (str[j] === '`') {
          const cStart = j;
          while (j < str.length && str[j] === '`') j++;
          const cLen = j - cStart;
          if (cLen === runLen) {
            closeStart = cStart;
            break;
          }
        } else {
          j++;
        }
      }

      if (closeStart !== -1) {
        const spanText = str.slice(runStart, closeStart + runLen);
        const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
        codeBlocks.push(spanText);
        result += id;
        i = closeStart + runLen;
      } else {
        result += str.slice(runStart, i);
      }
    } else {
      result += str[i];
      i++;
    }
  }
  return result;
}

function stripInlineCodeSpans(str: string): string {
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '`') {
      if (isEscaped(str, i)) {
        result += '`';
        i++;
        continue;
      }

      const runStart = i;
      while (i < str.length && str[i] === '`') i++;
      const runLen = i - runStart;

      let closeStart = -1;
      let j = i;
      while (j < str.length) {
        if (str[j] === '`') {
          const cStart = j;
          while (j < str.length && str[j] === '`') j++;
          const cLen = j - cStart;
          if (cLen === runLen) {
            closeStart = cStart;
            break;
          }
        } else {
          j++;
        }
      }

      if (closeStart !== -1) {
        i = closeStart + runLen;
      } else {
        result += str.slice(runStart, i);
      }
    } else {
      result += str[i];
      i++;
    }
  }
  return result;
}

function measureIndent(str: string): number {
  let indent = 0;
  for (let idx = 0; idx < str.length; idx++) {
    if (str[idx] === ' ') {
      indent += 1;
    } else if (str[idx] === '\t') {
      indent += 4 - (indent % 4);
    } else {
      break;
    }
  }
  return indent;
}

function measurePrefixWidth(str: string): number {
  let width = 0;
  for (let idx = 0; idx < str.length; idx++) {
    if (str[idx] === '\t') {
      width += 4 - (width % 4);
    } else {
      width += 1;
    }
  }
  return width;
}

function getBlockquotePrefixAndRest(line: string): { bqCount: number; bqPrefix: string; rest: string } {
  let rest = line;
  let bqCount = 0;
  let bqPrefix = '';
  while (true) {
    const bqMatch = rest.match(/^\s*>[ \t]?/);
    if (!bqMatch) break;
    bqCount++;
    bqPrefix += bqMatch[0];
    rest = rest.slice(bqMatch[0].length);
  }
  return { bqCount, bqPrefix, rest };
}

function getRestAfterBlockquote(line: string, bqCount: number): string | null {
  let rest = line;
  for (let b = 0; b < bqCount; b++) {
    const bqMatch = rest.match(/^\s*>[ \t]?/);
    if (!bqMatch) return null;
    rest = rest.slice(bqMatch[0].length);
  }
  return rest;
}

function checkClosingFence(
  line: string,
  fenceChar: string,
  fenceLength: number,
  fenceBqCount: number,
  fenceIndent: number,
  fenceListIndent: number
): boolean {
  let rest = line;
  if (fenceBqCount > 0) {
    const afterBq = getRestAfterBlockquote(line, fenceBqCount);
    if (afterBq === null) return false;
    if (/^\s*>/.test(afterBq)) return false;
    rest = afterBq;
  } else {
    if (/^\s*>/.test(line)) return false;
  }

  const match = rest.match(/^([ \t]*)(`{3,}|~{3,})[ \t]*$/);
  if (!match) return false;

  const closeChar = match[2][0];
  const closeLength = match[2].length;
  if (closeChar !== fenceChar || closeLength < fenceLength) return false;

  const closeIndent = measureIndent(match[1]);

  // If the fence opened inside a list item, the closing delimiter must retain the list item's indentation.
  // A dedented delimiter (closeIndent < fenceListIndent) ends the list container and should be reprocessed
  // by list-boundary logic as a potential new opener outside the list.
  if (fenceListIndent > 0 && closeIndent < fenceListIndent) {
    return false;
  }

  // Calculate maximum closing fence indentation relative to enclosing Markdown/MDX container:
  // Root-level or blockquoted fences (0-3 spaces of initial indent) have a container base indent of 0,
  // so closing fences can never be indented 4 or more spaces per CommonMark §4.5.
  // Fences within list items use fenceListIndent, and indented MDX containers use fenceIndent (>= 4).
  let containerBaseIndent = 0;
  if (fenceListIndent > 0) {
    containerBaseIndent = fenceListIndent;
  } else if (fenceIndent >= 4) {
    containerBaseIndent = fenceIndent;
  } else {
    containerBaseIndent = 0;
  }
  const maxCloseIndent = containerBaseIndent + 3;

  if (closeIndent > maxCloseIndent) return false;

  return true;
}

interface MdxContainerState {
  depth: number;
  openTagName: string | null;
}

function updateMdxContainerState(line: string, state: MdxContainerState): void {
  const cleanLine = stripInlineCodeSpans(line);
  let idx = 0;

  if (state.openTagName !== null) {
    let inQuote: string | null = null;
    let inExpr = 0;
    while (idx < cleanLine.length) {
      const ch = cleanLine[idx];
      if (inQuote) {
        if (ch === inQuote && !isEscaped(cleanLine, idx)) {
          inQuote = null;
        }
      } else {
        if (ch === '"' || ch === "'") {
          inQuote = ch;
        } else if (ch === '{') {
          inExpr++;
        } else if (ch === '}') {
          inExpr = Math.max(0, inExpr - 1);
        } else if (ch === '>' && inExpr === 0) {
          const isSelfClosing = idx > 0 && cleanLine[idx - 1] === '/';
          if (!isSelfClosing) {
            state.depth++;
          }
          state.openTagName = null;
          idx++;
          break;
        }
      }
      idx++;
    }
  }

  while (idx < cleanLine.length) {
    const rest = cleanLine.slice(idx);

    const closeMatch = rest.match(/^<\/(Tabs|TabItem|Steps|FileTree|CardGrid)>/);
    if (closeMatch) {
      state.depth = Math.max(0, state.depth - 1);
      idx += closeMatch[0].length;
      continue;
    }

    const openMatch = rest.match(/^<(Tabs|TabItem|Steps|FileTree|CardGrid)\b/);
    if (openMatch) {
      const tagName = openMatch[1];
      let tagIdx = idx + openMatch[0].length;
      let inQuote: string | null = null;
      let inExpr = 0;
      let tagClosed = false;

      while (tagIdx < cleanLine.length) {
        const ch = cleanLine[tagIdx];
        if (inQuote) {
          if (ch === inQuote && !isEscaped(cleanLine, tagIdx)) {
            inQuote = null;
          }
        } else {
          if (ch === '"' || ch === "'") {
            inQuote = ch;
          } else if (ch === '{') {
            inExpr++;
          } else if (ch === '}') {
            inExpr = Math.max(0, inExpr - 1);
          } else if (ch === '>' && inExpr === 0) {
            const isSelfClosing = tagIdx > 0 && cleanLine[tagIdx - 1] === '/';
            if (!isSelfClosing) {
              state.depth++;
            }
            tagClosed = true;
            idx = tagIdx + 1;
            break;
          }
        }
        tagIdx++;
      }

      if (!tagClosed) {
        state.openTagName = tagName;
        break;
      }
      continue;
    }

    idx++;
  }
}

function protectCode(content: string, codeBlocks: string[]): string {
  const lines = content.split('\n');
  const resultLines: string[] = [];
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  let fenceInBlockquote = false;
  let fenceBqCount = 0;
  let fenceListIndent = 0;
  let fenceIndent = 0;
  let currentListIndent = 0;
  const mdxState: MdxContainerState = { depth: 0, openTagName: null };
  let currentBlock: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (inFence) {
      // 1. Check if this line is a closing fence delimiter validated against container context & indentation
      if (checkClosingFence(line, fenceChar, fenceLength, fenceBqCount, fenceIndent, fenceListIndent)) {
        currentBlock.push(line);
        inFence = false;
        fenceInBlockquote = false;
        fenceBqCount = 0;
        fenceListIndent = 0;
        fenceIndent = 0;
        const blockText = currentBlock.join('\n');
        const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
        codeBlocks.push(blockText);
        resultLines.push(id);
        currentBlock = [];
        i++;
        continue;
      }

      // 2. Check if enclosing blockquote container ended
      // Per CommonMark §5.1, code block lines inside a blockquote must begin with a leading '>'
      const rest = fenceInBlockquote ? getRestAfterBlockquote(line, fenceBqCount) : line;
      if (fenceInBlockquote && rest === null) {
        inFence = false;
        fenceInBlockquote = false;
        fenceBqCount = 0;
        fenceListIndent = 0;
        fenceIndent = 0;
        const blockText = currentBlock.join('\n');
        const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
        codeBlocks.push(blockText);
        resultLines.push(id);
        currentBlock = [];
        continue;
      }

      // 3. Check if enclosing list item container ended
      if (fenceListIndent > 0 && rest !== null) {
        let listEnded = false;
        if (rest.trim() === '') {
          // Lookahead for next non-blank line in the container
          let nextNonBlank = i + 1;
          while (nextNonBlank < lines.length) {
            const nextRest = fenceInBlockquote
              ? getRestAfterBlockquote(lines[nextNonBlank], fenceBqCount)
              : lines[nextNonBlank];
            if (nextRest === null) {
              listEnded = true;
              break;
            }
            if (nextRest.trim() !== '') {
              const nextIndent = measureIndent(nextRest);
              if (nextIndent < fenceListIndent) {
                listEnded = true;
              }
              break;
            }
            nextNonBlank++;
          }
        } else {
          const indent = measureIndent(rest);
          if (indent < fenceListIndent) {
            listEnded = true;
          }
        }

        if (listEnded) {
          inFence = false;
          fenceInBlockquote = false;
          fenceBqCount = 0;
          fenceListIndent = 0;
          fenceIndent = 0;
          currentListIndent = 0;
          const blockText = currentBlock.join('\n');
          const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
          codeBlocks.push(blockText);
          resultLines.push(id);
          currentBlock = [];
          continue;
        }
      }

      currentBlock.push(line);
      i++;
      continue;
    }

    // Continue multiline MDX container opening tag if one is active
    if (mdxState.openTagName !== null) {
      updateMdxContainerState(line, mdxState);
      resultLines.push(line);
      i++;
      continue;
    }

    // Track enclosing list item context across continuation lines
    const currParsed = getBlockquotePrefixAndRest(line);
    const rest = currParsed.rest;
    const listMarkerMatch = rest.match(/^(\s*(?:[-*+]|\d+[.)])\s+)/);
    if (listMarkerMatch) {
      currentListIndent = measurePrefixWidth(listMarkerMatch[1]);
    } else if (rest.trim() === '') {
      // Blank line does not immediately clear list indent; check if continuation follows
      let nextNonBlank = i + 1;
      let nextRest: string | null = null;
      while (nextNonBlank < lines.length) {
        const nextParsed = getBlockquotePrefixAndRest(lines[nextNonBlank]);
        if (currParsed.bqCount > 0) {
          if (nextParsed.bqCount === currParsed.bqCount) {
            if (nextParsed.rest.trim() !== '') {
              nextRest = nextParsed.rest;
              break;
            }
          } else {
            break;
          }
        } else {
          if (nextParsed.bqCount === 0) {
            if (lines[nextNonBlank].trim() !== '') {
              nextRest = lines[nextNonBlank];
              break;
            }
          } else {
            break;
          }
        }
        nextNonBlank++;
      }
      if (nextRest !== null) {
        const nextMarker = nextRest.match(/^(\s*(?:[-*+]|\d+[.)])\s+)/);
        if (!nextMarker) {
          const nextIndent = measureIndent(nextRest);
          if (nextIndent < currentListIndent) {
            currentListIndent = 0;
          }
        }
      } else {
        currentListIndent = 0;
      }
    } else {
      const indent = measureIndent(rest);
      if (indent < currentListIndent) {
        currentListIndent = 0;
      }
    }

    // Check fenced code block opener (including blockquoted, list-item, or indented fences in MDX containers)
    const fenceMatch = line.match(/^((?:\s*>[ \t]?)*(?:\s*(?:[-*+]|\d+[.)])\s+)?\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const char = fenceMatch[2][0];
      const info = fenceMatch[3];
      // CommonMark forbids backticks in info string of backtick fences
      if (!(char === '`' && info.includes('`'))) {
        const bqMatches = fenceMatch[1].match(/>/g);
        const bqCount = bqMatches ? bqMatches.length : 0;
        const hasBq = bqCount > 0;
        const restPrefix = hasBq
          ? getRestAfterBlockquote(fenceMatch[1], bqCount)
          : fenceMatch[1];

        let listIndent = 0;
        let indent = 0;
        if (restPrefix) {
          const listMarkerMatch = restPrefix.match(/^(\s*(?:[-*+]|\d+[.)])\s+)/);
          if (listMarkerMatch) {
            listIndent = measurePrefixWidth(listMarkerMatch[1]);
            const afterMarker = restPrefix.slice(listMarkerMatch[1].length);
            indent = measureIndent(afterMarker);
          } else {
            listIndent = currentListIndent;
            indent = measureIndent(restPrefix);
          }
        }

        const hasContainer = hasBq || listIndent > 0 || mdxState.depth > 0;
        // Per CommonMark §4.5, root-level fence openers can have at most 3 spaces of initial indent.
        // Fences with 4 or more spaces at the root level are indented code blocks.
        if (hasContainer || indent <= 3) {
          inFence = true;
          fenceChar = char;
          fenceLength = fenceMatch[2].length;
          fenceBqCount = bqCount;
          fenceInBlockquote = hasBq;
          fenceListIndent = listIndent;
          fenceIndent = indent;
          currentBlock = [line];
          i++;
          continue;
        }
      }
    }

    // Check indented code block relative to Markdown, list items, and MDX containers.
    // In blockquotes, indentation is evaluated on the content after the blockquote prefix.
    // In list items, an indented code block requires 4 spaces beyond the list item's content indentation.
    // In MDX containers (mdxState.depth > 0), indented child elements are JSX/MDX content, not code blocks.
    let prevBlank = false;
    if (i === 0) {
      prevBlank = true;
    } else {
      const prevParsed = getBlockquotePrefixAndRest(lines[i - 1]);
      if (currParsed.bqCount > 0) {
        prevBlank = prevParsed.bqCount >= currParsed.bqCount && prevParsed.rest.trim() === '';
      } else {
        prevBlank = lines[i - 1].trim() === '';
      }
    }

    const lineIndent = measureIndent(currParsed.rest);
    const requiredIndent = currentListIndent + 4;

    const isIndentedCandidate =
      prevBlank &&
      lineIndent >= requiredIndent &&
      mdxState.depth === 0;

    if (isIndentedCandidate) {
      const indentedBlock: string[] = [];
      const indentedBqCount = currParsed.bqCount;
      const indentedReqIndent = requiredIndent;

      while (i < lines.length) {
        const lineParsed = getBlockquotePrefixAndRest(lines[i]);
        if (indentedBqCount > 0) {
          if (lineParsed.bqCount === indentedBqCount) {
            const ind = measureIndent(lineParsed.rest);
            if (ind >= indentedReqIndent) {
              indentedBlock.push(lines[i]);
              i++;
            } else if (lineParsed.rest.trim() === '') {
              let nextNonBlank = i + 1;
              while (nextNonBlank < lines.length) {
                const nextParsed = getBlockquotePrefixAndRest(lines[nextNonBlank]);
                if (nextParsed.bqCount === indentedBqCount && nextParsed.rest.trim() === '') {
                  nextNonBlank++;
                } else {
                  break;
                }
              }
              if (
                nextNonBlank < lines.length &&
                getBlockquotePrefixAndRest(lines[nextNonBlank]).bqCount === indentedBqCount &&
                measureIndent(getBlockquotePrefixAndRest(lines[nextNonBlank]).rest) >= indentedReqIndent
              ) {
                indentedBlock.push(lines[i]);
                i++;
              } else {
                break;
              }
            } else {
              break;
            }
          } else {
            break;
          }
        } else {
          if (lineParsed.bqCount === 0 && measureIndent(lines[i]) >= indentedReqIndent) {
            indentedBlock.push(lines[i]);
            i++;
          } else if (lines[i].trim() === '') {
            let nextNonBlank = i + 1;
            while (nextNonBlank < lines.length && lines[nextNonBlank].trim() === '') {
              nextNonBlank++;
            }
            if (
              nextNonBlank < lines.length &&
              getBlockquotePrefixAndRest(lines[nextNonBlank]).bqCount === 0 &&
              measureIndent(lines[nextNonBlank]) >= indentedReqIndent
            ) {
              indentedBlock.push(lines[i]);
              i++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      const blockText = indentedBlock.join('\n');
      const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
      codeBlocks.push(blockText);
      resultLines.push(id);
      continue;
    }

    updateMdxContainerState(line, mdxState);
    resultLines.push(line);
    i++;
  }

  if (inFence) {
    const blockText = currentBlock.join('\n');
    const id = `\x00__CODE_BLOCK_${codeBlocks.length}__\x00`;
    codeBlocks.push(blockText);
    resultLines.push(id);
  }

  const fencedContent = resultLines.join('\n');

  // Single pass inline code span protection in strict source order,
  // respecting the first opening delimiter while distinguishing JSX template expressions.
  return protectInlineCodeSpans(fencedContent, codeBlocks);
}

export function stripStarlightJsx(content: string): string {
  const codeBlocks: string[] = [];

  // Protect fenced code blocks (tracking opening delimiter length for nested fences)
  // and inline code spans so literal code examples are preserved unchanged.
  const protectedContent = protectCode(content, codeBlocks);

  // 1. Strip MDX import declarations
  let cleaned = protectedContent
    .replace(/^import\s+[^;\n]+;\s*$/gm, '')
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

  // 2. Serialize LinkCards into Markdown links with descriptions before stripping wrapper tags.
  // The tag matcher and tokenizer prevent quoted attribute values and nested JSX braces from masking or interfering with real attributes.
  const linkCardRegex = new RegExp(`<LinkCard\\b(${TAG_ATTR_PATTERN})\\/?>`, 'gi');
  cleaned = cleaned.replace(linkCardRegex, (_, attrs) => {
    const attrMap = parseAttributes(attrs);
    const title = attrMap.get('title') || '';
    const href = attrMap.get('href') || '';
    const desc = attrMap.get('description') || '';

    if (title && href) {
      return desc ? `- [${title}](${href}): ${desc}` : `- [${title}](${href})`;
    } else if (title) {
      return desc ? `- **${title}**: ${desc}` : `- **${title}**`;
    }
    return '';
  });

  // 3. Serialize TabItem labels so tab context is preserved in LLM Markdown
  const tabItemRegex = new RegExp(`<TabItem\\b(${TAG_ATTR_PATTERN})>`, 'gi');
  cleaned = cleaned.replace(tabItemRegex, (_, attrs) => {
    const attrMap = parseAttributes(attrs);
    const label = attrMap.get('label') || '';
    return label ? `\n\n**Tab: ${label}**\n\n` : '\n';
  });

  // 4. Strip remaining Starlight wrapper tags (<CardGrid>, <Tabs>, <Steps>, etc.)
  const wrapperTagsRegex = new RegExp(`</?(?:Tabs|TabItem|Steps|FileTree|CardGrid)\\b(${TAG_ATTR_PATTERN})\\/?>`, 'gi');
  cleaned = cleaned
    .replace(wrapperTagsRegex, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Restore protected fenced and inline code blocks in reverse creation order
  // so any nested placeholders within outer code spans are properly expanded.
  for (let i = codeBlocks.length - 1; i >= 0; i--) {
    cleaned = cleaned.replace(`\x00__CODE_BLOCK_${i}__\x00`, () => codeBlocks[i]);
  }

  return cleaned;
}

export function generateLlmsFullTxt(docs: FullDocEntryLike[]): string {
  const contentDocs = docs
    .filter((doc) => doc.id.replace(/\.(md|mdx)$/, '') !== 'index')
    .sort((a, b) => a.id.localeCompare(b.id));

  const sections: string[] = [
    '# Przemysław Sagało — Knowledge Hub (Full Markdown Corpus)\n> Canonical URL: https://sagalo.pro/llms-full.txt\n> Generated at build time from https://sagalo.pro',
  ];

  for (const doc of contentDocs) {
    const tagsStr = (doc.data.tags || []).join(', ');
    const rawBody = doc.body ? doc.body.trim() : '';
    // Strip MDX imports and Starlight JSX components for clean LLM context injection
    const bodyStr = stripStarlightJsx(rawBody);
    const section = [
      '---',
      '',
      `# ${doc.data.title}`,
      `URL: ${getCanonicalUrl(doc.id)}`,
      `Tags: ${tagsStr}`,
      '',
      bodyStr,
    ].join('\n');

    sections.push(section);
  }

  return sections.join('\n\n') + '\n';
}

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');
  const output = generateLlmsFullTxt(docs);

  return new Response(output, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
