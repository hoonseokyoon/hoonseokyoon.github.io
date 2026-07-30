<script lang="ts">
  import { page } from '$app/state';
  import { localizedHref } from '$lib/navigation';
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  const lang = $derived((page.url.pathname.match(/^\/(ko|en)(?:\/|$)/)?.[1] ?? 'ko') as Locale);
  const labels = $derived(ui[lang]);
</script>

<svelte:head>
  <title>{labels.notFoundTitle} · Hoonseok Yoon</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="shell">
  <main class="site-main">
    <section class="notice">
      <p class="label">{page.status}</p>
      <h1>{labels.notFoundTitle}</h1>
      <p>{labels.notFoundDescription}</p>
      <ul class="inline-links">
        <li><a href={localizedHref(lang)}>{labels.backHome} →</a></li>
      </ul>
    </section>
  </main>
</div>
