<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import ProjectList from '$lib/components/ProjectList.svelte';
  import { localizedMetadata } from '$lib/metadata';
  import { ui } from '$lib/ui';

  let { data } = $props();
  const labels = $derived(ui[data.lang]);
  const metadata = $derived(localizedMetadata(data.lang, 'projects'));
  const title = $derived(`${labels.projects} · Hoonseok Yoon`);
  const lifecycleOrder = ['active', 'paused', 'planned', 'completed', 'archived'] as const;
</script>

<PageMeta {title} description={labels.projectsDescription} {...metadata} />
<PageHeader title={labels.projects} description={labels.projectsDescription} />

{#if data.projects.length}
  {#each lifecycleOrder as lifecycle}
    {@const projects = data.projects.filter((project) => project.lifecycle === lifecycle)}
    {#if projects.length}
      <section class="group" aria-labelledby={`lifecycle-${lifecycle}`}>
        <h2 class="label" id={`lifecycle-${lifecycle}`}>{labels.lifecycle[lifecycle]}</h2>
        <ProjectList {projects} lang={data.lang} showKind={false} showKnowledge headingLevel={3} />
      </section>
    {/if}
  {/each}
{:else}
  <p class="empty">{labels.noPublishedProjects}</p>
{/if}
