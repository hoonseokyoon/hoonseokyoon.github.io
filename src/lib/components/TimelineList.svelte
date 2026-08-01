<script lang="ts">
  import { tabularPeriod } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { PublicOutput, PublicProject, PublicTimelineEvent } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';
  import KnowledgeLinks from './KnowledgeLinks.svelte';

  let {
    events,
    projects = [],
    outputs = [],
    lang,
    headingLevel = 2,
    showSummary = true
  }: {
    events: PublicTimelineEvent[];
    projects?: PublicProject[];
    outputs?: PublicOutput[];
    lang: Locale;
    headingLevel?: 2 | 3;
    showSummary?: boolean;
  } = $props();
  const labels = $derived(ui[lang]);
  const headingTag = $derived(headingLevel === 2 ? 'h2' : 'h3');
</script>

<ol class="ledger">
  {#each events as event (event.id)}
    {@const period = tabularPeriod(event.period, labels.present)}
    {@const relatedProjects = projects.filter((project) => event.projectIds.includes(project.id))}
    {@const relatedOutputs = outputs.filter((output) => event.outputIds.includes(output.id))}
    <li class="ledger-row" id={event.id} lang={event.locale}>
      <div class="ledger-when">
        <time datetime={event.period.start}>{period.start}</time>
        {#if period.end}<span>– {period.end}</span>{/if}
        <span class="kind">{labels.eventKind[event.kind]}</span>
      </div>
      <div class="ledger-body">
        <svelte:element this={headingTag}>
          {event.content.title}{#if event.isFallback}<span class="lang-note">{event.locale.toUpperCase()}</span>{/if}
        </svelte:element>
        {#if event.content.role || event.content.organization || event.content.location}
          <p class="entry-byline">
            {[event.content.role, event.content.organization, event.content.location].filter(Boolean).join(' · ')}
          </p>
        {/if}
        {#if showSummary && event.content.summary}
          <p class="entry-summary">{event.content.summary}</p>
        {/if}
        {#if relatedProjects.length || relatedOutputs.length}
          <ul class="inline-links">
            {#each relatedProjects as project}
              <li><a href={localizedHref(lang, `projects/${project.id}`)}>{project.content.title}</a></li>
            {/each}
            {#each relatedOutputs as output}
              <li><a href={`${localizedHref(lang, 'outputs')}#${output.id}`}>{output.content.title}</a></li>
            {/each}
          </ul>
        {/if}
        <KnowledgeLinks links={event.knowledgeLinks} {lang} />
      </div>
    </li>
  {/each}
</ol>
