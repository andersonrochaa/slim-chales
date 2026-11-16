// Carrega o <model-viewer> (Google) uma única vez, sob demanda.
let carregando: Promise<unknown> | undefined;

export function carregarModelViewer() {
  carregando ??= import('@google/model-viewer');
  return carregando;
}

export const reduzirMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
