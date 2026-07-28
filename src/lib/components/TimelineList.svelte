<script lang="ts">
  import { localizedContent } from '$lib/content/public';
  import { formatPeriod } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { Output, Project, TimelineEvent } from '$lib/content/types';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let {
    events,
    projects,
    outputs,
    lang
  }: { events: TimelineEvent[]; projects: Project[]; outputs: Output[]; lang: Locale } = $props();
  const labels = $derived(ui[lang]);

  function projectTitle(project: Project) {
    return localizedContent(project, lang).content.title;
  }

  function outputTitle(output: Output) {
    return localizedContent(output, lang).content.title;
  }
</script>

<ol class="timeline-list">
  {#each events as event (event.id)}
    {@const localized = localizedContent(event, lang)}
    {@const relatedProjects = projects.filter((project) => event.projectIds.includes(project.id))}
    {@const relatedOutputs = outputs.filter((output) => event.outputIds.includes(output.id))}
    <li class="timeline-item" id={event.id} lang={localized.locale}>
      <div class="timeline-period">
        <time>{formatPeriod(event.period, lang, labels.present)}</time>
      </div>
      <article class="timeline-record">
        <div class="record-meta">
          <span>{labels.eventKind[event.kind]}</span>
          {#if localized.isFallback}<span class="language-badge">{localized.locale.toUpperCase()}</span>{/if}
        </div>
        <h2>{localized.content.title}</h2>
        {#if localized.content.role || localized.content.organization}
          <p class="record-byline">
            {[localized.content.role, localized.content.organization].filter(Boolean).join(' · ')}
          </p>
        {/if}
        <p>{localized.content.summary}</p>
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
