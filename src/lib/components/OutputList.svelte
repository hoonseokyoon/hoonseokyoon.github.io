<script lang="ts">
  import { formatPartialDate } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { PublicOutput, PublicProject } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';
  import KnowledgePanel from './KnowledgePanel.svelte';

  let { outputs, projects, lang }: { outputs: PublicOutput[]; projects: PublicProject[]; lang: Locale } = $props();
  const labels = $derived(ui[lang]);

  function projectTitle(project: PublicProject) {
    return project.content.title;
  }
</script>

<ul class="output-list">
  {#each outputs as output (output.id)}
    {@const primary = output.links.find((link) => link.primary)}
    {@const relatedProjects = projects.filter((project) => output.projectIds.includes(project.id))}
    <li class="output-item" id={output.id} lang={output.locale}>
      <time class="output-date" datetime={output.date}>{formatPartialDate(output.date, lang)}</time>
      <article class="output-record">
        <div class="record-meta">
          <span>{labels.outputKind[output.kind]}</span>
          {#if output.isFallback}<span class="language-badge">{output.locale.toUpperCase()}</span>{/if}
        </div>
        <h3>
          {#if primary}
            <a href={primary.url}>{output.content.title}<span aria-hidden="true"> ↗</span></a>
          {:else}
            {output.content.title}
          {/if}
        </h3>
        {#if output.content.venue}<p class="record-byline">{output.content.venue}</p>{/if}
        {#if output.content.summary}<p>{output.content.summary}</p>{/if}
        <p class="output-contribution"><strong>{labels.role}:</strong> {output.content.contribution}</p>
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
        <KnowledgePanel
          links={output.knowledgeLinks}
          {lang}
          headingId={`output-${output.id}-knowledge-title`}
          headingLevel={4}
          variant="compact"
        />
      </article>
    </li>
  {/each}
</ul>
