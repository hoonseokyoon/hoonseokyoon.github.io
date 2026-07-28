<script lang="ts">
  import { formatPeriod } from '$lib/format';
  import { localizedHref } from '$lib/navigation';
  import type { PublicOutput, PublicProject } from '$lib/content/public';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { project, outputs, lang }: { project: PublicProject; outputs: PublicOutput[]; lang: Locale } = $props();
  const labels = $derived(ui[lang]);
  const projectOutputs = $derived(outputs.filter((output) => output.projectIds.includes(project.id)));
  const href = $derived(localizedHref(lang, `projects/${project.id}`));
</script>

<article class="project-card">
  <a class="project-card-link" {href} lang={project.locale}>
    <div class="record-meta">
      <span class="status-label">{labels.lifecycle[project.lifecycle]}</span>
      <span aria-hidden="true">·</span>
      <time>{formatPeriod(project.period, lang, labels.present)}</time>
      {#if project.isFallback}<span class="language-badge">{project.locale.toUpperCase()}</span>{/if}
    </div>
    <h3>{project.content.title}</h3>
    <p>{project.content.summary}</p>
    <dl class="compact-facts">
      <div>
        <dt>{labels.role}</dt>
        <dd>{project.content.role}</dd>
      </div>
    </dl>
    <div class="card-footer">
      <span>{projectOutputs.length} {labels.outputs.toLowerCase()}</span>
      {#if project.knowledgeLinks.length}
        <span>{project.knowledgeLinks.length} {labels.knowledge.toLowerCase()}</span>
      {/if}
      <span class="card-cta">{labels.openProject} →</span>
    </div>
  </a>
</article>
