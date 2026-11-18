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

export type KitId = 'airbnb' | 'sol' | 'rio';

export interface Kit {
  id: KitId;
  nome: string;
  destaque: string; // parte do nome em laranja
  area: string;
  chamada: string;
  resumo: string;
  planta: string;
  /** Preços em reais. O mezanino é opcional em todos os kits. */
  precos: { semMezanino: number; comMezanino: number };
  especificacoes: [rotulo: string, valor: string][];
}

const formatoReal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
/** R$ 29.000 (com espaço que não quebra entre "R$" e o número). */
export const real = (valor: number) => formatoReal.format(valor);

// Ordem do menor para o maior.
export const kits: Kit[] = [
  {
    id: 'airbnb',
    nome: 'Kit Airbnb',
    destaque: 'Airbnb',
    area: '15,6 m²',
    chamada: 'O mais compacto dos três.',
    resumo: 'Compacto, com varanda na frente e pé-direito de 4 m.',
    planta: '3,00 x 4,00 m',
    precos: { semMezanino: 20000, comMezanino: 29000 },
    especificacoes: [
      ['Varanda', '3,00 x 1,20 m (3,6 m²)'],
      ['Pé-direito', '4,00 m'],
      ['Mezanino', 'Opcional'],
    ],
  },
  {
    id: 'sol',
    nome: 'Kit Sol',
    destaque: 'Sol',
    area: '28,2 m²',
    chamada: 'Compacto e funcional.',
    resumo: 'Um quarto, sala e cozinha integradas e varanda na frente.',
    planta: '3,00 x 5,00 m',
    precos: { semMezanino: 29000, comMezanino: 57500 },
    especificacoes: [
      ['Quartos', '1'],
      ['Varanda', '3,00 x 2,00 m (6 m²)'],
      ['Pé-direito', '6,00 m'],
      ['Mezanino', '6,60 m², opcional'],
    ],
  },
  {
    id: 'rio',
    nome: 'Kit Rio',
    destaque: 'Rio',
    area: '50,2 m²',
    chamada: 'Mais espaço para o seu projeto.',
    resumo: 'Dois quartos e uma varanda maior na frente.',
    planta: '4,00 x 8,00 m',
    precos: { semMezanino: 59000, comMezanino: 110500 },
    especificacoes: [
      ['Quartos', '2'],
      ['Varanda', '4,00 x 2,00 m (8 m²)'],
      ['Pé-direito', '6,00 m'],
      ['Mezanino', '10,2 m², opcional'],
    ],
  },
];

/** Menor preço entre todos os kits (sem mezanino). */
export const precoInicial = Math.min(...kits.map((k) => k.precos.semMezanino));

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
    texto: 'Airbnb, Sol ou Rio, conforme o espaço que você precisa.',
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
  ...kits.map((k) => ({ valor: k.nome, texto: `${k.nome}, ${k.area}` })),
  { valor: 'Ainda não sei', texto: 'Ainda não sei' },
];

export const opcoesMezanino = ['Com mezanino', 'Sem mezanino', 'Ainda não sei'];

// Textos curtos para caber no select em celulares de 360 px.
export const opcoesMontagem = [
  'Quero orçar a montagem Slim Chalés',
  'Vou montar com a minha equipe',
  'Ainda não decidi',
];
