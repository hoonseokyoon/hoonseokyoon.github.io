<script lang="ts">
  import { tabularPeriod } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { PublicProject } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';
  import KnowledgeLinks from './KnowledgeLinks.svelte';

  let {
    projects,
    lang,
    showKind = true,
    showKnowledge = false
  }: { projects: PublicProject[]; lang: Locale; showKind?: boolean; showKnowledge?: boolean } = $props();
  const labels = $derived(ui[lang]);
</script>

<ol class="ledger">
  {#each projects as project (project.id)}
    {@const period = tabularPeriod(project.period, labels.present)}
    <li class="ledger-row" lang={project.locale}>
      <div class="ledger-when">
        <time datetime={project.period.start}>{period.start}</time>
        {#if period.end}<span>– {period.end}</span>{/if}
        {#if showKind}<span class="kind">{labels.lifecycle[project.lifecycle]}</span>{/if}
      </div>
      <div class="ledger-body">
        <h2>
          <a href={localizedHref(lang, `projects/${project.id}`)}>{project.content.title}</a
          >{#if project.isFallback}<span class="lang-note">{project.locale.toUpperCase()}</span>{/if}
        </h2>
        <p class="entry-summary">{project.content.summary}</p>
        <p class="entry-note"><span class="role-label">{labels.role}</span> {project.content.role}</p>
        {#if showKnowledge}
          <KnowledgeLinks links={project.knowledgeLinks} {lang} />
        {/if}
      </div>
    </li>
  {/each}
</ol>
