<script lang="ts">
  import type { Snippet } from 'svelte';
  import SiteShell from '$lib/components/SiteShell.svelte';
  import type { Locale } from '$lib/site';

  let { data, children }: { data: { lang: Locale }; children: Snippet } = $props();

  $effect(() => {
    document.documentElement.lang = data.lang;
  });
</script>

<SiteShell lang={data.lang}>
  {@render children()}
</SiteShell>
