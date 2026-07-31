<script lang="ts">
  let { label, title, description }: { label?: string; title: string; description: string } = $props();
</script>

<header class="page-header">
  {#if label}<p class="label">{label}</p>{/if}
  <h1>{title}</h1>
  <p class="page-intro">{description}</p>
</header>
