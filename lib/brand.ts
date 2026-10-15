// AskAway ships as two sites from this one codebase:
//
//   claude.askaway.guide   answers with Anthropic's Claude models, orange accent
//   chatgpt.askaway.guide  answers with OpenAI's GPT models, teal accent
//
// Everything else (the guided flow, Jev, copy, storage) is shared. Each site is
// its own deployment with NEXT_PUBLIC_BRAND set; it is read at build time, so
// change it and redeploy rather than switching per request.

export type BrandId = 'claude' | 'chatgpt';

export interface Brand {
  id: BrandId;
  domain: string;
  /** The company whose models answer, as named in the privacy policy and terms. */
  provider: string;
  providerUrl: string;
  /** The model family, as named to people who ask what is under the hood. */
  family: string;
}

const BRANDS: Record<BrandId, Brand> = {
  claude: {
    id: 'claude',
    domain: 'claude.askaway.guide',
    provider: 'Anthropic',
    providerUrl: 'https://www.anthropic.com',
    family: 'Claude',
  },
  chatgpt: {
    id: 'chatgpt',
    domain: 'chatgpt.askaway.guide',
    provider: 'OpenAI',
    providerUrl: 'https://openai.com',
    family: 'GPT',
  },
};

export const BRAND: Brand = BRANDS[process.env.NEXT_PUBLIC_BRAND === 'chatgpt' ? 'chatgpt' : 'claude'];
