<script lang="ts">
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { lang }: { lang: Locale } = $props();
  const labels = $derived(ui[lang]);
</script>

<section class="notice" aria-labelledby="content-gate-title">
  <p class="label">{lang === 'ko' ? '비공개' : 'Unpublished'}</p>
  <h1 id="content-gate-title">{labels.profileApprovalRequired}</h1>
  <p>{labels.profileApprovalDescription}</p>
</section>
