# ask away

"ask away" is a website that guides users that are not tech savvy into their first conversations with AI. It connects to Claude API and uses a series of UX and LLM instructions to make the experience of speaking to an LLM easy and intuitive.

## Context

There's a term floating around in AI circles: **"capability overhang"** — the gap between what AI can do today and how most people actually use it.

I noticed it first helping relatives get started on ChatGPT. They'd type a few keywords, get a mediocre answer, and close the tab. Not because AI couldn't help them — but because they didn't know what to ask, or how.

AskAway is my attempt to fix that first interaction.

- No blank input box — users start from common situations in plain language
- Suggested questions at every step, clickable with one tap
- The AI adapts to the user's pace and tries to understand their actual intent

If you're reading this, you're probably not the target user. But you might have a parent, neighbor, or friend who's been curious about AI but hasn't found their way in.

**[Try it →](https://askaway.guide)** — it's completely free.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **LLM**: Claude (Anthropic) or OpenAI, configurable via env

## Getting Started

You'll need an API key from [Anthropic](https://console.anthropic.com) or [OpenAI](https://platform.openai.com).

```bash
git clone https://github.com/ineselloumi/AskAway.git
cd AskAway
npm install
cp .env.example .env.local
```

Edit `.env.local` and add your key:

```env
PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# or OPENAI_API_KEY=sk-... with PROVIDER=openai
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

MIT
