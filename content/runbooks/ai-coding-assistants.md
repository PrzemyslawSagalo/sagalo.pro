---
title: AI Coding Assistants (Commands, Skills, Agents & MCP)
weight: 1
type: docs
---

This document outlines the architectural differences and execution models of AI coding assistants, categorized by their level of autonomy, system interaction, and integration standards.

## 1. Commands
* **Definition:** Synchronous, user-driven triggers (e.g., `/explain`, `/test`).
* **Behavior:** Highly deterministic. They execute pre-defined macros or templates against a specific, user-provided context. The AI does not make autonomous routing decisions; it merely processes the input through a static pipeline.

---

## 2. Skills (Function Calling)
* **Definition:** Passive interfaces (Tools) that expose environmental I/O to the LLM.
* **Behavior:** Operates on a contract basis (typically JSON Schema). The LLM does not execute code directly; instead, it outputs a structured JSON request to invoke a specific tool. 
* **Execution:** The client-side orchestrator intercepts the JSON, executes the corresponding local system function (e.g., reading a file, querying AWS S3 via `boto3`), and feeds the result back into the LLM context window.

---

## 3. Agents
* **Definition:** Autonomous orchestrators utilizing reasoning loops (e.g., the ReAct pattern — Reason + Act).
* **Behavior:** Capable of handling high-level, abstract goals (e.g., *"Migrate this AWS Lambda script to GCP Cloud Functions and ensure tests pass"*).
* **Workflow:**
  1. Evaluates the objective.
  2. Autonomously selects and triggers necessary **Skills**.
  3. Evaluates the outputs (e.g., parses test failures or stack traces).
  4. Iterates, refactors, and corrects its approach until the exit condition is met.

---

## 4. MCP Servers (Model Context Protocol)
* **Definition:** An open standard architecture that unifies how AI assistants connect to external data sources, internal APIs, and executable tools.
* **Behavior:** MCP acts as a universal, plug-and-play backend for **Skills**. Instead of hardcoding custom integration logic into the agent for every single tool, the agent connects to an MCP Server. The server dynamically tells the agent which tools and context are available.
* **Architecture:**
  * **Client:** The AI coding assistant (e.g., Claude Desktop, Cursor, Maister).
  * **Server:** A lightweight, standalone process (running locally or remotely) that securely exposes capabilities (e.g., a `postgres-mcp-server` or `github-mcp-server`).
  * **Primitives:** Servers expose **Tools** (executable functions like our Skills), **Resources** (read-only data like logs or database schemas), and **Prompts** (pre-defined workflow templates).
* **Engineering Value:** Decouples tool implementation from the agent's core orchestrator logic. You can write an MCP server for your company's proprietary API once, and any MCP-compliant AI agent can instantly use it as a Skill without requiring custom client-side code.
