import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      strict: true
    }),
    prerender: {
      handleHttpError: 'fail',
      handleMissingId: 'fail',
      handleUnseenRoutes: ({ routes, message }) => {
        const unexpected = routes.filter((route) => route !== '/[lang=lang]/projects/[id]');
        if (unexpected.length > 0) throw new Error(message);
      }
    }
  }
};

export default config;
