<script lang="ts">
  import OutputList from '$lib/components/OutputList.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import { localizedMetadata } from '$lib/metadata';
  import { outputStructuredData } from '$lib/structured-data';
  import { ui } from '$lib/ui';

  let { data } = $props();
  const labels = $derived(ui[data.lang]);
  const metadata = $derived(localizedMetadata(data.lang, 'outputs'));
  const title = $derived(`${labels.outputs} · Hoonseok Yoon`);
  const jsonLd = $derived(outputStructuredData(data.outputs));
  const groups = [
    ['paper', 'publications'],
    ['software', 'software'],
    ['release', 'releases'],
    ['presentation', 'presentations'],
    ['poster', 'posters'],
    ['dataset', 'datasets'],
    ['article', 'articles'],
    ['award', 'awards'],
    ['other', 'other']
  ] as const;
</script>

<PageMeta {title} description={labels.outputsDescription} {...metadata} {jsonLd} />
<PageHeader title={labels.outputs} description={labels.outputsDescription} />

{#if data.outputs.length}
  {#each groups as [kind, anchor]}
    {@const outputs = data.outputs.filter((output) => output.kind === kind)}
    {#if outputs.length}
      <section class="group" id={anchor} aria-labelledby={`${anchor}-title`}>
        <h2 class="label" id={`${anchor}-title`}>{labels.outputKind[kind]}</h2>
        <OutputList {outputs} projects={data.projects} lang={data.lang} showKind={false} />
      </section>
    {/if}
  {/each}
{:else}
  <p class="empty">{labels.noPublishedOutputs}</p>
{/if}
