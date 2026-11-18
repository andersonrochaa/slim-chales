// Fotos dos kits e versões para o Google e para compartilhamento.
// Os nomes de arquivo descritivos (chale-a-frame-54m2-kit-rio...) ajudam no Google Imagens:
// o Astro mantém o nome no endereço final (/_astro/chale-a-frame-54m2-kit-rio.HASH.webp).
import { getImage } from 'astro:assets';
import rio from '../assets/images/chale-a-frame-54m2-kit-rio.jpg';
import rioDestaque from '../assets/images/chale-a-frame-54m2-kit-rio-destaque.jpg';
import rioQuadrada from '../assets/images/chale-a-frame-54m2-kit-rio-quadrado.jpg';
import sol from '../assets/images/chale-a-frame-28m2-kit-sol.jpg';
import solQuadrada from '../assets/images/chale-a-frame-28m2-kit-sol-quadrado.jpg';
import airbnb from '../assets/images/chale-a-frame-15m2-kit-airbnb.jpg';
import airbnbQuadrada from '../assets/images/chale-a-frame-15m2-kit-airbnb-quadrado.jpg';
import plantaAirbnb from '../assets/images/planta-airbnb.jpg';
import plantaRio from '../assets/images/planta-rio.jpg';
import plantaSol from '../assets/images/planta-sol.jpg';
import type { KitId } from './conteudo';

interface FotosDoKit {
  foto: ImageMetadata; // 4:3, inteira
  quadrada: ImageMetadata;
  planta: ImageMetadata;
  alt: string;
}

export const fotosKit: Record<KitId, FotosDoKit> = {
  airbnb: {
    foto: airbnb,
    quadrada: airbnbQuadrada,
    planta: plantaAirbnb,
    alt: 'Chalé A-frame de 15,6 m² (Kit Airbnb) entre árvores, com porta de vidro, quarto à vista e deck de madeira',
  },
  rio: {
    foto: rio, // 4:3, inteira
    quadrada: rioQuadrada,
    planta: plantaRio,
    alt: 'Chalé A-frame de 50,2 m² (Kit Rio) no fim da tarde, com fachada de vidro em dois níveis e deck de madeira',
  },
  sol: {
    foto: sol,
    quadrada: solQuadrada,
    planta: plantaSol,
    alt: 'Chalé A-frame de 28,2 m² (Kit Sol) ao entardecer, com portas de vidro, deck de madeira e jardim iluminado',
  },
};

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

  const versoesDoKit = async (f: FotosDoKit) => {
    const [quadrada, padrao, larga, planta] = await Promise.all([
      jpg(f.quadrada, Math.min(1200, f.quadrada.width)),
      jpg(f.foto, 1200),
      jpg(f.foto, 1200, 675),
      jpg(f.planta, f.planta.width),
    ]);
    return { quadrada, padrao, larga, planta };
  };

  const [airbnb, sol, rio, compartilhamento] = await Promise.all([
    versoesDoKit(fotosKit.airbnb),
    versoesDoKit(fotosKit.sol),
    versoesDoKit(fotosKit.rio),
    jpg(fotosKit.rio.foto, 1200, 630),
  ]);
  const kits: Record<KitId, Awaited<ReturnType<typeof versoesDoKit>>> = { airbnb, sol, rio };
  return { kits, compartilhamento };
}
