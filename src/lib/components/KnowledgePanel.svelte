<script lang="ts">
  import type { PublicKnowledgeLink } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { links, lang }: { links: PublicKnowledgeLink[]; lang: Locale } = $props();
  const labels = $derived(ui[lang]);
</script>

{#if links.length}
  <aside class="knowledge-panel" aria-labelledby="related-knowledge-title">
    <p class="eyebrow">TOKAMAK</p>
    <h2 id="related-knowledge-title">{labels.relatedKnowledge}</h2>
    <ul>
      {#each links as link}
        <li lang={link.locale}>
          <span>{labels.relation[link.relation]}</span>
          <a href={link.href}>{link.label ?? link.href}<span aria-hidden="true"> ↗</span></a>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
