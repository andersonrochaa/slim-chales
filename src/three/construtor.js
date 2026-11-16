// Monta cenas procedurais juntando as peças por material (poucas malhas = renderização leve).
// Usado no navegador (banner) e no Node (scripts/gerar-modelos.mjs).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Gerador pseudoaleatório com semente (a cena sai sempre igual ao poster). */
export function aleatorio(semente = 1) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Coordenadas de textura por projeção de caixa, no espaço da própria peça (antes de girar/posicionar):
 * assim os veios da madeira acompanham cada tábua. `escala` = metros por repetição da textura.
 * @param {THREE.BufferGeometry} geo
 */
export function projetarUV(geo, escala, girar = false) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u;
    let v;
    if (ax >= ay && ax >= az) [u, v] = [pos.getZ(i), pos.getY(i)];
    else if (ay >= az) [u, v] = [pos.getX(i), pos.getZ(i)];
    else [u, v] = [pos.getX(i), pos.getY(i)];
    if (girar) [u, v] = [v, u];
    uv[i * 2] = u / escala;
    uv[i * 2 + 1] = v / escala;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

export class Construtor {
  /** @param {Record<string, any>} materiais definições: props do MeshStandardMaterial + projeta/recebe (sombra) */
  constructor(materiais) {
    this.materiais = materiais;
    /** @type {Map<string, THREE.BufferGeometry[]>} */
    this.partes = new Map();
  }

  /**
   * @param {string} mat
   * @param {THREE.BufferGeometry} geo
   * @param {{x?:number,y?:number,z?:number,rx?:number,ry?:number,rz?:number,sx?:number,sy?:number,sz?:number}} [p]
   */
  add(mat, geo, p = {}) {
    const def = this.materiais[mat];
    if (!def) throw new Error(`material desconhecido: ${mat}`);
    if (def.textura) projetarUV(geo, def.textura.escala ?? 1, def.textura.girar);
    const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = p;
    geo.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')),
        new THREE.Vector3(sx, sy, sz),
      ),
    );
    if (!this.partes.has(mat)) this.partes.set(mat, []);
    this.partes.get(mat).push(geo);
    return geo;
  }

  caixa(mat, sx, sy, sz, p) {
    return this.add(mat, new THREE.BoxGeometry(sx, sy, sz), p);
  }
  cilindro(mat, rTopo, rBase, h, seg, p) {
    return this.add(mat, new THREE.CylinderGeometry(rTopo, rBase, h, seg), p);
  }
  cone(mat, r, h, seg, p) {
    return this.add(mat, new THREE.ConeGeometry(r, h, seg), p);
  }
  esfera(mat, r, detalhe, p) {
    return this.add(mat, new THREE.IcosahedronGeometry(r, detalhe), p);
  }

  /** Junta tudo: uma malha por material. */
  montar(nome = 'grupo') {
    const grupo = new THREE.Group();
    grupo.name = nome;
    for (const [chave, geos] of this.partes) {
      const { projeta = true, recebe = true, textura, ...props } = this.materiais[chave];
      const manter = textura ? ['position', 'normal', 'uv'] : ['position', 'normal'];
      const prontas = geos.map((g) => {
        for (const k of Object.keys(g.attributes)) if (!manter.includes(k)) g.deleteAttribute(k);
        return g.index ? g : mergeVertices(g);
      });
      const geo = mergeGeometries(prontas, false);
      const material = new THREE.MeshStandardMaterial({ ...props, name: chave });
      if (textura) material.userData.textura = textura;
      const malha = new THREE.Mesh(geo, material);
      malha.name = chave;
      malha.castShadow = projeta;
      malha.receiveShadow = recebe;
      grupo.add(malha);
    }
    return grupo;
  }
}
