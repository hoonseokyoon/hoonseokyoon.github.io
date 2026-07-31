<script lang="ts">
  import KnowledgeLinks from '$lib/components/KnowledgeLinks.svelte';
  import OutputList from '$lib/components/OutputList.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import TimelineList from '$lib/components/TimelineList.svelte';
  import { tabularPeriod } from '$lib/format';
  import { localizedMetadata } from '$lib/metadata';
  import { localizedHref } from '$lib/navigation';
  import { personId, siteOrigin } from '$lib/site';
  import { ui } from '$lib/ui';

  let { data } = $props();
  const labels = $derived(ui[data.lang]);
  const project = $derived(data.project);
  const metadata = $derived(localizedMetadata(data.lang, `projects/${data.project.id}`));
  const title = $derived(`${project.content.title} · Hoonseok Yoon`);
  const period = $derived(tabularPeriod(project.period, labels.present));
  const jsonLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'Project',
    '@id': `${siteOrigin}/#project-${data.project.id}`,
    url: metadata.canonical,
    name: project.content.title,
    description: project.content.summary,
    member: { '@id': personId }
  });
</script>

<PageMeta {title} description={project.content.summary} {...metadata} {jsonLd} />

<nav class="breadcrumb" aria-label={data.lang === 'ko' ? '이동 경로' : 'Breadcrumb'}>
  <ol>
    <li><a href={localizedHref(data.lang)}>{data.lang === 'ko' ? '홈' : 'Home'}</a></li>
    <li><a href={localizedHref(data.lang, 'projects')}>{labels.projects}</a></li>
    <li aria-current="page">{project.content.title}</li>
  </ol>
</nav>

<header class="record-header" lang={project.locale}>
  <p class="label">{labels.projects}</p>
  <h1>{project.content.title}</h1>
  <p class="record-lede">{project.content.summary}</p>
  <dl class="record-facts">
    <div>
      <dt>{labels.status}</dt>
      <dd>{labels.lifecycle[project.lifecycle]}</dd>
    </div>
    <div>
      <dt>{labels.period}</dt>
      <dd>{period.start}{period.end ? ` – ${period.end}` : ''}</dd>
    </div>
    <div>
      <dt>{labels.role}</dt>
      <dd>{project.content.role}</dd>
    </div>
  </dl>
  {#if project.links.length}
    <ul class="inline-links">
      {#each project.links as link}
        <li><a href={link.url}>{link.kind}<span class="ext" aria-hidden="true"> ↗</span></a></li>
      {/each}
    </ul>
  {/if}
</header>

{#if project.content.contributions.length}
  <section class="section" aria-labelledby="contributions-title">
    <div class="section-head"><h2 class="label" id="contributions-title">{labels.contributions}</h2></div>
    <div class="prose">
      <ul>
        {#each project.content.contributions as contribution}<li>{contribution}</li>{/each}
      </ul>
    </div>
  </section>
{/if}

{#if project.content.outcomes.length}
  <section class="section" aria-labelledby="outcomes-title">
    <div class="section-head"><h2 class="label" id="outcomes-title">{labels.outcomes}</h2></div>
    <div class="prose">
      <ul>
        {#each project.content.outcomes as outcome}<li>{outcome}</li>{/each}
      </ul>
    </div>
  </section>
{/if}

{#if data.outputs.length}
  <section class="section" aria-labelledby="related-outputs-title">
    <div class="section-head"><h2 class="label" id="related-outputs-title">{labels.relatedOutputs}</h2></div>
    <OutputList outputs={data.outputs} lang={data.lang} />
  </section>
{/if}

{#if data.timeline.length}
  <section class="section" aria-labelledby="related-timeline-title">
    <div class="section-head"><h2 class="label" id="related-timeline-title">{labels.relatedTimeline}</h2></div>
    <TimelineList events={data.timeline} outputs={data.outputs} lang={data.lang} headingLevel={3} />
  </section>
{/if}

{#if project.knowledgeLinks.length}
  <section class="section" aria-labelledby="project-knowledge-title">
    <div class="section-head"><h2 class="label" id="project-knowledge-title">{labels.knowledge}</h2></div>
    <div class="knowledge-note">
      <KnowledgeLinks links={project.knowledgeLinks} lang={data.lang} showLabel={false} />
    </div>
  </section>
{/if}
