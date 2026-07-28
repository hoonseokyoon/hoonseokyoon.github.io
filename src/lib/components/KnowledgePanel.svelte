<script lang="ts">
  import type { PublicKnowledgeLink } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let {
    links,
    lang,
    headingId,
    headingLevel = 2,
    variant = 'panel'
  }: {
    links: PublicKnowledgeLink[];
    lang: Locale;
    headingId: string;
    headingLevel?: 2 | 3 | 4;
    variant?: 'panel' | 'compact';
  } = $props();
  const labels = $derived(ui[lang]);
  const headingTag = $derived(`h${headingLevel}` as const);
</script>

{#if links.length}
  <aside
    class="knowledge-links"
    class:knowledge-panel={variant === 'panel'}
    class:record-knowledge={variant === 'compact'}
    aria-labelledby={headingId}
    {lang}
  >
    {#if variant === 'panel'}<p class="eyebrow">TOKAMAK</p>{/if}
    <svelte:element this={headingTag} id={headingId}>{labels.relatedKnowledge}</svelte:element>
    <ul>
      {#each links as link}
        <li>
          <span>{labels.relation[link.relation]}</span>
          <a href={link.href} lang={link.locale}>{link.label ?? link.href}<span aria-hidden="true"> ↗</span></a>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
