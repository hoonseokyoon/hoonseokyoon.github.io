<script lang="ts">
  import { formatPeriod } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { PublicOutput, PublicProject, PublicTimelineEvent } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let {
    events,
    projects,
    outputs,
    lang,
    headingLevel = 2
  }: {
    events: PublicTimelineEvent[];
    projects: PublicProject[];
    outputs: PublicOutput[];
    lang: Locale;
    headingLevel?: 2 | 3;
  } = $props();
  const labels = $derived(ui[lang]);
  const headingTag = $derived(headingLevel === 2 ? 'h2' : 'h3');

  function projectTitle(project: PublicProject) {
    return project.content.title;
  }

  function outputTitle(output: PublicOutput) {
    return output.content.title;
  }
</script>

<ol class="timeline-list">
  {#each events as event (event.id)}
    {@const relatedProjects = projects.filter((project) => event.projectIds.includes(project.id))}
    {@const relatedOutputs = outputs.filter((output) => event.outputIds.includes(output.id))}
    <li class="timeline-item" id={event.id} lang={event.locale}>
      <div class="timeline-period">
        <time>{formatPeriod(event.period, lang, labels.present)}</time>
      </div>
      <article class="timeline-record">
        <div class="record-meta">
          <span>{labels.eventKind[event.kind]}</span>
          {#if event.isFallback}<span class="language-badge">{event.locale.toUpperCase()}</span>{/if}
        </div>
        <svelte:element this={headingTag}>{event.content.title}</svelte:element>
        {#if event.content.role || event.content.organization}
          <p class="record-byline">
            {[event.content.role, event.content.organization].filter(Boolean).join(' · ')}
          </p>
        {/if}
        <p>{event.content.summary}</p>
        {#if relatedProjects.length || relatedOutputs.length}
          <ul class="record-links">
            {#each relatedProjects as project}
              <li><a href={localizedHref(lang, `projects/${project.id}`)}>{projectTitle(project)}</a></li>
            {/each}
            {#each relatedOutputs as output}
              <li><a href={`${localizedHref(lang, 'outputs')}#${output.id}`}>{outputTitle(output)}</a></li>
            {/each}
          </ul>
        {/if}
      </article>
    </li>
  {/each}
</ol>
