---
title: "Home"
layout: hextra-home
---

<div class="hero-banner-panel">
<div class="role-badge hx:mb-5">
<span class="hx:w-2 hx:h-2 hx:rounded-full hx:bg-sky-400"></span>
Lead Software Developer & Architect
</div>

{{< hextra/hero-headline >}}
Systems. Architecture. Execution.
{{< /hextra/hero-headline >}}

<p class="hx:text-base md:hx:text-lg hx:text-slate-300 hx:max-w-2xl hx:mx-auto hx:mt-3 hx:leading-relaxed">
Przemysław Sagało — Lead Software Developer.<br class="hx:hidden sm:hx:inline"/> Engineering deep dives, system design notes, and daily operational runbooks.
</p>

<div class="hx:mt-7 hx:flex hx:justify-center hx:flex-wrap hx:gap-3">
{{< hextra/hero-button text="Explore Deep Dives" link="/deep-dives/" >}}
{{< hextra/hero-button text="Runbooks & Cheat Sheets" link="/runbooks/" style="background-color: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.18); color: #f8fafc;" >}}
</div>
</div>

{{< hextra/feature-grid cols="2" >}}
{{< hextra/feature-card
title="Engineering & Deep Dives"
subtitle="Concurrency models, Python internals, Algorithms, and System Architecture standards."
link="/deep-dives/"
icon="code"
>}}
{{< hextra/feature-card
title="Operational Runbooks"
subtitle="Battle-tested CLI cheat sheets, Git workflows, Vim motions, and container tooling."
link="/runbooks/"
icon="terminal"
>}}
{{< /hextra/feature-grid >}}
