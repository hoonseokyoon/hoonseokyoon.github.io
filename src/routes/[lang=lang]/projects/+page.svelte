<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import { localizedMetadata } from '$lib/metadata';
  import { ui } from '$lib/ui';

  let { data } = $props();
  const labels = $derived(ui[data.lang]);
  const metadata = $derived(localizedMetadata(data.lang, 'projects'));
  const title = $derived(`${labels.projects} · Hoonseok Yoon`);
  const lifecycleOrder = ['active', 'paused', 'planned', 'completed', 'archived'] as const;
</script>

<PageMeta {title} description={labels.projectsDescription} {...metadata} />
<PageHeader eyebrow="SELECTED WORK" title={labels.projects} description={labels.projectsDescription} />

{#if data.projects.length}
  {#each lifecycleOrder as lifecycle}
    {@const projects = data.projects.filter((project) => project.lifecycle === lifecycle)}
    {#if projects.length}
      <section class="lifecycle-group" aria-labelledby={`lifecycle-${lifecycle}`}>
        <h2 id={`lifecycle-${lifecycle}`}>{labels.lifecycle[lifecycle]}</h2>
        <div class="project-grid">
          {#each projects as project}
            <ProjectCard {project} outputs={data.outputs} lang={data.lang} />
          {/each}
        </div>
      </section>
    {/if}
  {/each}
{:else}
  <p class="empty-state">{labels.noPublishedProjects}</p>
{/if}
