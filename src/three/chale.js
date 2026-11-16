// Chalé A-frame procedural, rico em detalhes (interior mobiliado, varanda, luzes).
// PROVISÓRIO: substitui o modelo real enquanto ele não existe.
import * as THREE from 'three';
import { Construtor } from './construtor.js';

export const KITS = {
  sol: { id: 'sol', nome: 'Kit Sol', W: 5.0, D: 5.6, H: 5.0, P: 1.9 },
  rio: { id: 'rio', nome: 'Kit Rio', W: 6.6, D: 8.6, H: 6.5, P: 2.4 },
};

export const MATERIAIS_CHALE = {
  telhado: { color: '#2f2d2b', roughness: 0.5, metalness: 0.45 },
  costura: { color: '#1f1e1d', roughness: 0.4, metalness: 0.55 },
  // `textura`: aplicada no navegador (cena.ts); `tinta` multiplica a foto da madeira. Sem textura, vale `color`.
  madeira: { color: '#b07440', roughness: 0.62, textura: { nome: 'cedro', escala: 1.4, tinta: '#ffffff' } },
  madeiraEscura: { color: '#5a3922', roughness: 0.78, textura: { nome: 'cedro', escala: 1.4, tinta: '#7d5a44' } },
  ripa: { color: '#8a5631', roughness: 0.72, textura: { nome: 'cedro', escala: 1.4, tinta: '#c99d7d' } },
  forro: { color: '#c48b56', roughness: 0.68, textura: { nome: 'cedro', escala: 1.6, tinta: '#ffe7cf' } },
  piso: { color: '#8c5c36', roughness: 0.6, textura: { nome: 'cedro', escala: 1.4, tinta: '#c48a64', girar: true } },
  deck: { color: '#a8784a', roughness: 0.82, textura: { nome: 'cedro', escala: 1.2, tinta: '#d6a983', girar: true } },
  aluminio: { color: '#1a1918', roughness: 0.4, metalness: 0.6 },
  vidro: { color: '#2b3d44', roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, projeta: false },
  concreto: { color: '#7b746d', roughness: 0.95 },
  tecido: { color: '#d9cdbb', roughness: 0.95 },
  tecidoEscuro: { color: '#4b5149', roughness: 0.95 },
  tapete: { color: '#8a7663', roughness: 1 },
  metalPreto: { color: '#151413', roughness: 0.5, metalness: 0.4 },
  cozinha: { color: '#e6dfd3', roughness: 0.45 },
  luz: { color: '#ffd9a8', emissive: '#ffb066', emissiveIntensity: 2.4, roughness: 0.6, projeta: false },
  vaso: { color: '#b4683f', roughness: 0.85 },
  folhaVaso: { color: '#3f6d36', roughness: 0.85, flatShading: true },
};

/**
 * @param {'sol'|'rio'} kitId
 * @param {{ interior?: boolean }} [opcoes]
 */
