// Caminhos internos respeitando o "base" do Astro.
// Na Vercel o site fica na raiz (/); no GitHub Pages fica em /slim-chales/.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const comBase = (caminho: string) => `${base}${caminho.startsWith('/') ? caminho : `/${caminho}`}`;

/** Raiz pública do site (domínio + base), para endereços absolutos. */
export const raizDoSite = (site: URL) => new URL(`${base}/`, site);

/**
 * Versão de teste (GitHub Pages): o formulário não envia e a página pede ao Google para não indexar,
 * para não competir com o site oficial depois.
 */
export const versaoDeTeste = import.meta.env.PUBLIC_DEMO === 'true';
