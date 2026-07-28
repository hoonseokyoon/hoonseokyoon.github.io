<script lang="ts">
  let { eyebrow, title, description }: { eyebrow?: string; title: string; description: string } = $props();
</script>

<header class="page-header">
  {#if eyebrow}<p class="eyebrow">{eyebrow}</p>{/if}
  <h1>{title}</h1>
  <p class="lede">{description}</p>
</header>
