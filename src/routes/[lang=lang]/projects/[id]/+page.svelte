<script lang="ts">
  import KnowledgePanel from '$lib/components/KnowledgePanel.svelte';
  import OutputList from '$lib/components/OutputList.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import TimelineList from '$lib/components/TimelineList.svelte';
  import { localizedContent } from '$lib/content/public';
  import { formatPeriod } from '$lib/format';
  import { localizedMetadata } from '$lib/metadata';
  import { localizedHref } from '$lib/navigation';
  import { personId, siteOrigin } from '$lib/site';
  import { ui } from '$lib/ui';

  let { data } = $props();
  const labels = $derived(ui[data.lang]);
  const project = $derived(localizedContent(data.project, data.lang));
  const metadata = $derived(localizedMetadata(data.lang, `projects/${data.project.id}`));
  const title = $derived(`${project.content.title} · Hoonseok Yoon`);
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
    <li><a href={localizedHref(data.lang)}>{project.locale === 'ko' ? '홈' : 'Home'}</a></li>
    <li><a href={localizedHref(data.lang, 'projects')}>{labels.projects}</a></li>
    <li aria-current="page">{project.content.title}</li>
  </ol>
</nav>

<header class="project-header" lang={project.locale}>
  <div class="record-meta">
    <span class="status-label">{labels.lifecycle[data.project.lifecycle]}</span>
    <span aria-hidden="true">·</span>
    <time>{formatPeriod(data.project.period, data.lang, labels.present)}</time>
  </div>
  <h1>{project.content.title}</h1>
  <p class="lede">{project.content.summary}</p>
  <p class="project-role"><strong>{labels.role}:</strong> {project.content.role}</p>
  {#if data.project.links.length}
    <ul class="project-links">
      {#each data.project.links as link}
        <li><a href={link.url}>{link.kind}<span aria-hidden="true"> ↗</span></a></li>
      {/each}
    </ul>
  {/if}
</header>

<div class="project-detail-grid">
  <div class="project-main">
    {#if project.content.contributions.length}
      <section class="project-section" aria-labelledby="contributions-title">
        <h2 id="contributions-title">{labels.contributions}</h2>
        <ul>
          {#each project.content.contributions as contribution}<li>{contribution}</li>{/each}
        </ul>
      </section>
    {/if}

    {#if project.content.outcomes.length}
      <section class="project-section" aria-labelledby="outcomes-title">
        <h2 id="outcomes-title">{labels.outcomes}</h2>
        <ul>
          {#each project.content.outcomes as outcome}<li>{outcome}</li>{/each}
        </ul>
      </section>
    {/if}

    {#if data.outputs.length}
      <section class="project-section" aria-labelledby="related-outputs-title">
        <h2 id="related-outputs-title">{labels.relatedOutputs}</h2>
        <OutputList outputs={data.outputs} projects={[data.project]} lang={data.lang} />
      </section>
    {/if}

    {#if data.timeline.length}
      <section class="project-section" aria-labelledby="related-timeline-title">
        <h2 id="related-timeline-title">{labels.relatedTimeline}</h2>
        <TimelineList events={data.timeline} projects={[data.project]} outputs={data.outputs} lang={data.lang} />
      </section>
    {/if}
  </div>

  <aside class="project-aside">
    <section class="fact-panel" aria-labelledby="project-facts-title">
      <h2 id="project-facts-title">{labels.atAGlance}</h2>
      <dl class="fact-list">
        <div>
          <dt>{labels.status}</dt>
          <dd>{labels.lifecycle[data.project.lifecycle]}</dd>
        </div>
        <div>
          <dt>{labels.period}</dt>
          <dd>{formatPeriod(data.project.period, data.lang, labels.present)}</dd>
        </div>
        <div>
          <dt>{labels.outputs}</dt>
          <dd>{data.outputs.length}</dd>
        </div>
      </dl>
    </section>
    <KnowledgePanel links={data.project.knowledgeLinks} lang={data.lang} />
  </aside>
</div>
