// Dados da Slim Chalés, conforme o protótipo da landing page.
// O que está entre [colchetes] ainda falta confirmar com a empresa e aparece assim no site:
// troque antes de publicar.

export const empresa = {
  nome: 'Slim Chalés',
  descricao: 'Kits de chalés A-frame em madeira de lei, com telhas ecológicas.',
  whatsapp: '5500000000000', // [NÚMERO] DDI + DDD + número, só dígitos. Ex.: 5579999999999
  whatsappExibicao: '[NÚMERO]', // como o número aparece no rodapé. Ex.: (79) 99999-9999
  email: '[E-MAIL]',
  cnpj: '[00.000.000/0000-00]',
  cidade: 'Aracaju/SE',
  localidade: 'Aracaju',
  uf: 'SE',
  mensagemWhatsapp: 'Olá! Vim pelo site e quero um orçamento de kit de chalé A-frame.',
};

export const linkWhatsapp = `https://wa.me/${empresa.whatsapp}?text=${encodeURIComponent(empresa.mensagemWhatsapp)}`;

const perfil = (usuario: string) => ({ usuario, url: `https://www.instagram.com/${usuario}/` });

export const instagram = {
  principal: perfil('slimchalesoficial_'),
  slimImoveis: perfil('slimimoveis'),
  fundador: { nome: 'Marcos Slim', ...perfil('marcos.slim') },
};

export const entrega = {
  prazo: '60 dias úteis',
  freteGratis: 'até 100 km de Aracaju',
};

export type KitId = 'sol' | 'rio';

export interface Kit {
  id: KitId;
  nome: string;
  destaque: string; // parte do nome em laranja
  area: string;
  chamada: string;
  resumo: string;
  preco: string;
  valor: number; // preço em reais, para os dados estruturados do Google
  planta: string;
  especificacoes: [rotulo: string, valor: string][];
}

export const kits: Kit[] = [
  {
    id: 'sol',
    nome: 'Kit Sol',
    destaque: 'Sol',
    area: '28,5 m²',
    chamada: 'Compacto e funcional.',
    resumo: 'Um quarto, sala e cozinha integradas e varanda na frente.',
    preco: 'R$ 29.000',
    valor: 29000,
    planta: '3,00 x 5,00 m',
    especificacoes: [
      ['Quartos', '1'],
      ['Sala', 'Integrada'],
      ['Cozinha', 'Integrada'],
      ['Varanda', 'Frontal'],
    ],
  },
  {
    id: 'rio',
    nome: 'Kit Rio',
    destaque: 'Rio',
    area: '54 m²',
    chamada: 'Mais espaço para o seu projeto.',
    resumo: 'Dois quartos e uma varanda maior na frente.',
    preco: 'R$ 59.000',
    valor: 59000,
    planta: '4,00 x 8,00 m',
    especificacoes: [
      ['Quartos', '2'],
      ['Sala', 'Integrada'],
      ['Cozinha', 'Integrada'],
      ['Varanda', 'Frontal maior'],
    ],
  },
];

export const itensDoKit = [
  {
    titulo: 'Estrutura em madeira de lei',
    texto: 'O chalé é todo feito em madeira de lei.',
  },
  {
    titulo: 'Telhas ecológicas',
    texto: 'Cobertura mais sustentável e durável.',
  },
  {
    titulo: 'Portas e janelas',
    texto: '[Confirme o que acompanha: esquadrias, vidros, ferragens]',
  },
  {
    titulo: 'Projeto e manual de montagem',
    texto: '[Confirme se inclui projeto, manual e suporte]',
  },
];

export const passos = [
  {
    titulo: 'Escolha o kit',
    texto: 'Sol ou Rio, conforme o espaço que você precisa.',
  },
  {
    titulo: 'Peça o orçamento',
    texto: 'Pelo formulário ou WhatsApp, com a cidade do terreno.',
  },
  {
    titulo: 'Receba o kit',
    texto: `Entrega em até ${entrega.prazo} após o pagamento. Frete grátis ${entrega.freteGratis}.`,
  },
  {
    titulo: 'Monte o seu chalé',
    texto: 'Com a sua equipe ou com a nossa. A montagem Slim Chalés é opcional e orçada à parte.',
  },
];

// Opções do formulário. A API valida contra estas mesmas listas.
export const opcoesKit = [
  ...kits.map((k) => ({ valor: k.nome, texto: `${k.nome}, ${k.area}, ${k.preco}` })),
  { valor: 'Ainda não sei', texto: 'Ainda não sei' },
];

// Textos curtos para caber no select em celulares de 360 px.
export const opcoesMontagem = [
  'Quero orçar a montagem Slim Chalés',
  'Vou montar com a minha equipe',
  'Ainda não decidi',
];
