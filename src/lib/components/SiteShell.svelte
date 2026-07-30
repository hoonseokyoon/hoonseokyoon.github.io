<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { localizedHref, tokamakHref } from '$lib/navigation';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  let { lang, children }: { lang: Locale; children: Snippet } = $props();
  const labels = $derived(ui[lang]);
  const home = $derived(localizedHref(lang));
  const timeline = $derived(localizedHref(lang, 'timeline'));
  const projects = $derived(localizedHref(lang, 'projects'));
  const outputs = $derived(localizedHref(lang, 'outputs'));

  function isCurrent(path: string) {
    if (path === home) return page.url.pathname === home;
    return page.url.pathname.startsWith(path);
  }
</script>

<a class="skip-link" href="#main-content">{labels.skipToContent}</a>
<div class="shell">
  <header class="site-header">
    <a class="brand" href={home}>Hoonseok Yoon</a>

    <div class="header-end">
      <nav class="site-nav" aria-label={labels.primaryNavigation}>
        <a href={timeline} aria-current={isCurrent(timeline) ? 'page' : undefined}>{labels.timeline}</a>
        <a href={projects} aria-current={isCurrent(projects) ? 'page' : undefined}>{labels.projects}</a>
        <a href={outputs} aria-current={isCurrent(outputs) ? 'page' : undefined}>{labels.outputs}</a>
        <a href={tokamakHref(lang)}>{labels.knowledge}<span class="ext" aria-hidden="true"> ↗</span></a>
      </nav>
      <LanguageSwitcher {lang} />
    </div>
  </header>

  <main id="main-content" class="site-main">
    {@render children()}
  </main>

  <footer class="site-footer">
    <p>© {new Date().getFullYear()} Hoonseok Yoon</p>
    <p>{labels.servedThrough}</p>
  </footer>
</div>
