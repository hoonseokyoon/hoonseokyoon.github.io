<script lang="ts">
  import { page } from '$app/state';
  import { localizedHref } from '$lib/navigation';
  import type { Locale } from '$lib/site';

  const lang = $derived((page.url.pathname.match(/^\/(ko|en)(?:\/|$)/)?.[1] ?? 'ko') as Locale);
</script>

<svelte:head>
  <title>{lang === 'ko' ? '페이지를 찾을 수 없습니다' : 'Page not found'} · Hoonseok Yoon</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="redirect-page">
  <p class="eyebrow">404</p>
  <h1>{lang === 'ko' ? '페이지를 찾을 수 없습니다.' : 'Page not found.'}</h1>
  <p>
    {lang === 'ko'
      ? '주소가 바뀌었거나 더 이상 제공되지 않는 페이지입니다.'
      : 'The address changed or this page is no longer available.'}
  </p>
  <a class="button-link" href={localizedHref(lang)}>{lang === 'ko' ? '홈으로 돌아가기' : 'Return home'}</a>
</main>
