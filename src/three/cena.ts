// Cena completa do banner: chalé + paisagem + céu de fim de tarde, com texturas reais (CC0, Poly Haven).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { criarChale, KITS } from './chale.js';
import { criarPaisagem } from './paisagem.js';

export type KitId = 'sol' | 'rio';

export interface Vista {
  az: number; // graus; 0 = de frente, negativo = câmera à esquerda
  el: number; // graus
  dist: number;
  alvoY: number;
  alvoZ: number;
  fov: number; // fov vertical no aspecto de referência
  aspecto: number; // aspecto de referência (o poster é renderizado nele)
}

export const VISTAS: Record<'hero' | 'foto', Record<KitId, Vista>> = {
  hero: {
    rio: { az: -24, el: -1, dist: 22.5, alvoY: 3.6, alvoZ: 1.4, fov: 34, aspecto: 1 },
    sol: { az: -24, el: -1, dist: 17.8, alvoY: 2.8, alvoZ: 1.1, fov: 34, aspecto: 1 },
  },
  foto: {
    rio: { az: -30, el: 3, dist: 24, alvoY: 3.3, alvoZ: 1.4, fov: 32, aspecto: 4 / 3 },
    sol: { az: -30, el: 3, dist: 18.5, alvoY: 2.6, alvoZ: 1.0, fov: 32, aspecto: 4 / 3 },
  },
};

const rad = THREE.MathUtils.degToRad;

const CORES = {
  topo: '#2c5aa3',
  meio: '#e3a97f',
  horizonte: '#ffb35a',
  sol: '#ffd9a0',
  neblina: '#c9a493',
};

function criarCeu(solDir: THREE.Vector3) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTopo: { value: new THREE.Color(CORES.topo) },
      uMeio: { value: new THREE.Color(CORES.meio) },
      uHorizonte: { value: new THREE.Color(CORES.horizonte) },
      uSol: { value: new THREE.Color(CORES.sol) },
      uSolDir: { value: solDir.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTopo; uniform vec3 uMeio; uniform vec3 uHorizonte; uniform vec3 uSol; uniform vec3 uSolDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        float lado = max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), normalize(vec3(uSolDir.x, 0.0, uSolDir.z))), 0.0);
        vec3 horiz = mix(mix(uMeio, uHorizonte, 0.6), uHorizonte * 1.15, pow(lado, 2.0));
        vec3 c = mix(horiz, uMeio, smoothstep(0.0, 0.09, h));
        c = mix(c, uTopo, smoothstep(0.05, 0.38, h));
        float s = max(dot(d, normalize(uSolDir)), 0.0);
        c += uSol * (pow(s, 16.0) * 0.24 + pow(s, 140.0) * 0.7 + pow(s, 3000.0) * 16.0);
        if (h < 0.0) c = horiz;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), material);
  ceu.renderOrder = -1;
  ceu.frustumCulled = false;
  return ceu;
}

export function configurarRenderer(renderer: THREE.WebGLRenderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
}

/** Carrega as texturas (cor, relevo e rugosidade) de todos os materiais que pedem uma. */
async function aplicarTexturas(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const loader = new THREE.TextureLoader();
  const anisotropia = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const cache = new Map<string, Promise<THREE.Texture>>();
  const carregar = (nome: string, tipo: 'cor' | 'normal' | 'rugosidade') => {
    const chave = `${nome}-${tipo}`;
    if (!cache.has(chave)) {
      cache.set(
        chave,
        loader.loadAsync(`/texturas/${chave}.webp`).then((t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.anisotropy = anisotropia;
          if (tipo === 'cor') t.colorSpace = THREE.SRGBColorSpace;
          return t;
        }),
      );
    }
    return cache.get(chave)!;
  };
  const tarefas: Promise<void>[] = [];
  scene.traverse((o) => {
    const material = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    const tex = material?.userData?.textura as { nome: string; tinta?: string } | undefined;
    if (!material || !tex) return;
    tarefas.push(
      Promise.all([carregar(tex.nome, 'cor'), carregar(tex.nome, 'normal'), carregar(tex.nome, 'rugosidade')]).then(([cor, normal, rug]) => {
        material.map = cor;
        material.normalMap = normal;
        material.normalScale.set(0.8, 0.8);
        material.roughnessMap = rug;
        material.color.set(tex.tinta ?? '#ffffff');
        material.needsUpdate = true;
      }),
    );
  });
  await Promise.all(tarefas);
}

