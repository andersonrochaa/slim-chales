// Fotos dos kits e versões para o Google e para compartilhamento.
// Os nomes de arquivo descritivos (chale-a-frame-54m2-kit-rio...) ajudam no Google Imagens:
// o Astro mantém o nome no endereço final (/_astro/chale-a-frame-54m2-kit-rio.HASH.webp).
import { getImage } from 'astro:assets';
import rio from '../assets/images/chale-a-frame-54m2-kit-rio.jpg';
import rioDestaque from '../assets/images/chale-a-frame-54m2-kit-rio-destaque.jpg';
import rioQuadrada from '../assets/images/chale-a-frame-54m2-kit-rio-quadrado.jpg';
import sol from '../assets/images/chale-a-frame-28m2-kit-sol.jpg';
import solQuadrada from '../assets/images/chale-a-frame-28m2-kit-sol-quadrado.jpg';
import plantaRio from '../assets/images/planta-rio.jpg';
import plantaSol from '../assets/images/planta-sol.jpg';
import type { KitId } from './conteudo';

export const fotosKit = {
  rio: {
    foto: rio, // 4:3, inteira
    quadrada: rioQuadrada,
    planta: plantaRio,
    alt: 'Chalé A-frame de 54 m² (Kit Rio) no fim da tarde, com fachada de vidro em dois níveis e deck de madeira',
  },
  sol: {
    foto: sol,
    quadrada: solQuadrada,
    planta: plantaSol,
    alt: 'Chalé A-frame de 28,5 m² (Kit Sol) ao entardecer, com portas de vidro, deck de madeira e jardim iluminado',
  },
} satisfies Record<KitId, unknown>;

// Qualidade por formato (AVIF e WebP não usam a mesma escala).
export const qualidadeFoto = { avif: 50, webp: 68 };

// Banner: no celular usa a foto inteira (4:3); no desktop, um recorte mais alto.
export const fotoBanner = { celular: rio, desktop: rioDestaque, alt: fotosKit.rio.alt };

/**
 * Endereços absolutos em JPEG para dados estruturados, sitemap de imagens e Open Graph.
 * O Google recomenda fotos de produto em 1:1, 4:3 e 16:9.
 */
export async function imagensParaBusca(site: URL) {
  const abs = (caminho: string) => new URL(caminho, site).href;
  const jpg = async (src: ImageMetadata, width: number, height?: number) => {
    const img = await getImage({ src, width, ...(height && { height, fit: 'cover' as const }), format: 'jpg', quality: 82 });
    return { url: abs(img.src), width, height: height ?? Math.round((src.height / src.width) * width) };
  };

  const versoesDoKit = async (id: KitId) => {
    const f = fotosKit[id];
    const [quadrada, padrao, larga, planta] = await Promise.all([
      jpg(f.quadrada, Math.min(1200, f.quadrada.width)),
      jpg(f.foto, 1200),
      jpg(f.foto, 1200, 675),
      jpg(f.planta, f.planta.width),
    ]);
    return { quadrada, padrao, larga, planta };
  };

  const [rio, sol, compartilhamento] = await Promise.all([
    versoesDoKit('rio'),
    versoesDoKit('sol'),
    jpg(fotosKit.rio.foto, 1200, 630),
  ]);
  return { kits: { rio, sol } satisfies Record<KitId, unknown>, compartilhamento };
}
