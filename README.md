# Slim Chalés — landing page

Astro 7 + Tailwind 4, página estática com uma única rota de servidor (`/api/contato`) na Vercel.

## Rodar

```bash
npm install
cp .env.example .env   # preencha as chaves
npm run dev            # http://localhost:4321
npm run build          # gera .vercel/output
```

## Antes de publicar: o que ainda falta

O layout segue o protótipo em `referencias/imagens/` (fora de `public/` para não ir ao ar). O protótipo ainda tem o nome antigo, SunChalés; o site é da Slim Chalés. Os textos entre [colchetes] aparecem assim no site até serem trocados:

| O quê | Onde |
|---|---|
| WhatsApp (número e como aparece), e-mail, CNPJ | `src/data/conteudo.ts` → `empresa` |
| O que acompanha "Portas e janelas" e "Projeto e manual de montagem" | `src/data/conteudo.ts` → `itensDoKit` |
| Foto do interior (card "Por dentro") | `src/components/Destaques.astro` |

Kits e preços (sem / com mezanino): Airbnb 15,6 m² (R$ 20.000 / R$ 29.000), Sol 28,2 m² (R$ 29.000 / R$ 57.500) e Rio 50,2 m² (R$ 59.000 / R$ 110.500), conforme a tabela enviada pela empresa. Prazo (60 dias úteis) e frete grátis até 100 km de Aracaju vêm do protótipo.

### Imagens

- Fotos dos chalés: `src/assets/images/chale-a-frame-15m2-kit-airbnb*.jpg` (Kit Airbnb, enviada pela equipe de design), `chale-a-frame-28m2-kit-sol*.jpg` (Kit Sol) e `chale-a-frame-54m2-kit-rio*.jpg` (Kit Rio), em até três versões: 4:3 inteira, quadrada (cards) e, no Rio, um recorte alto para o banner no desktop. O nome do arquivo aparece no endereço final da imagem e ajuda no Google Imagens. Os originais em PNG ficam em `referencias/fotos/`.
- **As duas fotos foram geradas por IA** (o PNG original traz a assinatura C2PA da OpenAI, que some ao converter). Troque por fotos de um chalé construído assim que houver.
- Fotos e textos alternativos ficam num lugar só: `src/data/imagens.ts`. Banner, cards e fotos dos kits saem em AVIF (qualidade 50), com WebP (68) de reserva, pelo componente `src/components/Foto.astro`.
- Plantas (`planta-*.jpg`): as do Sol e do Rio foram recortadas do protótipo; a do Airbnb, da prancha da equipe de design (`referencias/imagens/planta-kit-airbnb-original.png`).
- `logo-slim-chales.png`: logo dourado da Slim Chalés (header e rodapé).

### Vídeo do banner

- Fonte: `referencias/videos/chale-a-frame-original-1080p.mp4` (5,9 s, 1080p). Fica fora de `public/` para não ir ao ar. No site entram só os primeiros 4,4 s: os últimos 1,5 s (cena do deck) foram cortados.
- No site: `public/videos/chale-a-frame-banner-*.mp4`, sem áudio, já recortados no formato do banner: desktop 816×866 e celular 720×540, cada um em AV1 (navegadores novos) e H.264 (os demais). Entre 0,6 e 0,9 MB.
- A foto do Kit Rio aparece primeiro e conta para o LCP. O vídeo só é baixado depois que a página carregou, entra por cima com fade, pausa fora da tela e tem botão de pausar. Com "reduzir movimento" ou "economia de dados" ligados, não toca sozinho.
- Para trocar o vídeo, gere os quatro arquivos com os mesmos nomes. Os comandos do ffmpeg estão abaixo; ajuste o `crop` se o enquadramento mudar.

```bash
D="crop=1018:1080:451:0,scale=816:866:flags=lanczos"   # desktop (recorte alto)
C="crop=1440:1080:240:0,scale=720:540:flags=lanczos"   # celular (4:3)
X264="-c:v libx264 -preset slow -crf 27 -profile:v high -pix_fmt yuv420p -g 48 -movflags +faststart -an"
AV1="-c:v libaom-av1 -crf 38 -b:v 0 -cpu-used 4 -row-mt 1 -pix_fmt yuv420p -g 48 -movflags +faststart -an"
T=4.4167   # duração usada: o original menos os últimos 1,5 s
ffmpeg -i original.mp4 -t $T -vf "$D" $X264 public/videos/chale-a-frame-banner-desktop.mp4
ffmpeg -i original.mp4 -t $T -vf "$C" $X264 public/videos/chale-a-frame-banner-celular.mp4
ffmpeg -i original.mp4 -t $T -vf "$D" $AV1  public/videos/chale-a-frame-banner-desktop-av1.mp4
ffmpeg -i original.mp4 -t $T -vf "$C" $AV1  public/videos/chale-a-frame-banner-celular-av1.mp4
```

