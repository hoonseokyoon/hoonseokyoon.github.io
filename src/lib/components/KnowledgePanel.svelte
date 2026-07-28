<script lang="ts">
  import type { KnowledgeLink } from '$lib/content/types';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { links, lang }: { links: KnowledgeLink[]; lang: Locale } = $props();
  const labels = $derived(ui[lang]);
</script>

{#if links.length}
  <aside class="knowledge-panel" aria-labelledby="related-knowledge-title">
    <p class="eyebrow">TOKAMAK</p>
    <h2 id="related-knowledge-title">{labels.relatedKnowledge}</h2>
    <ul>
      {#each links as link}
        {@const locale = link.urls[lang] ? lang : link.urls.ko ? 'ko' : 'en'}
        {@const href = link.urls[locale]}
        <li lang={locale}>
          <span>{labels.relation[link.relation]}</span>
          <a {href}>{link.label?.[locale] ?? href}<span aria-hidden="true"> ↗</span></a>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
