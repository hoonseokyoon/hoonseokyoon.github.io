<script lang="ts">
  import { formatPeriod } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import { localizedContent } from '$lib/content/public';
  import type { Output, Project } from '$lib/content/types';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { project, outputs, lang }: { project: Project; outputs: Output[]; lang: Locale } = $props();
  const labels = $derived(ui[lang]);
  const localized = $derived(localizedContent(project, lang));
  const projectOutputs = $derived(outputs.filter((output) => output.projectIds.includes(project.id)));
  const href = $derived(localizedHref(lang, `projects/${project.id}`));
</script>

<article class="project-card">
  <a class="project-card-link" {href} lang={localized.locale}>
    <div class="record-meta">
      <span class="status-label">{labels.lifecycle[project.lifecycle]}</span>
      <span aria-hidden="true">·</span>
      <time>{formatPeriod(project.period, lang, labels.present)}</time>
      {#if localized.isFallback}<span class="language-badge">{localized.locale.toUpperCase()}</span>{/if}
    </div>
    <h2>{localized.content.title}</h2>
    <p>{localized.content.summary}</p>
    <dl class="compact-facts">
      <div>
        <dt>{labels.role}</dt>
        <dd>{localized.content.role}</dd>
      </div>
    </dl>
    <div class="card-footer">
      <span>{projectOutputs.length} {labels.outputs.toLowerCase()}</span>
      <span>{project.knowledgeLinks.length} {labels.knowledge.toLowerCase()}</span>
      <span class="card-cta">{labels.openProject} →</span>
    </div>
  </a>
</article>
