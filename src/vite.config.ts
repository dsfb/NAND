import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm';
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from "svelte-preprocess";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    svelte({preprocess: sveltePreprocess({ postcss: true })}),
    topLevelAwait(),
  ],
})