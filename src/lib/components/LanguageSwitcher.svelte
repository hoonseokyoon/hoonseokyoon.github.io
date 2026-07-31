<script lang="ts">
  import { page } from '$app/state';
  import { alternateLocale, alternateLocalePath } from '$lib/navigation';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { lang }: { lang: Locale } = $props();
  const alternate = $derived(alternateLocale(lang));
  const alternatePath = $derived(alternateLocalePath(page.url.pathname, lang));
</script>

<nav class="lang-switch" aria-label={ui[lang].languageSelection}>
  {#if lang === 'ko'}
    <span class="current" aria-current="page">KO</span>
    <span class="divider" aria-hidden="true">/</span>
    <a href={alternatePath} lang="en" hreflang={alternate}>EN</a>
  {:else}
    <a href={alternatePath} lang="ko" hreflang={alternate}>KO</a>
    <span class="divider" aria-hidden="true">/</span>
    <span class="current" aria-current="page">EN</span>
  {/if}
</nav>
