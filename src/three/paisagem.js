// Paisagem do banner: gramado com relevo, floresta de pinheiros nos morros, arbustos com flores,
// tufos de grama, caminho de pedras, montanhas e nuvens. Só roda no navegador (usa canvas nas nuvens).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Construtor, aleatorio } from './construtor.js';

export const MATERIAIS_PAISAGEM = {
  grama: { color: '#56703a', roughness: 1, projeta: false, textura: { nome: 'grama', escala: 6, tinta: '#b7d58c' } },
  pedra: { color: '#9a8f80', roughness: 0.95, textura: { nome: 'pedra', escala: 1.2, tinta: '#d8d0c4' } },
  rocha: { color: '#77716a', roughness: 0.95, textura: { nome: 'pedra', escala: 2, tinta: '#b9b1a6' } },
  tronco: { color: '#4f3726', roughness: 0.95, textura: { nome: 'casca', escala: 1.5, tinta: '#c9aa94' } },
  folha1: { color: '#355a2b', roughness: 0.9, flatShading: true },
  folha2: { color: '#4a7331', roughness: 0.9, flatShading: true },
  folha3: { color: '#5d8538', roughness: 0.9, flatShading: true },
  folha4: { color: '#2d4a27', roughness: 0.9, flatShading: true },
  flor1: { color: '#f4a9bd', roughness: 0.7, flatShading: true, projeta: false },
  flor2: { color: '#fbf3e4', roughness: 0.7, flatShading: true, projeta: false },
  flor3: { color: '#f3a64f', roughness: 0.7, flatShading: true, projeta: false },
  montanha1: { color: '#3f4d5c', roughness: 1, flatShading: true, projeta: false, recebe: false },
  montanha2: { color: '#58637a', roughness: 1, flatShading: true, projeta: false, recebe: false },
};

const suave = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const girar = (v, a) => new THREE.Vector2(v.x * Math.cos(a) - v.y * Math.sin(a), v.x * Math.sin(a) + v.y * Math.cos(a));

/** Altura do terreno: plano perto do chalé, morros florestados atrás dele. */
export function criarTerreno(zCentro, frente) {
  return (x, z) => {
    const dx = x;
    const dz = z - zCentro;
    const d = Math.hypot(dx, dz);
    const ondas = (Math.sin(x * 0.045) * Math.cos(z * 0.06) * 1.4 + Math.sin(x * 0.11 + z * 0.07) * 0.6) * suave(14, 45, d);
    const atras = d > 0 ? (dx * frente.x + dz * frente.y) / d : 0;
    const relevo = 0.7 + 0.3 * Math.sin(x * 0.021 + 1.3) * Math.cos(z * 0.017 + 0.4);
    const morros = suave(38, 170, d) * (6 + 30 * Math.max(0, atras) ** 1.5) * relevo;
    return ondas + morros - 0.03;
  };
}

/** Pinheiro com camadas de galhos irregulares (para instanciar). */
function geometriaPinheiro(camadas, segmentos, semente) {
  const r = aleatorio(semente);
  const partes = [];
  for (let k = 0; k < camadas; k++) {
    const t = k / camadas;
    const raio = 1.9 * (1 - t * 0.78);
    const altura = 2.6 * (1 - t * 0.35);
    const cone = new THREE.ConeGeometry(raio, altura, segmentos, 1, true);
    const pos = cone.attributes.position;
    const fase = r() * 10;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > -altura / 2 + 0.01) continue; // só o anel de baixo (pontas dos galhos)
      const ang = Math.atan2(pos.getZ(i), pos.getX(i));
      const f = 1 + 0.2 * Math.sin(ang * 5 + fase) + 0.1 * Math.sin(ang * 11 + fase * 2);
      pos.setX(i, pos.getX(i) * f);
      pos.setZ(i, pos.getZ(i) * f);
      pos.setY(i, y - 0.25 * (f - 0.8)); // pontas caídas
    }
    cone.rotateY(r() * Math.PI);
    cone.translate(0, 1.5 + k * (6.6 / camadas) + altura / 2, 0);
    partes.push(cone.toNonIndexed());
  }
  const geo = mergeGeometries(partes);
  geo.computeVertexNormals();
  return geo;
}

