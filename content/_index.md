---
title: "Home"
layout: hextra-home
---

<div class="hx:mb-8 hx:mt-6">
{{< hextra/hero-headline >}}
Systems. Architecture. Execution.
{{< /hextra/hero-headline >}}

{{< hextra/hero-subtitle >}}
Przemysław Sagało — Lead Software Developer. Engineering deep dives, system design notes, and daily operational runbooks.
{{< /hextra/hero-subtitle >}}

<div class="hx:mt-6 hx:flex hx:flex-wrap hx:gap-4">
{{< hextra/hero-button text="Explore Deep Dives" link="/deep-dives/" >}}
{{< hextra/hero-button text="Runbooks & Cheat Sheets" link="/runbooks/" style="background-color: transparent; border: 1px solid rgba(156, 163, 175, 0.4); color: inherit;" >}}
</div>
</div>

{{< hextra/feature-grid cols="2" >}}
{{< hextra/feature-card
  title="Engineering & Deep Dives"
  subtitle="Concurrency, Python internals, Algorithms & Data Structures, and System Architecture."
  link="/deep-dives/"
  icon="code"
>}}
{{< hextra/feature-card
  title="Operational Runbooks"
  subtitle="Battle-tested CLI cheat sheets, Git workflows, Vim motions, and AI-assisted engineering tooling."
  link="/runbooks/"
  icon="terminal"
>}}
{{< /hextra/feature-grid >}}
