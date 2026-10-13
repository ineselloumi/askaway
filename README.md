# ask away

"ask away" is a website that puts people who are new to AI on rails for their first prompts, then lets them go. It connects to the Claude API and teaches, by doing, what a good ask looks like.

## Context

There's a term floating around in AI circles: **"capability overhang"** — the gap between what AI can do today and how most people actually use it.

I noticed it first helping relatives get started on ChatGPT. They'd type a few keywords, get a mediocre answer, and close the tab. Not because AI couldn't help them — but because they didn't know what to ask, or how.

AskAway is my attempt to fix that first interaction.

- No blank input box: people pick what is on their plate (write something, make sense of something, or hand a job off)
- Two or three tap-to-answer questions build the prompt live, in the spot where the chat box normally sits, so people learn where to type next time
- A readiness fill reads the prompt, rewards the details that make an answer useful, and never blocks sending
- The prompt goes over as the person's own message
- After two guided prompts, people **graduate** to the plain chat box. The goal is that they no longer need AskAway

If you're reading this, you're probably not the target user. But you might have a parent, neighbor, or friend who's been curious about AI but hasn't found their way in.

**[Try it →](https://askaway.guide)**. It's completely free.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **LLM**: Claude, through the official Anthropic SDK
- **Accounts and history**: Supabase (optional)

## Getting Started

```bash
git clone https://github.com/ineselloumi/askaway.git
cd askaway
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no API key the app returns sample answers, so every screen can be clicked through. Add an [Anthropic API key](https://console.anthropic.com) to `.env.local` for real ones. `.env.example` lists every setting.

```bash
npm test
```

runs the unit tests for the guided flow.

## How the guided flow is organised

| Where | What |
|---|---|
| `app/guided/` | The screens: setup, prompt builder, conversation, agent run, graduation |
| `lib/guided/` | The logic, with tests: prompt composition, readiness, graduation gate, agent-run state machine |
| `messages/guided/` | All copy, question options and prompt templates (English only) |
| `app/api/chat` | The conversation. Picks the model on the server |
| `app/api/readiness` | Scores the prompt in progress against four yes/no checks, so the readiness fill reflects what the prompt says. Jev (TypeSafe AI) first, Claude Haiku as fallback |
| `app/api/agent` | "Do things for me" jobs: web research streamed as plain-English steps, with a check-in when the job hits a real fork |

**Rolling back.** The original Ask Away (home page plus `/assist`) is still in the codebase. Set `NEXT_PUBLIC_GUIDED_FLOW=off` and redeploy to switch back. The pre-overhaul version is also preserved as the `v1-askaway` tag and the `legacy/askaway-v1` branch.

## License

MIT
