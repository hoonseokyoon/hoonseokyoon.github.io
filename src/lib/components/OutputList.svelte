<script lang="ts">
  import { tabularDate } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { PublicOutput, PublicProject } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';
  import KnowledgeLinks from './KnowledgeLinks.svelte';

  let {
    outputs,
    projects = [],
    lang,
    showKind = true
  }: { outputs: PublicOutput[]; projects?: PublicProject[]; lang: Locale; showKind?: boolean } = $props();
  const labels = $derived(ui[lang]);
</script>

<ul class="ledger">
  {#each outputs as output (output.id)}
    {@const primary = output.links.find((link) => link.primary)}
    {@const secondary = output.links.filter((link) => !link.primary)}
    {@const relatedProjects = projects.filter((project) => output.projectIds.includes(project.id))}
    <li class="ledger-row" id={output.id} lang={output.locale}>
      <div class="ledger-when">
        <time datetime={output.date}>{tabularDate(output.date)}</time>
        {#if showKind}<span class="kind">{labels.outputKind[output.kind]}</span>{/if}
      </div>
      <div class="ledger-body">
        <h3>
          {#if primary}
            <a href={primary.url}>{output.content.title}<span class="ext" aria-hidden="true"> ↗</span></a>
          {:else}
            {output.content.title}
          {/if}{#if output.isFallback}<span class="lang-note">{output.locale.toUpperCase()}</span>{/if}
        </h3>
        {#if output.content.venue}<p class="entry-byline">{output.content.venue}</p>{/if}
        {#if output.content.summary}<p class="entry-summary">{output.content.summary}</p>{/if}
        <p class="entry-note"><span class="role-label">{labels.role}</span> {output.content.contribution}</p>
        {#if relatedProjects.length || secondary.length}
          <ul class="inline-links">
            {#each relatedProjects as project}
              <li><a href={localizedHref(lang, `projects/${project.id}`)}>{project.content.title}</a></li>
            {/each}
            {#each secondary as link}
              <li><a href={link.url}>{link.kind}<span class="ext" aria-hidden="true"> ↗</span></a></li>
            {/each}
          </ul>
        {/if}
        <KnowledgeLinks links={output.knowledgeLinks} {lang} />
      </div>
    </li>
  {/each}
</ul>
