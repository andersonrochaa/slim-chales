import type { APIRoute } from 'astro';
import { imagensParaBusca } from '../data/imagens';
import { raizDoSite } from '../lib/site';

// Gerado no build. Lista só as páginas que devem aparecer no Google (a /obrigado fica de fora)
// e, na página inicial, as fotos dos chalés (fachadas e interior) e as plantas (sitemap de imagens do Google).
export const GET: APIRoute = async ({ site }) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const raiz = raizDoSite(site!);
  const { kits, interior } = await imagensParaBusca(raiz);
  const imagens = [...Object.values(kits).flatMap((k) => [k.padrao.url, k.quadrada.url, k.planta.url]), interior.url];
  const blocoImagens = imagens
    .map((url) => ['    <image:image>', `      <image:loc>${url}</image:loc>`, '    </image:image>'].join('\n'))
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    '  <url>',
    `    <loc>${raiz.href}</loc>`,
    `    <lastmod>${hoje}</lastmod>`,
    blocoImagens,
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
