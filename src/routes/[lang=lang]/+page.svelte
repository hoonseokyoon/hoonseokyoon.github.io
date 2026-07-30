<script lang="ts">
  import ContentGate from '$lib/components/ContentGate.svelte';
  import KnowledgeLinks from '$lib/components/KnowledgeLinks.svelte';
  import OutputList from '$lib/components/OutputList.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import ProjectList from '$lib/components/ProjectList.svelte';
  import TimelineList from '$lib/components/TimelineList.svelte';
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
              sameAs: person.sameAs,
              ...(person.content.focus.length ? { knowsAbout: person.content.focus } : {})
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

  function profileLabel(href: string) {
    const url = new URL(href);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`;
  }
</script>

<PageMeta {title} {description} {...metadata} {jsonLd} />

{#if person}
  <header class="masthead" lang={person.locale}>
    <p class="label">{labels.mastheadLabel}</p>
    <h1 class="masthead-name">{person.content.name}</h1>
    <p class="masthead-headline">{person.content.headline}</p>
    <p class="masthead-summary">{person.content.summary}</p>
    {#if person.sameAs.length || person.contacts.length}
      <ul class="contact-line">
        {#each person.contacts as contact}
          <li><a href={contact.url}>{contact.url.replace(/^mailto:/, '')}</a></li>
        {/each}
        {#each person.sameAs as href}
          <li><a {href}>{profileLabel(href)}<span class="ext" aria-hidden="true"> ↗</span></a></li>
        {/each}
      </ul>
    {/if}
  </header>

  {#if person.content.focus.length}
    <section class="section" aria-labelledby="focus-title">
      <div class="section-head"><h2 class="label" id="focus-title">{labels.focus}</h2></div>
      <ul class="focus-list">
        {#each person.content.focus as item}<li>{item}</li>{/each}
      </ul>
    </section>
  {/if}

  {#if data.now.length}
    <section class="section" aria-labelledby="now-title">
      <div class="section-head"><h2 class="label" id="now-title">{labels.now}</h2></div>
      <TimelineList events={data.now} projects={data.allProjects} lang={data.lang} headingLevel={3} />
    </section>
  {/if}

  {#if data.experience.length}
    <section class="section" aria-labelledby="experience-title">
      <div class="section-head">
        <h2 class="label" id="experience-title">{labels.experience}</h2>
        <a class="more" href={localizedHref(data.lang, 'timeline')}>{labels.allTimeline} →</a>
      </div>
      <TimelineList events={data.experience} projects={data.allProjects} lang={data.lang} headingLevel={3} />
    </section>
  {/if}

  {#if data.projects.length}
    <section class="section" aria-labelledby="projects-title">
      <div class="section-head">
        <h2 class="label" id="projects-title">{labels.selectedProjects}</h2>
        <a class="more" href={localizedHref(data.lang, 'projects')}>{labels.allProjects} →</a>
      </div>
      <ProjectList projects={data.projects} lang={data.lang} />
    </section>
  {/if}

  {#if data.outputs.length}
    <section class="section" aria-labelledby="outputs-title">
      <div class="section-head">
        <h2 class="label" id="outputs-title">{labels.recentOutputs}</h2>
        <a class="more" href={localizedHref(data.lang, 'outputs')}>{labels.allOutputs} →</a>
      </div>
      <OutputList outputs={data.outputs} projects={data.allProjects} lang={data.lang} />
    </section>
  {/if}

  {#if person.content.expertise.length}
    <section class="section" aria-labelledby="expertise-title">
      <div class="section-head"><h2 class="label" id="expertise-title">{labels.expertise}</h2></div>
      <dl class="expertise">
        {#each person.content.expertise as group}
          <div>
            <dt>{group.label}</dt>
            <dd>
              {#each group.items as item, index}{#if index > 0}<span class="sep"> · </span>{/if}{item}{/each}
            </dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  <section class="section" aria-labelledby="knowledge-title">
    <div class="section-head">
      <h2 class="label" id="knowledge-title">{labels.knowledge}</h2>
      <a class="more" href={tokamakHref(data.lang)}>{labels.visitKnowledge} ↗</a>
    </div>
    <div class="knowledge-note">
      <p>{labels.knowledgeNote}</p>
      <KnowledgeLinks links={data.knowledgeLinks} lang={data.lang} showLabel={false} />
    </div>
  </section>
{:else}
  <ContentGate lang={data.lang} />
{/if}