export function criarChale(kitId, { interior = true } = {}) {
  const { W, D, H, P, nome } = KITS[kitId];
  const c = new Construtor(MATERIAIS_CHALE);
  /** @type {{x:number,y:number,z:number,cor:string,intensidade:number,alcance:number}[]} */
  const luzes = [];
  const grande = W > 6;
  const deckH = 0.6;
  const meia = (y) => (W / 2) * (1 - y / H); // meia largura interna do "A" na altura y (acima do piso)
  const alturaEm = (x) => H * (1 - Math.abs(x) / (W / 2)); // altura interna do telhado em x

  // ---------------------------------------------------------------- base e deck
  const zIni = -D / 2 - 0.2;
  const zFim = D / 2 + P;
  const xDeck = W / 2 + 0.3;
  const nx = Math.ceil((2 * xDeck - 0.5) / 1.9);
  const nz = Math.ceil((zFim - zIni - 0.5) / 1.9);
  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= nz; j++) {
      const x = -xDeck + 0.25 + (i * (2 * xDeck - 0.5)) / nx;
      const z = zIni + 0.25 + (j * (zFim - zIni - 0.5)) / nz;
      c.caixa('concreto', 0.28, deckH - 0.2, 0.28, { x, y: (deckH - 0.2) / 2, z });
    }
  }
  c.caixa('madeiraEscura', 2 * xDeck, 0.16, zFim - zIni, { y: deckH - 0.12, z: (zIni + zFim) / 2 });
  const tabua = 0.14;
  for (let z = zIni + tabua / 2; z < zFim; z += tabua + 0.012) {
    c.caixa('deck', 2 * xDeck, 0.04, tabua, { y: deckH - 0.02, z });
  }

  // ---------------------------------------------------------------- telhado metálico com nervuras
  const t = 0.2;
  const Ls = Math.hypot(W / 2, H);
  const ang = Math.atan2(H, W / 2);
  const zTelhaIni = -D / 2 - 0.35;
  const zTelhaFim = D / 2 + 0.7;
  const prof = zTelhaFim - zTelhaIni;
  const zMeio = (zTelhaIni + zTelhaFim) / 2;
  for (const lado of [-1, 1]) {
    const u = new THREE.Vector2((-lado * W) / 2, H).normalize();
    const n = lado === -1 ? new THREE.Vector2(-u.y, u.x) : new THREE.Vector2(u.y, -u.x);
    const base = new THREE.Vector2((lado * W) / 2, 0);
    const rz = lado === -1 ? ang : -ang;
    const ponto = (s, off) => base.clone().addScaledVector(u, s).addScaledVector(n, off);
    const s0 = -0.3;
    const s1 = Ls + t * 0.9;
    const meio = ponto((s0 + s1) / 2, t / 2);
    c.caixa('telhado', s1 - s0, t, prof, { x: meio.x, y: meio.y + deckH, z: zMeio, rz });
    const nerv = ponto((s0 + s1) / 2, t + 0.025);
    for (let z = zTelhaIni + 0.2; z < zTelhaFim - 0.1; z += 0.46) {
      c.caixa('costura', s1 - s0, 0.05, 0.035, { x: nerv.x, y: nerv.y + deckH, z, rz });
    }
    const test = ponto((s0 + s1) / 2, t / 2 + 0.04);
    for (const z of [zTelhaFim + 0.05, zTelhaIni - 0.05]) {
      c.caixa('madeira', s1 - s0 + 0.06, t + 0.26, 0.12, { x: test.x, y: test.y + deckH, z, rz });
    }
  }
  c.caixa('aluminio', 0.38, 0.12, prof + 0.26, { y: deckH + H + t * 1.15, z: zMeio });

  // ---------------------------------------------------------------- fachada da frente
  const zF = D / 2;
  const trapezio = (y0, y1, z) => {
    const s = new THREE.Shape();
    s.moveTo(-meia(y0), y0);
    s.lineTo(meia(y0), y0);
    s.lineTo(meia(y1), y1);
    s.lineTo(-meia(y1), y1);
    s.closePath();
    const g = new THREE.ShapeGeometry(s);
    g.translate(0, deckH, z);
    return g;
  };
  const yVidro = H * 0.72;
  const alturaPorta = 2.3;
  c.add('vidro', trapezio(0, yVidro, zF));
  // empena de madeira acima do vidro
  c.add('madeiraEscura', trapezio(yVidro, H - 0.02, zF));
  for (let x = -meia(yVidro) + 0.12; x < meia(yVidro) - 0.05; x += 0.16) {
    const topo = alturaEm(Math.abs(x) + 0.03);
    if (topo - yVidro > 0.08) c.caixa('ripa', 0.04, topo - yVidro, 0.03, { x, y: deckH + (yVidro + topo) / 2, z: zF + 0.02 });
  }
  c.caixa('madeira', 2 * meia(yVidro) + 0.1, 0.2, 0.18, { y: deckH + yVidro, z: zF + 0.05 });
  // esquadrias
  const perfil = 0.07;
  const vertical = (x, yIni, yFimV, mat = 'aluminio') => {
    const topo = Math.min(alturaEm(x), yFimV);
    if (topo - yIni > 0.05) c.caixa(mat, perfil, topo - yIni, 0.1, { x, y: deckH + (yIni + topo) / 2, z: zF + 0.04 });
  };
  vertical(0, 0, yVidro);
  for (let x = 0.8; x < W / 2 - 0.1; x += 1.0) {
    vertical(x, 0, yVidro);
    vertical(-x, 0, yVidro);
  }
  const transomes = [0.03, alturaPorta];
  if (grande) transomes.push((alturaPorta + yVidro) / 2);
  for (const y of transomes) c.caixa('aluminio', 2 * meia(y) + 0.02, perfil, 0.1, { y: deckH + y, z: zF + 0.04 });
  for (const lado of [-1, 1]) {
    const comp = Math.hypot(meia(0) - meia(yVidro), yVidro);
    c.caixa('aluminio', comp, perfil, 0.1, {
      x: (lado * (meia(0) + meia(yVidro))) / 2,
      y: deckH + yVidro / 2,
      z: zF + 0.04,
      rz: lado === -1 ? ang : -ang,
    });
    c.caixa('metalPreto', 0.03, 0.5, 0.05, { x: lado * 0.14, y: deckH + 1.05, z: zF + 0.12 }); // puxadores
  }

  // ---------------------------------------------------------------- fundo
  const zB = -D / 2;
  const fundo = trapezio(0, H - 0.02, 0);
  fundo.rotateY(Math.PI);
  fundo.translate(0, 0, zB);
  c.add('madeiraEscura', fundo);
  for (let x = -W / 2 + 0.2; x < W / 2 - 0.1; x += 0.2) {
    const topo = alturaEm(Math.abs(x) + 0.03);
    if (topo > 0.08) c.caixa('ripa', 0.035, topo, 0.03, { x, y: deckH + topo / 2, z: zB - 0.015 });
  }

  // ---------------------------------------------------------------- varanda: guarda-corpo, escada, móveis, plantas, lanternas
  const xG = xDeck - 0.06;
  const hG = 1.0;
  const vao = 0.75;
  const zV0 = D / 2 + 0.75;
  const trecho = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ry = -Math.atan2(z1 - z0, x1 - x0);
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    c.caixa('madeiraEscura', len + 0.08, 0.07, 0.1, { x: cx, y: deckH + hG, z: cz, ry });
    c.caixa('madeiraEscura', len, 0.04, 0.04, { x: cx, y: deckH + hG * 0.55, z: cz, ry });
    c.caixa('madeiraEscura', len, 0.04, 0.04, { x: cx, y: deckH + hG * 0.2, z: cz, ry });
    const nPostes = Math.max(1, Math.ceil(len / 1.2));
    for (let i = 0; i <= nPostes; i++) {
      const k = i / nPostes;
      c.caixa('madeiraEscura', 0.1, hG, 0.1, { x: x0 + (x1 - x0) * k, y: deckH + hG / 2, z: z0 + (z1 - z0) * k });
    }
  };
  for (const lado of [-1, 1]) {
    trecho(lado * xG, zV0, lado * xG, zFim - 0.06);
    trecho(lado * xG, zFim - 0.06, lado * vao, zFim - 0.06);
    // lanterna no poste da escada
    const lx = lado * vao;
    const lz = zFim - 0.06;
    c.caixa('metalPreto', 0.2, 0.04, 0.2, { x: lx, y: deckH + hG + 0.06, z: lz });
    c.caixa('luz', 0.13, 0.26, 0.13, { x: lx, y: deckH + hG + 0.21, z: lz });
    c.caixa('metalPreto', 0.22, 0.04, 0.22, { x: lx, y: deckH + hG + 0.36, z: lz });
    luzes.push({ x: lx, y: deckH + hG + 0.3, z: lz + 0.2, cor: '#ffb066', intensidade: 2.2, alcance: 4 });
  }
  const degraus = 3;
  for (let i = 0; i < degraus; i++) {
    const h = (deckH * (degraus - i)) / (degraus + 1);
    c.caixa('deck', 2 * vao - 0.1, 0.05, 0.3, { y: h, z: zFim + 0.15 + i * 0.3 });
    c.caixa('madeiraEscura', 2 * vao - 0.1, h - 0.05, 0.3, { y: (h - 0.05) / 2, z: zFim + 0.15 + i * 0.3 });
  }

  const vasoComPlanta = (x, z, escala = 1, y = deckH) => {
    c.cilindro('vaso', 0.22 * escala, 0.16 * escala, 0.42 * escala, 12, { x, y: y + 0.21 * escala, z });
    c.esfera('folhaVaso', 0.32 * escala, 1, { x, y: y + 0.62 * escala, z });
    c.esfera('folhaVaso', 0.26 * escala, 1, { x: x + 0.15 * escala, y: y + 0.85 * escala, z: z - 0.05 * escala });
    c.esfera('folhaVaso', 0.22 * escala, 1, { x: x - 0.12 * escala, y: y + 0.95 * escala, z: z + 0.08 * escala });
  };
  vasoComPlanta(xDeck - 0.45, zFim - 0.45, 1.2);
  vasoComPlanta(vao + 0.45, zFim - 0.4, 0.85);
  vasoComPlanta(-(vao + 0.45), zFim - 0.4, 0.85);

  const poltrona = (x, z, ry) => {
    const pos = (dx, dz) => ({ x: x + Math.cos(ry) * dx + Math.sin(ry) * dz, z: z - Math.sin(ry) * dx + Math.cos(ry) * dz });
    const assento = pos(0, 0);
    c.caixa('madeira', 0.7, 0.08, 0.66, { ...assento, y: deckH + 0.36, ry });
    c.caixa('tecido', 0.62, 0.1, 0.58, { ...assento, y: deckH + 0.45, ry });
    const enc = pos(0, -0.32);
    c.caixa('madeira', 0.7, 0.62, 0.07, { ...enc, y: deckH + 0.66, ry, rx: -0.22 });
    c.caixa('tecido', 0.6, 0.5, 0.08, { ...pos(0, -0.26), y: deckH + 0.7, ry, rx: -0.22 });
    for (const [dx, dz] of [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]]) {
      c.caixa('madeiraEscura', 0.05, 0.32, 0.05, { ...pos(dx, dz), y: deckH + 0.16, ry });
    }
  };
  const zPolt = Math.min(zF + 1.25, zFim - 0.7);
  poltrona(-xDeck + 0.75, zPolt, 0.35);
  poltrona(-xDeck + 1.75, zPolt, -0.2);
  c.cilindro('madeiraEscura', 0.25, 0.25, 0.04, 16, { x: -xDeck + 1.25, y: deckH + 0.45, z: zPolt + 0.35 });
  c.cilindro('metalPreto', 0.03, 0.03, 0.43, 6, { x: -xDeck + 1.25, y: deckH + 0.22, z: zPolt + 0.35 });

  // ---------------------------------------------------------------- interior
  if (interior) {
    c.caixa('piso', W - 0.3, 0.02, D - 0.1, { y: deckH + 0.012, z: 0 });
    // forro de madeira e face interna do fundo
    const fundoInterno = trapezio(0, H - 0.02, zB + 0.03);
    c.add('forro', fundoInterno);
    for (const lado of [-1, 1]) {
      const rz = lado === -1 ? ang : -ang;
      const nx = lado === -1 ? Math.sin(ang) : -Math.sin(ang);
      const ny = -Math.cos(ang);
      c.caixa('forro', Ls, 0.02, D - 0.06, { x: (lado * W) / 4 + nx * 0.02, y: deckH + H / 2 + ny * 0.02, z: 0, rz });
    }

    // mezanino
    const yMez = grande ? 2.75 : 2.3;
    const profMez = D * 0.48;
    const zMezF = zB + profMez;
    const largMez = 2 * meia(yMez) - 0.08;
    c.caixa('madeiraEscura', largMez, 0.2, profMez, { y: deckH + yMez, z: zB + profMez / 2 });
    c.caixa('madeira', largMez, 0.26, 0.07, { y: deckH + yMez, z: zMezF });
    const largGuarda = 2 * meia(yMez + 1.0) - 0.2;
    c.caixa('vidro', largGuarda, 0.9, 0.02, { y: deckH + yMez + 0.55, z: zMezF - 0.05 });
    c.caixa('aluminio', largGuarda, 0.05, 0.06, { y: deckH + yMez + 1.02, z: zMezF - 0.05 });
    // cama no mezanino
    const yCama = deckH + yMez + 0.1;
    const zCama = zB + 0.35 + 1.05;
    c.caixa('madeira', 1.75, 0.3, 2.1, { y: yCama + 0.15, z: zCama });
    c.caixa('tecido', 1.62, 0.22, 2.0, { y: yCama + 0.4, z: zCama });
    c.caixa('tecidoEscuro', 1.66, 0.06, 1.1, { y: yCama + 0.53, z: zCama + 0.45 });
    for (const dx of [-0.38, 0.38]) c.caixa('tecido', 0.62, 0.16, 0.36, { x: dx, y: yCama + 0.58, z: zB + 0.62 });
    c.caixa('madeiraEscura', 0.42, 0.45, 0.4, { x: 1.2, y: yCama + 0.22, z: zB + 0.55 });
    c.esfera('luz', 0.11, 1, { x: 1.2, y: yCama + 0.6, z: zB + 0.55 });
    luzes.push({ x: 1.2, y: yCama + 0.8, z: zB + 0.9, cor: '#ffb066', intensidade: 1.6, alcance: 3.5 });

    // escada até o mezanino
    const nDeg = Math.round(yMez / 0.19);
    const espelho = yMez / nDeg;
    const piso = Math.min(0.26, (zF - 0.9 - zMezF) / nDeg);
    const xEsc = W * 0.14 + 0.4;
    for (let i = 0; i < nDeg; i++) {
      c.caixa('madeira', 0.8, 0.05, piso + 0.04, { x: xEsc, y: deckH + espelho * (i + 1) - 0.025, z: zMezF + (nDeg - i - 0.5) * piso });
    }
    const compEsc = Math.hypot(nDeg * piso, yMez);
    c.caixa('madeiraEscura', 0.1, 0.18, compEsc, { x: xEsc, y: deckH + yMez / 2 - 0.12, z: zMezF + (nDeg * piso) / 2, rx: Math.atan2(yMez, nDeg * piso) });

    // cozinha no fundo, sob o mezanino
    const largCoz = W * 0.46;
    c.caixa('cozinha', largCoz, 0.88, 0.62, { x: -W * 0.06, y: deckH + 0.44, z: zB + 0.4 });
    c.caixa('metalPreto', largCoz + 0.04, 0.04, 0.66, { x: -W * 0.06, y: deckH + 0.9, z: zB + 0.4 });
    c.caixa('madeira', largCoz * 0.85, 0.04, 0.3, { x: -W * 0.06, y: deckH + 1.7, z: zB + 0.2 });
    c.caixa('luz', largCoz * 0.8, 0.02, 0.05, { x: -W * 0.06, y: deckH + yMez - 0.13, z: zB + 0.7 });
    luzes.push({ x: -W * 0.06, y: deckH + yMez - 0.4, z: zB + 1.1, cor: '#ffc27a', intensidade: 2.2, alcance: 4.5 });

    // jantar perto do vidro, com pendentes acesos
    const xMesa = -W * 0.13;
    const zMesa = zF - 1.75;
    const compMesa = grande ? 1.8 : 1.3;
    c.caixa('madeira', compMesa, 0.05, 0.9, { x: xMesa, y: deckH + 0.75, z: zMesa });
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      c.caixa('metalPreto', 0.05, 0.72, 0.05, { x: xMesa + dx * (compMesa / 2 - 0.1), y: deckH + 0.36, z: zMesa + dz * 0.36 });
    }
    const posCadeiras = grande ? [-compMesa / 4, compMesa / 4] : [0];
    for (const dx of posCadeiras) for (const lado of [-1, 1]) {
      const x = xMesa + dx;
      const z = zMesa + lado * 0.68;
      c.caixa('madeiraEscura', 0.44, 0.05, 0.44, { x, y: deckH + 0.46, z });
      c.caixa('madeiraEscura', 0.44, 0.5, 0.04, { x, y: deckH + 0.72, z: z + lado * 0.2 });
      for (const [px, pz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) {
        c.caixa('metalPreto', 0.03, 0.44, 0.03, { x: x + px, y: deckH + 0.22, z: z + pz });
      }
    }
    const nPend = grande ? 3 : 2;
    for (let i = 0; i < nPend; i++) {
      const x = xMesa + (i - (nPend - 1) / 2) * (compMesa / nPend);
      const yP = deckH + 2.05;
      const topo = deckH + alturaEm(x) - 0.15;
      c.cilindro('aluminio', 0.008, 0.008, topo - yP, 4, { x, y: (yP + topo) / 2, z: zMesa });
      c.cone('metalPreto', 0.2, 0.24, 18, { x, y: yP, z: zMesa });
      c.cilindro('luz', 0.15, 0.15, 0.02, 18, { x, y: yP - 0.12, z: zMesa });
      luzes.push({ x, y: yP - 0.35, z: zMesa, cor: '#ffb066', intensidade: grande ? 3.2 : 2.8, alcance: 6 });
    }

    // estar: sofá, mesa de centro, tapete e luminária de piso
    const xSofa = -W * 0.31;
    const zSofa = zMezF + (grande ? 1.25 : 0.95);
    const compSofa = grande ? 2.0 : 1.5;
    c.caixa('tapete', 1.8, 0.012, compSofa + 0.6, { x: xSofa + 0.75, y: deckH + 0.03, z: zSofa });
    c.caixa('tecido', 0.88, 0.42, compSofa, { x: xSofa, y: deckH + 0.21, z: zSofa });
    c.caixa('tecido', 0.22, 0.42, compSofa, { x: xSofa - 0.33, y: deckH + 0.6, z: zSofa });
    for (const dz of [-1, 1]) c.caixa('tecido', 0.88, 0.2, 0.16, { x: xSofa, y: deckH + 0.52, z: zSofa + dz * (compSofa / 2 - 0.08) });
    c.caixa('tecidoEscuro', 0.14, 0.36, 0.4, { x: xSofa - 0.18, y: deckH + 0.6, z: zSofa - compSofa * 0.22, rz: 0.2 });
    c.caixa('tecidoEscuro', 0.14, 0.36, 0.4, { x: xSofa - 0.18, y: deckH + 0.6, z: zSofa + compSofa * 0.22, rz: 0.2 });
    c.caixa('madeira', 0.6, 0.06, 0.9, { x: xSofa + 1.05, y: deckH + 0.38, z: zSofa });
    c.caixa('madeiraEscura', 0.5, 0.32, 0.8, { x: xSofa + 1.05, y: deckH + 0.18, z: zSofa });
    const xLum = xSofa + 0.1;
    const zLum = zSofa + compSofa / 2 + 0.4;
    c.cilindro('metalPreto', 0.16, 0.16, 0.03, 12, { x: xLum, y: deckH + 0.02, z: zLum });
    c.cilindro('metalPreto', 0.015, 0.015, 1.35, 6, { x: xLum, y: deckH + 0.7, z: zLum });
    c.cilindro('luz', 0.17, 0.22, 0.28, 16, { x: xLum, y: deckH + 1.45, z: zLum });
    luzes.push({ x: xLum, y: deckH + 1.3, z: zLum + 0.3, cor: '#ffb066', intensidade: 2, alcance: 4 });

    // plantas junto ao vidro
    vasoComPlanta(W * 0.28, zF - 0.45, 1.25, deckH + 0.02);
    vasoComPlanta(-W * 0.3, zF - 0.5, 1.05, deckH + 0.02);

    // luz geral quente
    luzes.push({ x: 0, y: deckH + 3.4, z: zF - 2.5, cor: '#ffc68a', intensidade: 4, alcance: 9 });
  }

  const grupo = c.montar(nome);
  return { grupo, luzes, dims: { W, D, H, P, deckH, zFim, xDeck, zIni } };
}
