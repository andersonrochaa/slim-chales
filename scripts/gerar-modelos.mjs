// Gera os modelos 3D PROVISÓRIOS dos kits em public/models/*.glb (usados na seção "Veja em 3D").
// O chalé vem de src/three/chale.js, o mesmo usado no banner. Troque pelos modelos reais quando existirem.
// Uso: npm run modelos
import { writeFile, mkdir } from 'node:fs/promises';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { criarChale } from '../src/three/chale.js';

// O GLTFExporter usa FileReader (API de navegador) para montar o .glb.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
};

await mkdir(new URL('../public/models/', import.meta.url), { recursive: true });
const exporter = new GLTFExporter();

for (const kit of ['sol', 'rio']) {
  const { grupo } = criarChale(kit);
  // centraliza no eixo Z para a câmera girar em volta do chalé
  grupo.updateMatrixWorld(true);
  let zMin = Infinity;
  let zMax = -Infinity;
  grupo.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.computeBoundingBox();
    zMin = Math.min(zMin, o.geometry.boundingBox.min.z);
    zMax = Math.max(zMax, o.geometry.boundingBox.max.z);
  });
  grupo.children.forEach((m) => m.geometry.translate(0, 0, -(zMin + zMax) / 2));

  const glb = await exporter.parseAsync(grupo, { binary: true });
  await writeFile(new URL(`../public/models/kit-${kit}.glb`, import.meta.url), Buffer.from(glb));
  let tris = 0;
  grupo.traverse((o) => {
    if (o.isMesh) tris += o.geometry.index.count / 3;
  });
  console.log(`kit-${kit}.glb  ${(glb.byteLength / 1024).toFixed(0)} KB  ${tris} triângulos  ${grupo.children.length} malhas`);
}
