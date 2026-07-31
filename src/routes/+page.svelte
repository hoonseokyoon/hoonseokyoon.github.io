<script lang="ts">
  import { absoluteUrl } from '$lib/navigation';

  const target = '/ko/';
</script>

<svelte:head>
  <title>Hoonseok Yoon</title>
  <meta name="robots" content="noindex, follow" />
  <meta http-equiv="refresh" content={`0;url=${target}`} />
  <link rel="canonical" href={absoluteUrl(target)} />
</svelte:head>

<div class="shell">
  <main class="site-main">
    <section class="notice">
      <p class="label">Hoonseok Yoon</p>
      <h1>이력 및 연구 기록</h1>
      <ul class="inline-links">
        <li><a href={target}>한국어로 계속 →</a></li>
        <li lang="en"><a href="/en/">Continue in English →</a></li>
      </ul>
    </section>
  </main>
</div>
