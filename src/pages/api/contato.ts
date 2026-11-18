import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { opcoesKit, opcoesMezanino, opcoesMontagem } from '../../data/conteudo';

// Esta é a única rota que roda no servidor (função da Vercel). O resto do site é estático.
export const prerender = false;

const KITS = opcoesKit.map((k) => k.valor);
const LIMITE = { nome: 100, whatsapp: 30, email: 254, cidade: 120, mensagem: 2000 };
const LIMITE_CORPO = 16_000; // bytes
const EMAIL_VALIDO = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

type Campos = {
  nome: string;
  whatsapp: string;
  email: string;
  kit: string;
  cidade: string;
  mezanino: string;
  montagem: string;
  mensagem: string;
};

function responder(status: number, corpo: Record<string, unknown>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Uma linha só (sem quebras), sem espaços sobrando.
const linha = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const bloco = (v: unknown) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : '');

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function validar(c: Campos) {
  const erros: Record<string, string> = {};
  if (!c.nome) erros.nome = 'Informe o seu nome.';
  else if (c.nome.length > LIMITE.nome) erros.nome = `Use no máximo ${LIMITE.nome} caracteres.`;

  const digitos = c.whatsapp.replace(/\D/g, '');
  if (!c.whatsapp) erros.whatsapp = 'Informe o seu WhatsApp.';
  else if (c.whatsapp.length > LIMITE.whatsapp || digitos.length < 10 || digitos.length > 13)
    erros.whatsapp = 'Informe um WhatsApp com DDD.';

  if (!c.email) erros.email = 'Informe o seu e-mail.';
  else if (c.email.length > LIMITE.email || !EMAIL_VALIDO.test(c.email)) erros.email = 'Informe um e-mail válido.';

  if (!KITS.includes(c.kit)) erros.kit = 'Escolha um kit ou "Ainda não sei".';

  if (!c.cidade) erros.cidade = 'Informe a cidade do terreno.';
  else if (c.cidade.length > LIMITE.cidade) erros.cidade = `Use no máximo ${LIMITE.cidade} caracteres.`;

  if (!opcoesMezanino.includes(c.mezanino)) erros.mezanino = 'Escolha com ou sem mezanino.';
  if (!opcoesMontagem.includes(c.montagem)) erros.montagem = 'Escolha uma opção de montagem.';

  if (c.mensagem.length > LIMITE.mensagem) erros.mensagem = `Use no máximo ${LIMITE.mensagem} caracteres.`;
  return erros;
}

async function turnstileValido(token: string, ip: string | undefined) {
  const corpo = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY!, response: token });
  if (ip) corpo.set('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: corpo,
      signal: AbortSignal.timeout(8000),
    });
    const dados = (await r.json()) as { success?: boolean };
    return dados.success === true;
  } catch (erro) {
    console.error('[contato] falha ao verificar Turnstile', erro);
    return false;
  }
}

