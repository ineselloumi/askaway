# AskAway

A "situation-first" chat experience designed for non-tech-savvy users who don't know what to do with AI and don't think in prompts.

## Product Thesis

Most AI chat interfaces start with an empty text box and the implicit question: "What do you want?" This works for tech-savvy users who understand prompting, but creates anxiety and confusion for everyone else.

**AskAway flips this model.** Instead of asking users to articulate what they want, we start with common situations and guide them through a structured conversation. The interface is calm, the language is simple, and the technology stays invisible.

### Key Principles

1. **No blank prompt box** - Users choose from situation tiles written in plain language
2. **Guided conversation** - One question at a time, using simple words
3. **Confidence and reassurance** - UI messages like "You're doing great" and "Take your time"
4. **Visible progress** - Human-readable loading states like "Reading what you shared..."
5. **Value before payment** - Full result shown before any payment prompt

## Key Flows

### Primary: "Reply to a message"

1. User selects "Reply to a message" tile
2. Pastes or describes the message they received
3. Chooses tone (Warm / Direct / Formal)
4. Chooses goal (Accept / Decline / Clarify / Thank)
5. Gets three draft replies to choose from
6. Can refine with buttons: "Make it shorter" / "Make it kinder" / "Make it clearer"
7. Payment gate only appears when trying to copy (simulated)

### Secondary (stubbed to same flow)

- "Explain a letter"
- "Write an email"
- "Check if something is a scam"
- "Explain a word"

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules (vanilla CSS, no framework)
- **State**: React useState (no external state management)
- **LLM**: Anthropic Claude or OpenAI (configurable via env)
- **Fallback**: Deterministic mock responses when no API key

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd AskAway

# Install dependencies
npm install

# Copy environment file (optional - app works without API keys)
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables (Optional)

The app works out of the box with mock responses. To use a real LLM:

```env
# Choose provider: 'anthropic' or 'openai'
PROVIDER=anthropic

# Add your API key
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

## Project Structure

```
AskAway/
├── app/
│   ├── layout.tsx          # Root layout with skip link
│   ├── page.tsx            # Home page with situation tiles
│   ├── globals.css         # Global styles and CSS variables
│   ├── assist/
│   │   └── page.tsx        # Guided flow (multi-step form)
│   ├── about/
│   │   └── page.tsx        # Design principles page
│   └── api/
│       └── generate/
│           └── route.ts    # LLM API route
├── lib/
│   └── mockGenerator.ts    # Fallback mock responses
├── package.json
├── tsconfig.json
└── README.md
```

## Accessibility Features

- **Large text**: Base font size 18px, headings scale up
- **High contrast**: WCAG AA compliant color palette
- **Large touch targets**: Minimum 48px for all interactive elements
- **Clear focus states**: 3px blue outline on focus
- **Keyboard navigation**: Full support with skip link
- **Screen reader support**: Proper ARIA labels and roles
- **Reduced motion**: Respects `prefers-reduced-motion`

## UX Principles in Practice

| Principle | Where it shows up |
|-----------|-------------------|
| No blank input | Home page starts with 5 situation tiles |
| Guided conversation | Assist page asks one question per step |
| Reassurance | Green "You're doing great" messages throughout |
| Visible progress | Step dots + "Writing your reply..." with explanation |
| Value before payment | Full drafts shown; paywall only on copy action |

## Copy Guidelines

All UI text is written at 6th-8th grade reading level. Avoided words:
- prompt, model, tokens, LLM, generate
- optimize, leverage, unlock, credits
- AI, artificial intelligence, machine learning

Preferred words:
- message, reply, help, draft, try again, make it shorter

## License

MIT - This is a portfolio prototype, not a production application.