function texturaNuvem(semente) {
  const r = aleatorio(semente);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 70; i++) {
    const t = r();
    const x = 60 + t * 392;
    const alturaMax = 70 * Math.sin(Math.PI * t) + 20;
    const y = 175 - r() * alturaMax;
    const raio = 22 + r() * 46 * Math.sin(Math.PI * t);
    const g = ctx.createRadialGradient(x, y, 0, x, y, raio);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fill();
  }
  // base mais reta
  ctx.globalCompositeOperation = 'destination-out';
  const base = ctx.createLinearGradient(0, 180, 0, 215);
  base.addColorStop(0, 'rgba(0,0,0,0)');
  base.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 180, 512, 76);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {{ D:number, zFim:number, xDeck:number, zIni:number, camAz:number, solDir: THREE.Vector3, semente?:number }} p
 */
export function criarPaisagem({ zFim, xDeck, zIni, camAz, solDir, semente = 11 }) {
  const r = aleatorio(semente);
  const c = new Construtor(MATERIAIS_PAISAGEM);
  const grupo = new THREE.Group();
  const entre = (a, b) => a + r() * (b - a);
  const escolher = (lista) => lista[Math.floor(r() * lista.length)];

  const camDir = new THREE.Vector2(Math.sin(camAz), Math.cos(camAz)); // do chalé para a câmera
  const frente = camDir.clone().negate(); // da câmera para o fundo
  const esquerda = new THREE.Vector2(frente.y, -frente.x);
  const zCentro = (zIni + zFim) / 2;
  const altura = criarTerreno(zCentro, frente);
  const solPlano = new THREE.Vector2(solDir.x, solDir.z).normalize();
  const cam = new THREE.Vector2(camDir.x * 22, zCentro + camDir.y * 22);
  const naDirecaoDoSol = (x, z, margem) => new THREE.Vector2(x - cam.x, z - cam.y).normalize().dot(solPlano) > Math.cos(margem);

  const ocupado = (x, z, folga = 0.6) => Math.abs(x) < xDeck + folga && z > zIni - folga && z < zFim + 1.2 + folga;
  const noCaminho = (x, z) => z > zFim && z < zFim + 8 && Math.abs(x + (z - zFim) * 0.16) < 0.9;
  const naFrenteDaCamera = (x, z, distMax, anguloMax) => {
    const v = new THREE.Vector2(x, z - zCentro);
    if (v.length() > distMax) return false;
    return v.normalize().dot(camDir) > Math.cos(anguloMax);
  };

  // ---------------------------------------------------------------- terreno
  const chao = new THREE.PlaneGeometry(900, 900, 160, 160);
  chao.rotateX(-Math.PI / 2);
  const pos = chao.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, altura(pos.getX(i), pos.getZ(i)));
  chao.computeVertexNormals();
  c.add('grama', chao);

  // ---------------------------------------------------------------- caminho de pedras
  for (let i = 0; i < 10; i++) {
    const z = zFim + 1.3 + i * 0.72;
    const x = Math.sin(i * 0.55) * 0.45 - i * 0.12;
    c.add('pedra', new THREE.CylinderGeometry(entre(0.27, 0.36), entre(0.3, 0.4), 0.08, 9), { x, y: altura(x, z) + 0.02, z, ry: entre(0, 3) });
  }

  // ---------------------------------------------------------------- arbustos orgânicos com flores
  const arbusto = (x, z, escala = 1, comFlor = r() < 0.55) => {
    const y0 = altura(x, z);
    const n = 3 + Math.floor(r() * 3);
    const mat = escolher(['folha1', 'folha2', 'folha3']);
    const bolas = [];
    for (let i = 0; i < n; i++) {
      const rr = entre(0.32, 0.65) * escala;
      const bx = x + entre(-0.45, 0.45) * escala;
      const bz = z + entre(-0.45, 0.45) * escala;
      const by = y0 + rr * entre(0.5, 0.8);
      const g = new THREE.IcosahedronGeometry(rr, 2);
      const p = g.attributes.position;
      for (let j = 0; j < p.count; j++) {
        const v = new THREE.Vector3().fromBufferAttribute(p, j);
        const ruido = 1 + 0.16 * Math.sin(v.x * 9 + v.y * 7) * Math.cos(v.z * 8 - v.y * 5);
        p.setXYZ(j, v.x * ruido, v.y * ruido * 0.85, v.z * ruido);
      }
      g.computeVertexNormals();
      c.add(mat, g, { x: bx, y: by, z: bz, ry: entre(0, 3) });
      bolas.push([bx, by, bz, rr]);
    }
    if (comFlor) {
      const flor = escolher(['flor1', 'flor2', 'flor1', 'flor3']);
      for (let i = 0; i < 16; i++) {
        const [bx, by, bz, rr] = escolher(bolas);
        const th = entre(0, Math.PI * 2);
        const ph = entre(0.1, 1.25);
        c.esfera(flor, entre(0.045, 0.075), 0, {
          x: bx + Math.cos(th) * Math.sin(ph) * rr,
          y: by + Math.cos(ph) * rr * 0.85,
          z: bz + Math.sin(th) * Math.sin(ph) * rr,
        });
      }
    }
  };
  for (const lado of [-1, 1]) {
    for (let z = zIni + 0.4; z < zFim - 0.2; z += entre(0.9, 1.3)) arbusto(lado * (xDeck + entre(0.5, 1.0)), z, entre(0.85, 1.2));
    for (let x = 2.2; x < xDeck + 1.4; x += entre(1.0, 1.4)) arbusto(lado * x, zFim + entre(0.5, 0.9), entre(0.65, 0.9), true);
  }
  for (let x = -xDeck; x < xDeck; x += entre(1.1, 1.5)) arbusto(x, zIni - entre(0.6, 1.1), entre(0.9, 1.25));
  for (let k = 0, feitos = 0; k < 500 && feitos < 50; k++) {
    const a = entre(0, Math.PI * 2);
    const d = entre(6, 40);
    const x = Math.cos(a) * d;
    const z = zCentro + Math.sin(a) * d;
    if (ocupado(x, z, 1.5) || noCaminho(x, z) || naFrenteDaCamera(x, z, 24, 0.3)) continue;
    arbusto(x, z, entre(0.8, 1.5));
    feitos++;
  }
  for (let k = 0; k < 16; k++) {
    const a = entre(0, Math.PI * 2);
    const d = entre(5, 26);
    const x = Math.cos(a) * d;
    const z = zCentro + Math.sin(a) * d;
    if (ocupado(x, z, 1) || noCaminho(x, z) || naFrenteDaCamera(x, z, 32, 0.4)) continue;
    const s = entre(0.3, 0.9);
    c.add('rocha', new THREE.DodecahedronGeometry(s, 1), { x, y: altura(x, z) + s * 0.2, z, ry: entre(0, 3), sy: 0.55 });
  }

  // ---------------------------------------------------------------- árvores de copa redonda (poucas, perto)
  for (let k = 0, feitos = 0; k < 300 && feitos < 10; k++) {
    const a = entre(-1.7, 1.7);
    const d = entre(18, 45);
    const dir = girar(frente, a);
    const x = dir.x * d;
    const z = zCentro + dir.y * d;
    if (ocupado(x, z, 7) || naFrenteDaCamera(x, z, 60, 0.85)) continue;
    const s = entre(1.0, 1.5);
    const y0 = altura(x, z);
    c.cilindro('tronco', 0.2 * s, 0.32 * s, 2.6 * s, 8, { x, y: y0 + 1.3 * s, z });
    const mat = escolher(['folha1', 'folha2', 'folha4']);
    for (let i = 0; i < 6; i++) {
      const g = new THREE.IcosahedronGeometry(entre(1.0, 1.6) * s, 2);
      c.add(mat, g, { x: x + entre(-1, 1) * s, y: y0 + entre(3.0, 4.4) * s, z: z + entre(-1, 1) * s, ry: entre(0, 3) });
    }
    feitos++;
  }

  // ---------------------------------------------------------------- montanhas ao fundo
  for (let i = 0; i < 18; i++) {
    const a = -1.3 + (2.6 * i) / 17 + entre(-0.06, 0.06);
    const dir = girar(frente, a);
    const d = entre(330, 420);
    if (naDirecaoDoSol(dir.x * d, zCentro + dir.y * d, 0.2)) continue;
    c.cone('montanha1', entre(70, 110), entre(70, 115), 9, { x: dir.x * d, y: altura(dir.x * d, zCentro + dir.y * d) + 18, z: zCentro + dir.y * d, ry: entre(0, 3) });
  }
  for (let i = 0; i < 12; i++) {
    const a = -1.2 + (2.4 * i) / 11 + entre(-0.08, 0.08);
    const dir = girar(frente, a);
    const d = entre(480, 560);
    if (naDirecaoDoSol(dir.x * d, zCentro + dir.y * d, 0.12)) continue;
    c.cone('montanha2', entre(110, 160), entre(110, 170), 8, { x: dir.x * d, y: 30, z: zCentro + dir.y * d, ry: entre(0, 3) });
  }

  grupo.add(c.montar('paisagem'));

  // ---------------------------------------------------------------- floresta de pinheiros (instanciada)
  const matPinho = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, flatShading: true });
  const matTronco = new THREE.MeshStandardMaterial({ color: '#4a3324', roughness: 1 });
  const troncoGeo = new THREE.CylinderGeometry(0.13, 0.22, 1.8, 6);
  troncoGeo.translate(0, 0.9, 0);
  const verdes = ['#24402a', '#2b4a2e', '#33543a', '#1f3825', '#3a5c3a', '#2f4f33'].map((h) => new THREE.Color(h));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const posicoes = [];

  // perto: pinheiros detalhados, que fazem sombra
  for (let k = 0; k < 3000 && posicoes.length < 46; k++) {
    const a = entre(-1.9, 1.9);
    const d = entre(15, 60);
    const dir = girar(frente, a);
    const x = dir.x * d;
    const z = zCentro + dir.y * d;
    if (ocupado(x, z, 7) || naFrenteDaCamera(x, z, 70, 0.8)) continue;
    if (Math.abs(a) < 0.55) continue; // deixa o fundo aberto atrás do chalé
    if (dir.dot(esquerda) > 0.15) continue; // e o lado esquerdo, onde o sol se põe
    posicoes.push([x, z, entre(0.9, 1.5)]);
  }
  const pertoGeo = geometriaPinheiro(8, 11, 3);
  const perto = new THREE.InstancedMesh(pertoGeo, matPinho, posicoes.length);
  const troncos = new THREE.InstancedMesh(troncoGeo, matTronco, posicoes.length);
  posicoes.forEach(([x, z, s], i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), entre(0, Math.PI * 2));
    m.compose(new THREE.Vector3(x, altura(x, z) - 0.1, z), q, new THREE.Vector3(s, s * entre(0.9, 1.15), s));
    perto.setMatrixAt(i, m);
    troncos.setMatrixAt(i, m);
    perto.setColorAt(i, escolher(verdes));
  });
  perto.castShadow = true;
  perto.receiveShadow = true;
  troncos.castShadow = true;
  grupo.add(perto, troncos);

  // longe: milhares de pinheiros cobrindo os morros
  const longe = [];
  for (let k = 0; k < 9000 && longe.length < 1700; k++) {
    const a = entre(-1.5, 1.5);
    const d = 95 + (entre(0, 1) ** 0.8) * 230;
    const dir = girar(frente, a);
    const x = dir.x * d;
    const z = zCentro + dir.y * d;
    if (naFrenteDaCamera(x, z, 90, 1.0)) continue;
    if (naDirecaoDoSol(x, z, 0.1)) continue;
    // clareiras irregulares para não parecer um tapete
    if (Math.sin(x * 0.05) * Math.cos(z * 0.043) > 0.55) continue;
    longe.push([x, z, entre(0.8, 1.5)]);
  }
  const longeGeo = geometriaPinheiro(5, 7, 9);
  const floresta = new THREE.InstancedMesh(longeGeo, matPinho, longe.length);
  longe.forEach(([x, z, s], i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), entre(0, Math.PI * 2));
    m.compose(new THREE.Vector3(x, altura(x, z) - 0.3, z), q, new THREE.Vector3(s, s * entre(0.9, 1.25), s));
    floresta.setMatrixAt(i, m);
    floresta.setColorAt(i, escolher(verdes));
  });
  floresta.receiveShadow = true;
  grupo.add(floresta);

  // ---------------------------------------------------------------- tufos de grama e flores no chão (instanciados)
  const laminas = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BufferGeometry();
    const ang = (i / 6) * Math.PI * 2 + r();
    const h = entre(0.13, 0.28);
    const incl = entre(0.05, 0.18);
    const cx = Math.cos(ang);
    const cz = Math.sin(ang);
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      -0.02 * cz, 0, 0.02 * cx,
      0.02 * cz, 0, -0.02 * cx,
      cx * incl, h, cz * incl,
    ], 3));
    g.computeVertexNormals();
    laminas.push(g);
  }
  const tufoGeo = mergeGeometries(laminas);
  const tufoMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide });
  const tufos = [];
  for (let k = 0; k < 45000 && tufos.length < 14000; k++) {
    const a = entre(0, Math.PI * 2);
    const d = 2 + entre(0, 1) ** 0.85 * 28;
    const x = Math.cos(a) * d;
    const z = zCentro + Math.sin(a) * d;
    if (ocupado(x, z, 0.1) || noCaminho(x, z)) continue;
    tufos.push([x, z]);
  }
  const grama = new THREE.InstancedMesh(tufoGeo, tufoMat, tufos.length);
  const verdesGrama = ['#6a8c3c', '#7a9c45', '#5b7d35', '#88a64e', '#668a3f'].map((h) => new THREE.Color(h));
  tufos.forEach(([x, z], i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), entre(0, Math.PI * 2));
    const s = entre(0.7, 1.4);
    m.compose(new THREE.Vector3(x, altura(x, z) - 0.02, z), q, new THREE.Vector3(s, s, s));
    grama.setMatrixAt(i, m);
    grama.setColorAt(i, escolher(verdesGrama));
  });
  grama.receiveShadow = true;
  grupo.add(grama);

  const florGeo = new THREE.IcosahedronGeometry(0.032, 0);
  const florMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true });
  const coresFlor = ['#f4a9bd', '#fbf3e4', '#f6d36b', '#e889a8'].map((h) => new THREE.Color(h));
  const flores = [];
  for (let k = 0; k < 6000 && flores.length < 550; k++) {
    const a = entre(0, Math.PI * 2);
    const d = 2.5 + entre(0, 1) ** 0.8 * 18;
    const x = Math.cos(a) * d;
    const z = zCentro + Math.sin(a) * d;
    if (ocupado(x, z, 0.2) || noCaminho(x, z)) continue;
    if (Math.sin(x * 0.7) * Math.cos(z * 0.6) < 0.2) continue; // em manchas
    flores.push([x, z]);
  }
  const campoFlores = new THREE.InstancedMesh(florGeo, florMat, flores.length);
  flores.forEach(([x, z], i) => {
    m.compose(new THREE.Vector3(x, altura(x, z) + entre(0.15, 0.3), z), q.identity(), new THREE.Vector3(1, 1, 1));
    campoFlores.setMatrixAt(i, m);
    campoFlores.setColorAt(i, escolher(coresFlor));
  });
  grupo.add(campoFlores);

  // ---------------------------------------------------------------- nuvens macias
  const texturas = [texturaNuvem(1), texturaNuvem(2), texturaNuvem(3)];
  const nuvens = [[-0.34, 0.11, 230], [-0.14, 0.17, 300], [0.06, 0.13, 260], [0.22, 0.19, 320], [0.38, 0.12, 240], [-0.55, 0.15, 280], [0.6, 0.16, 300], [-0.02, 0.24, 360], [0.45, 0.25, 340], [-0.4, 0.27, 360]];
  for (const [a, elev, largura] of nuvens) {
    const dir = girar(frente, a + entre(-0.03, 0.03));
    const d = 600;
    const ladoSol = Math.max(0, dir.dot(solPlano));
    const cor = new THREE.Color('#c9b2c4').lerp(new THREE.Color('#ffc58f'), ladoSol ** 3);
    const nuvem = new THREE.Sprite(new THREE.SpriteMaterial({ map: escolher(texturas), color: cor, transparent: true, depthWrite: false, fog: false, opacity: 1 }));
    nuvem.position.set(dir.x * d, Math.tan(elev) * d, zCentro + dir.y * d);
    nuvem.scale.set(largura * 0.75, largura * 0.32, 1);
    nuvem.renderOrder = -0.5;
    grupo.add(nuvem);
  }

  return grupo;
}