### Fora da página (arquivos que sobraram)

A seção 3D não está no protótipo e não aparece na página, mas ainda está no projeto: `src/components/Visualizador3D.astro`, `src/assets/images/3d-kit-*.jpg`, `src/three/`, `src/scripts/model-viewer.ts`, `scripts/gerar-modelos.mjs` e as dependências `three` e `@google/model-viewer`. As pastas `public/models/` e `public/texturas/` já foram apagadas, então o gerador de modelos não funciona mais.

## SEO e compartilhamento

- `<head>` em `src/layouts/Base.astro`: title, description, canonical, robots, Open Graph (WhatsApp, Facebook, Instagram, LinkedIn), X/Twitter, ícones e manifest.
- Dados estruturados (schema.org) em `src/pages/index.astro`: `Organization` (com endereço em Aracaju/SE, fundador e Instagram), `WebSite` e um `Product` por kit, com preço em reais. Telefone e e-mail entram sozinhos quando deixarem de estar [entre colchetes] em `conteudo.ts`.
- `/robots.txt` e `/sitemap.xml` são gerados no build (`src/pages/robots.txt.ts` e `sitemap.xml.ts`). O sitemap lista também as fotos e as plantas (sitemap de imagens do Google). A página `/obrigado` tem `noindex`.
- Fotos para o Google: cada kit tem imagem em 1:1, 4:3 e 16:9 nos dados estruturados, e a página aponta a foto principal (`primaryImageOfPage`). Se o Google vai mostrar miniaturas no resultado, ele decide; isso só aumenta as chances.
- Ícones em `public/`: `favicon.ico` (16, 32 e 48 px), `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png` e os do manifest (`site.webmanifest`). O Google pede favicon em múltiplos de 48 px. Todos saem do símbolo do sol do logo, com traço mais grosso para ler a 16 px.
- `logo-slim-chales-512.png`: logo para o Google (painel da empresa), sobre fundo escuro.

Para indexar:

1. Cadastre `SITE_URL` com o domínio final (ex.: `https://www.slimchales.com.br`). Canonical, Open Graph, sitemap e dados estruturados usam essa URL.
2. No Google Search Console, adicione a propriedade, cole o código da meta tag em `PUBLIC_GOOGLE_SITE_VERIFICATION`, faça o deploy e envie `/sitemap.xml`. Para o Bing, use `PUBLIC_BING_SITE_VERIFICATION`.
3. Teste os dados estruturados em https://search.google.com/test/rich-results e a prévia de compartilhamento em https://developers.facebook.com/tools/debug/.

## Formulário e e-mail

- O formulário envia por `fetch` para `/api/contato` (validação no servidor, honeypot, checagem de origem, Turnstile opcional).
- O e-mail sai pelo Resend para `CONTACT_TO_EMAIL`, com assunto `Novo orçamento — {kit} — {nome}` e reply-to do cliente.
- `CONTACT_FROM_EMAIL` precisa ser de um domínio verificado no Resend.
- Turnstile: preencha `PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` para ligar; deixe vazio para desligar.

## Versão de teste no GitHub Pages

Para validar o design, o site também é publicado em `https://andersonrochaa.github.io/slim-chales/` pelo workflow `.github/workflows/github-pages.yml`, a cada push na `main`.

- Primeira vez: o repositório precisa ser público (ou ter GitHub Pro). Depois, em Settings → Pages → Build and deployment → Source, escolha "GitHub Actions". Se o primeiro workflow falhou antes disso, rode de novo em Actions → "Publicar no GitHub Pages" → "Run workflow".
- Essa versão é só estática: o workflow tira a rota `/api/contato`, o formulário valida os campos mas não envia (aviso de "versão de teste") e a página leva `noindex`, para não competir no Google com o site oficial.
- Os caminhos internos usam `comBase()` (`src/lib/site.ts`), porque no Pages o site fica em `/slim-chales/`. Na Vercel o `base` fica vazio e nada muda.

## Deploy (Vercel)

Importe o repositório na Vercel e cadastre as variáveis do `.env.example` em Settings → Environment Variables. `SITE_URL` é opcional (sem ela, usa o domínio de produção da Vercel).
