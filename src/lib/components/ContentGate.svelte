<script lang="ts">
  import type { Locale } from '$lib/site';
  import { ui } from '$lib/ui';

  let { lang }: { lang: Locale } = $props();
  const labels = $derived(ui[lang]);
</script>

<section class="content-gate" aria-labelledby="content-gate-title">
  <p class="eyebrow">CONTENT GATE</p>
  <h1 id="content-gate-title">{labels.profileApprovalRequired}</h1>
  <p class="lede">{labels.profileApprovalDescription}</p>
</section>
