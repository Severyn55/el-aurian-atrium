import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://severyn55.github.io',
  base: '/el-aurian-atrium/',
  output: 'static',           // explizit statisch (SSG) – kein Server/Worker
  integrations: [tailwind()],
});