function montarEmail(c: Campos) {
  const linhas: [string, string][] = [
    ['Nome', c.nome],
    ['WhatsApp', c.whatsapp],
    ['E-mail', c.email],
    ['Kit de interesse', c.kit],
    ['Cidade do terreno', c.cidade],
    ['Mezanino', c.mezanino],
    ['Montagem', c.montagem],
    ['Mensagem', c.mensagem || '(sem mensagem)'],
  ];
  const zap = `https://wa.me/${c.whatsapp.replace(/\D/g, '').replace(/^(?!55)(\d{10,11})$/, '55$1')}`;
  const html = `<!doctype html><html lang="pt-BR"><body style="font-family:Arial,sans-serif;color:#1a130f;line-height:1.5">
<h2 style="margin:0 0 16px">Novo pedido de orçamento</h2>
<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;max-width:640px">
${linhas
  .map(
    ([r, v]) =>
      `<tr><th align="left" valign="top" style="border-bottom:1px solid #ddd;white-space:nowrap">${r}</th><td style="border-bottom:1px solid #ddd;white-space:pre-wrap">${escapar(v)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin-top:16px"><a href="${escapar(zap)}">Responder no WhatsApp</a> · ou responda este e-mail para falar com ${escapar(c.nome)}.</p>
</body></html>`;
  const texto = linhas.map(([r, v]) => `${r}: ${v}`).join('\n');
  return { html, texto };
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  // Só aceita envios vindos do próprio site.
  const origem = request.headers.get('origin');
  if (origem) {
    let host = '';
    try {
      host = new URL(origem).host;
    } catch {
      /* origem "null" ou inválida */
    }
    if (host !== url.host) return responder(403, { ok: false, erro: 'Origem não permitida.' });
  }

  const tipo = request.headers.get('content-type') ?? '';
  const ehJson = tipo.includes('application/json');
  const ehFormulario = tipo.includes('application/x-www-form-urlencoded') || tipo.includes('multipart/form-data');
  if (!ehJson && !ehFormulario) return responder(415, { ok: false, erro: 'Formato não suportado.' });

  const bruto = await request.text();
  if (bruto.length > LIMITE_CORPO) return responder(413, { ok: false, erro: 'Mensagem grande demais.' });

  let dados: Record<string, unknown>;
  try {
    dados = ehJson
      ? (JSON.parse(bruto) as Record<string, unknown>)
      : Object.fromEntries(await new Request(request.url, { method: 'POST', headers: { 'content-type': tipo }, body: bruto }).formData());
    if (!dados || typeof dados !== 'object') throw new Error('corpo inválido');
  } catch {
    return responder(400, { ok: false, erro: 'Não foi possível ler o formulário.' });
  }

  // Envio sem JavaScript: devolve para uma página em vez de JSON.
  const finalizar = (ok: boolean, status: number, corpo: Record<string, unknown>) =>
    ehFormulario ? Response.redirect(new URL(ok ? '/obrigado' : '/#contato', url), 303) : responder(status, corpo);

  // Honeypot: robô preencheu o campo escondido. Finge sucesso e não envia nada.
  if (linha(dados.empresa)) return finalizar(true, 200, { ok: true });

  const campos: Campos = {
    nome: linha(dados.nome),
    whatsapp: linha(dados.whatsapp),
    email: linha(dados.email).toLowerCase(),
    kit: linha(dados.kit),
    cidade: linha(dados.cidade),
    mezanino: linha(dados.mezanino),
    montagem: linha(dados.montagem),
    mensagem: bloco(dados.mensagem),
  };

  const erros = validar(campos);
  if (Object.keys(erros).length) {
    return finalizar(false, 422, { ok: false, erro: 'Confira os campos destacados.', campos: erros });
  }

  if (TURNSTILE_SECRET_KEY) {
    const token = linha(dados['cf-turnstile-response']);
    let ip: string | undefined;
    try {
      ip = clientAddress;
    } catch {
      ip = undefined;
    }
    if (!token || !(await turnstileValido(token, ip))) {
      return finalizar(false, 400, { ok: false, erro: 'Não conseguimos confirmar o envio. Aguarde a verificação e tente de novo.' });
    }
  }

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    console.error('[contato] RESEND_API_KEY, CONTACT_TO_EMAIL ou CONTACT_FROM_EMAIL não configurados');
    return finalizar(false, 500, { ok: false, erro: 'O envio está indisponível agora. Fale com a gente pelo WhatsApp.' });
  }

  const { html, texto } = montarEmail(campos);
  const resend = new Resend(RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: CONTACT_FROM_EMAIL,
    to: CONTACT_TO_EMAIL.split(',').map((e) => e.trim()).filter(Boolean),
    replyTo: campos.email,
    subject: `Novo orçamento — ${campos.kit} — ${campos.nome}`,
    html,
    text: texto,
  });

  if (error) {
    console.error('[contato] erro do Resend', error);
    return finalizar(false, 502, { ok: false, erro: 'Não foi possível enviar agora. Tente de novo ou fale pelo WhatsApp.' });
  }

  return finalizar(true, 200, { ok: true });
};
