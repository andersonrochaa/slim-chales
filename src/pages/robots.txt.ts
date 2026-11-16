import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const texto = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${new URL('/sitemap.xml', site).href}`,
    '',
  ].join('\n');
  return new Response(texto, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
