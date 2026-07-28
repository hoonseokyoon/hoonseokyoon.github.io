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

<main class="redirect-page">
  <h1>Hoonseok Yoon</h1>
  <p><a href={target}>한국어 개인 기록으로 이동</a></p>
  <p lang="en"><a href="/en/">Continue to the personal record in English</a></p>
</main>
