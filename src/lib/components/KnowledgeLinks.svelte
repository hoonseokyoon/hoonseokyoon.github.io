<script lang="ts">
  import type { PublicKnowledgeLink } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { links, lang, showLabel = true }: { links: PublicKnowledgeLink[]; lang: Locale; showLabel?: boolean } = $props();
  const labels = $derived(ui[lang]);
</script>

{#if links.length}
  <aside class="record-knowledge" aria-label={labels.relatedKnowledge} {lang}>
    {#if showLabel}<p class="label">{labels.relatedKnowledge}</p>{/if}
    <ul class="knowledge-links">
      {#each links as link}
        <li>
          <span class="relation">{labels.relation[link.relation]}</span>
          <a href={link.href} lang={link.locale}>
            {link.label ?? link.href}<span class="ext" aria-hidden="true"> ↗</span>
          </a>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
