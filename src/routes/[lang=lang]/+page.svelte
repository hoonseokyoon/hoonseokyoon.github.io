<script lang="ts">
  import ContentGate from '$lib/components/ContentGate.svelte';
  import OutputList from '$lib/components/OutputList.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import { localizedMetadata } from '$lib/metadata';
  import { localizedHref, tokamakHref } from '$lib/navigation';
  import { personId, websiteId } from '$lib/site';
  import { ui } from '$lib/ui';

  let { data } = $props();
  const labels = $derived(ui[data.lang]);
  const metadata = $derived(localizedMetadata(data.lang, ''));
  const person = $derived(data.person);
  const title = $derived(
    person ? `${person.content.name} · ${labels.personalRecord}` : `Hoonseok Yoon · ${labels.personalRecord}`
  );
  const description = $derived(person?.content.summary ?? labels.profileApprovalDescription);
  const jsonLd = $derived(
    person
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Person',
              '@id': personId,
              name: person.content.name,
              description: person.content.summary,
              url: person.canonicalUrl,
              sameAs: person.sameAs
            },
            {
              '@type': 'WebSite',
              '@id': websiteId,
              url: person.canonicalUrl,
              name: title,
              inLanguage: data.lang,
              author: { '@id': personId }
            }
          ]
        }
      : undefined
  );
</script>

<PageMeta {title} {description} {...metadata} {jsonLd} />

{#if person}
  <section class="home-hero">
    <div class="person-hero" lang={person.locale}>
      <p class="eyebrow">{labels.homeEyebrow}</p>
      <h1>{person.content.name}</h1>
      <p class="person-headline">{person.content.headline}</p>
      <p class="person-summary">{person.content.summary}</p>
      {#if person.sameAs.length || person.contacts.length}
        <ul class="profile-links">
          {#each person.sameAs as href}
            <li><a {href}>{new URL(href).hostname.replace('www.', '')}<span aria-hidden="true"> ↗</span></a></li>
          {/each}
          {#each person.contacts as contact}
            <li><a href={contact.url}>{contact.kind}</a></li>
          {/each}
        </ul>
      {/if}
    </div>

    {#if data.now.length}
      <aside class="now-panel" aria-labelledby="now-title">
        <h2 id="now-title">{labels.now}</h2>
        <ul class="now-list">
          {#each data.now as event}
            <li lang={event.locale}>
              <strong>{event.content.title}</strong>
              <p>{event.content.summary}</p>
            </li>
          {/each}
        </ul>
        <a href={localizedHref(data.lang, 'timeline')}>{labels.allTimeline} →</a>
      </aside>
    {/if}
  </section>

  {#if data.projects.length}
    <section class="home-section" aria-labelledby="selected-projects-title">
      <div class="section-heading">
        <h2 id="selected-projects-title">{labels.selectedProjects}</h2>
        <a href={localizedHref(data.lang, 'projects')}>{labels.allProjects} →</a>
      </div>
      <div class="project-grid">
        {#each data.projects as project}
          <ProjectCard {project} outputs={data.outputs} lang={data.lang} />
        {/each}
      </div>
    </section>
  {/if}

  {#if data.outputs.length}
    <section class="home-section" aria-labelledby="recent-outputs-title">
      <div class="section-heading">
        <h2 id="recent-outputs-title">{labels.recentOutputs}</h2>
        <a href={localizedHref(data.lang, 'outputs')}>{labels.allOutputs} →</a>
      </div>
      <OutputList outputs={data.outputs} projects={data.allProjects} lang={data.lang} />
    </section>
  {/if}

  <section class="home-section knowledge-gateway" aria-labelledby="knowledge-gateway-title">
    <div>
      <p class="eyebrow">TOKAMAK</p>
      <h2 id="knowledge-gateway-title">{labels.knowledgeTitle}</h2>
      <p>{labels.knowledgeDescription}</p>
    </div>
    <a class="button-link" href={tokamakHref(data.lang)}>{labels.visitKnowledge} ↗</a>
  </section>
{:else}
  <ContentGate lang={data.lang} />
{/if}
