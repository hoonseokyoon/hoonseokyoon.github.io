<script lang="ts">
  import { localizedContent } from '$lib/content/public';
  import { formatPartialDate } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { Output, Project } from '$lib/content/types';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { outputs, projects, lang }: { outputs: Output[]; projects: Project[]; lang: Locale } = $props();
  const labels = $derived(ui[lang]);

  function projectTitle(project: Project) {
    return localizedContent(project, lang).content.title;
  }
</script>

<ul class="output-list">
  {#each outputs as output (output.id)}
    {@const localized = localizedContent(output, lang)}
    {@const primary = output.links.find((link) => link.primary)}
    {@const relatedProjects = projects.filter((project) => output.projectIds.includes(project.id))}
    <li class="output-item" id={output.id} lang={localized.locale}>
      <time class="output-date" datetime={output.date}>{formatPartialDate(output.date, lang)}</time>
      <article class="output-record">
        <div class="record-meta">
          <span>{labels.outputKind[output.kind]}</span>
          {#if localized.isFallback}<span class="language-badge">{localized.locale.toUpperCase()}</span>{/if}
        </div>
        <h3>
          {#if primary}
            <a href={primary.url}>{localized.content.title}<span aria-hidden="true"> ↗</span></a>
          {:else}
            {localized.content.title}
          {/if}
        </h3>
        {#if localized.content.venue}<p class="record-byline">{localized.content.venue}</p>{/if}
        {#if localized.content.summary}<p>{localized.content.summary}</p>{/if}
        <p class="output-contribution"><strong>{labels.role}:</strong> {localized.content.contribution}</p>
        {#if relatedProjects.length}
          <ul class="record-links">
            {#each relatedProjects as project}
              <li><a href={localizedHref(lang, `projects/${project.id}`)}>{projectTitle(project)}</a></li>
            {/each}
          </ul>
        {/if}
        {#if output.links.length > 1}
          <ul class="secondary-links">
            {#each output.links.filter((link) => !link.primary) as link}
              <li><a href={link.url}>{link.kind}</a></li>
            {/each}
          </ul>
        {/if}
      </article>
    </li>
  {/each}
</ul>
