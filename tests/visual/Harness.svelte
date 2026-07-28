<script lang="ts">
  import '$lib/styles/global.css';
  import OutputList from '$lib/components/OutputList.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import TimelineList from '$lib/components/TimelineList.svelte';
  import {
    localizedContent,
    publishedCatalog,
    sortedOutputs,
    sortedProjects,
    sortedTimeline
  } from '$lib/content/public';
  import { fixtureCatalog } from '../fixtures/catalog';

  const catalog = publishedCatalog(fixtureCatalog);
  const person = localizedContent(fixtureCatalog.person, 'ko');
  const projects = sortedProjects(catalog.projects);
  const timeline = sortedTimeline(catalog.timeline);
  const outputs = sortedOutputs(catalog.outputs);
</script>

<div class="preview-banner" role="status">Preview fixture · 합성 데이터이며 공개 콘텐츠가 아닙니다</div>
<div class="site-shell visual-harness">
  <header class="visual-header">
    <span class="brand-name">Hoonseok Yoon</span>
    <nav aria-label="미리보기 메뉴">
      <a href="#projects">프로젝트</a><a href="#timeline">이력</a><a href="#outputs">산출물</a>
    </nav>
  </header>
  <main class="site-main">
    <section class="home-hero">
      <div class="person-hero">
        <p class="eyebrow">PERSONAL RECORD</p>
        <h1>{person.content.name}</h1>
        <p class="person-headline">{person.content.headline}</p>
        <p class="person-summary">{person.content.summary}</p>
      </div>
      <aside class="now-panel">
        <h2>현재</h2>
        <ul class="now-list">
          <li>
            <strong>합성 프로젝트 진행</strong>
            <p>현재 상태와 긴 텍스트의 배치를 검증합니다.</p>
          </li>
        </ul>
      </aside>
    </section>

    <section class="home-section" id="projects">
      <div class="section-heading"><h2>선별 프로젝트</h2></div>
      <div class="project-grid">
        {#each projects as project}<ProjectCard {project} {outputs} lang="ko" />{/each}
      </div>
    </section>

    <section class="home-section" id="timeline">
      <div class="section-heading"><h2>이력</h2></div>
      <TimelineList events={timeline} {projects} {outputs} lang="ko" />
    </section>

    <section class="home-section" id="outputs">
      <div class="section-heading"><h2>산출물</h2></div>
      <OutputList {outputs} {projects} lang="ko" />
    </section>
  </main>
</div>

<style>
  .preview-banner {
    padding: 0.55rem 1rem;
    background: #fff4ca;
    color: #5c4700;
    font-size: 0.78rem;
    font-weight: 700;
    text-align: center;
  }

  .visual-header {
    min-height: 88px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .visual-header nav {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .visual-header a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    font-weight: 650;
  }

  @media (max-width: 680px) {
    .visual-header {
      align-items: flex-start;
      flex-direction: column;
      padding: 1rem 0;
    }
  }
</style>
