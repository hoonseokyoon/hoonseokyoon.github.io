<script lang="ts">
  import { safeJsonLd } from '$lib/metadata';
  import { socialCardAlt, socialCardUrl } from '$lib/site';

  let {
    title,
    description,
    canonical,
    ko,
    en,
    xDefault,
    jsonLd
  }: {
    title: string;
    description: string;
    canonical: string;
    ko: string;
    en: string;
    xDefault: string;
    jsonLd?: unknown;
  } = $props();
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang="ko" href={ko} />
  <link rel="alternate" hreflang="en" href={en} />
  <link rel="alternate" hreflang="x-default" href={xDefault} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={socialCardUrl} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1731" />
  <meta property="og:image:height" content="909" />
  <meta property="og:image:alt" content={socialCardAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={socialCardUrl} />
  <meta name="twitter:image:alt" content={socialCardAlt} />
  {#if jsonLd}
    {@html `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>`}
  {/if}
</svelte:head>
