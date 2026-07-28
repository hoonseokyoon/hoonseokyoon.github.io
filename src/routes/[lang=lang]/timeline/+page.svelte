<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import TimelineList from '$lib/components/TimelineList.svelte';
  import { localizedMetadata } from '$lib/metadata';
  import { ui } from '$lib/ui';

  let { data } = $props();
  const labels = $derived(ui[data.lang]);
  const metadata = $derived(localizedMetadata(data.lang, 'timeline'));
  const title = $derived(`${labels.timeline} · Hoonseok Yoon`);
</script>

<PageMeta {title} description={labels.timelineDescription} {...metadata} />
<PageHeader eyebrow="CHRONOLOGY" title={labels.timeline} description={labels.timelineDescription} />

{#if data.timeline.length}
  <TimelineList events={data.timeline} projects={data.projects} outputs={data.outputs} lang={data.lang} />
{:else}
  <p class="empty-state">{labels.noPublishedTimeline}</p>
{/if}
