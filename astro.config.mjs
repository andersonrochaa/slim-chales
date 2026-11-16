// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const { SITE_URL, VERCEL_PROJECT_PRODUCTION_URL, GITHUB_PAGES, BASE_PATH } = {
  ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''),
  ...process.env,
};

// GitHub Pages (versão de teste): só arquivos estáticos, sem a rota /api/contato e com o site em /slim-chales/.
// Fora disso, Vercel com a rota de servidor do formulário.
const paginasGithub = GITHUB_PAGES === 'true';

export default defineConfig({
  // URL pública, usada no canonical e no Open Graph.
  site: SITE_URL || (VERCEL_PROJECT_PRODUCTION_URL ? `https://${VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4321'),
  base: BASE_PATH || undefined,
  // Página estática; só a rota /api/contato roda no servidor (prerender = false).
  output: 'static',
  adapter: paginasGithub ? undefined : vercel(),
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_BING_SITE_VERIFICATION: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