export async function montarCena(kit: KitId, renderer: THREE.WebGLRenderer, nomeVista: 'hero' | 'foto' = 'hero') {
  const vista = VISTAS[nomeVista][kit];
  const scene = new THREE.Scene();

  // direção "para o fundo" vista pela câmera, e a esquerda dela
  const az = rad(vista.az);
  const frente = new THREE.Vector2(-Math.sin(az), -Math.cos(az));
  const esquerda = new THREE.Vector2(frente.y, -frente.x);

  // o disco do sol aparece baixo, à esquerda do quadro, se pondo atrás dos morros
  const a = rad(11);
  const solNoCeu = new THREE.Vector3(
    frente.x * Math.cos(a) + esquerda.x * Math.sin(a),
    Math.sin(rad(7)),
    frente.y * Math.cos(a) + esquerda.y * Math.sin(a),
  ).normalize();
  // a luz principal vem mais de lado, para desenhar o telhado e a madeira
  const luzAz = rad(vista.az - 120);
  const luzEl = rad(10);
  const luzDir = new THREE.Vector3(Math.sin(luzAz) * Math.cos(luzEl), Math.sin(luzEl), Math.cos(luzAz) * Math.cos(luzEl));

  const ceu = criarCeu(solNoCeu);
  scene.add(ceu);
  scene.fog = new THREE.Fog(CORES.neblina, 90, 900);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const cenaCeu = new THREE.Scene();
  cenaCeu.add(new THREE.Mesh(ceu.geometry, ceu.material));
  scene.environment = pmrem.fromScene(cenaCeu, 0, 1, 3000).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.6;

  const { grupo, luzes, dims } = criarChale(kit);
  scene.add(grupo);
  scene.add(criarPaisagem({ ...dims, camAz: az, solDir: solNoCeu }));

  scene.add(new THREE.HemisphereLight('#bfcbe8', '#5a4632', 0.8));

  const centro = new THREE.Vector3(0, 2, (dims.zIni + dims.zFim) / 2);
  const sol = new THREE.DirectionalLight('#ffb27a', 3.4);
  sol.position.copy(centro).addScaledVector(luzDir, 70);
  sol.target.position.copy(centro);
  sol.castShadow = true;
  const alcance = Math.max(dims.W, dims.D + dims.P) * 1.1 + 8;
  Object.assign(sol.shadow.camera, { left: -alcance, right: alcance, top: alcance, bottom: -alcance, near: 25, far: 130 });
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.radius = 3;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  scene.add(sol, sol.target);

  // luz quente rebatida na fachada (sem sombra)
  const rebatida = new THREE.DirectionalLight('#ffc596', 0.7);
  rebatida.position.set(Math.sin(az - 0.5) * 50, 12, Math.cos(az - 0.5) * 50);
  scene.add(rebatida);

  for (const l of luzes) {
    const p = new THREE.PointLight(l.cor, l.intensidade, l.alcance, 1.6);
    p.position.set(l.x, l.y, l.z);
    scene.add(p);
  }

  await aplicarTexturas(scene, renderer);

  const camera = new THREE.PerspectiveCamera(vista.fov, vista.aspecto, 0.3, 4000);
  posicionarCamera(camera, vista, 0, 0);
  return { scene, camera, vista, nome: KITS[kit].nome };
}

/** Pós-processamento: brilho suave só no que é muito claro (luzes acesas e sol). */
export function criarComposer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const tamanho = renderer.getDrawingBufferSize(new THREE.Vector2());
  const alvo = new THREE.WebGLRenderTarget(tamanho.x, tamanho.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, alvo);
  composer.setPixelRatio(1); // o alvo já está no tamanho real em pixels
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(tamanho.x, tamanho.y), 0.24, 0.45, 1.15));
  composer.addPass(new OutputPass());
  return composer;
}

/** Coloca a câmera na vista, com um pequeno desvio (graus) escolhido pela pessoa. */
export function posicionarCamera(camera: THREE.PerspectiveCamera, v: Vista, dAz: number, dEl: number) {
  const az = rad(v.az + dAz);
  const el = rad(v.el + dEl);
  const alvo = new THREE.Vector3(0, v.alvoY, v.alvoZ);
  camera.position.set(
    alvo.x + v.dist * Math.sin(az) * Math.cos(el),
    alvo.y + v.dist * Math.sin(el),
    alvo.z + v.dist * Math.cos(az) * Math.cos(el),
  );
  camera.lookAt(alvo);
}

/** Enquadra como `object-fit: cover` sobre o aspecto de referência (igual ao poster). */
export function enquadrar(camera: THREE.PerspectiveCamera, aspecto: number, v: Vista) {
  camera.aspect = aspecto;
  camera.fov =
    aspecto >= v.aspecto ? THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(rad(v.fov) / 2) * v.aspecto) / aspecto)) : v.fov;
  camera.updateProjectionMatrix();
}

/** Renderiza uma imagem estática da cena (usado para gerar o poster e as fotos provisórias). */
export async function renderizarPNG(opcoes: { kit: KitId; vista: 'hero' | 'foto'; largura: number; altura: number; pixelRatio?: number }) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(opcoes.pixelRatio ?? 1);
  renderer.setSize(opcoes.largura, opcoes.altura, false);
  configurarRenderer(renderer);
  const { scene, camera, vista } = await montarCena(opcoes.kit, renderer, opcoes.vista);
  enquadrar(camera, opcoes.largura / opcoes.altura, vista);
  const composer = criarComposer(renderer, scene, camera);
  composer.render();
  const url = canvas.toDataURL('image/png');
  renderer.dispose();
  return url;
}
