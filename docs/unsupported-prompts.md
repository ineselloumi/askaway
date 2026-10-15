# Suggested prompts we can't fully deliver on

An inventory of the suggested prompts, quick answers and card copy on the current site (the guided flow) that promise more than the app can do today.

Web search exists only in "Do things for me". Write something, Make sense of something and the plain chat have no web access.

## What the app can actually do

| Path | Route | Can | Can't |
|---|---|---|---|
| Write something, Make sense of something, plain chat | `/api/chat` | Text the person types or pastes, up to 5 photos | Browse the web or open links, read PDF or Word files, reach any account (email, calendar, drive), send anything, make files or images |
| Do things for me | `/api/agent` | Search the public web and read up to 5 pages, **or** read one pasted or attached `.csv` / `.tsv` / `.txt` (under 60,000 characters) | Make files (decks, spreadsheets), read `.xlsx` or Google Sheets, reach any account or private company data, sign in, pay or send |

Note: "Organize my emails" does not appear anywhere in this codebase. If it shows on the live site, the deployment is running different code from `main`.

## Home screen (guided flow)

### Not supported

| # | Where the user sees it | Copy | Gap | Source |
|---|---|---|---|---|
| 1 | Summary flow, prompt box hint | "paste the notes, document **or a link** here …" | The chat can't open links. A pasted URL gets an answer from memory, or a guess. | `messages/guided/en.json:328`, `app/api/chat/route.ts` (FORMAT: "You cannot browse the web") |
| 2 | "Do things for me" card | "**builds a deck**" | No slide file is made. The agent writes the slides out as text in the chat ("Slide 1: Title" plus bullets). | `messages/guided/en.json:29`, `app/api/agent/route.ts` (JOBS.deck) |
| 3 | Idea chip | "Build a slide deck for my quarterly review" | Same as #2. A quarterly business review also needs the company's own numbers, which the agent can't reach: it can only search the public web. | `messages/guided/en.json:45-48` |
| 4 | Deck flow answer | "Key metrics" | No access to internal metrics. Unless the person types them in, the agent has nothing to work from. | `messages/guided/en.json:502-504` |

### Partly supported (works only in a narrower way than the copy suggests)

| # | Where | Copy | Gap | Source |
|---|---|---|---|---|
| 5 | "Do things for me" card, idea chip, flow option | "analyzes a spreadsheet", "Pull insights from a sales spreadsheet", "Analyze a spreadsheet" | Only `.csv` / `.tsv` / `.txt` under 60,000 characters. Excel (`.xlsx`) and Google Sheets links are rejected, and most people's spreadsheets are in those formats. | `messages/guided/en.json:29,49-52,404-406,84,87`, `app/guided/BuilderScreen.tsx:262` |
| 6 | "Make sense of something" card | "a contract, **a document**, meeting notes" | No document upload. The person has to paste the text or photograph the pages. The only attach buttons are photos (chat) and `.csv` (spreadsheet job). | `messages/guided/en.json:24-25`, `app/guided/Conversation.tsx:650` |
| 7 | Idea chip | "Explain the key terms in a contract" | Same as #6. Contracts usually arrive as PDFs. | `messages/guided/en.json:53-56` |
| 8 | Explain flow prompt box hint | "paste the document or describe it here …" | Same as #6. | `messages/guided/en.json:300` |

### Supported, if the person types the details in

These work, but only from what the person writes. Nothing connects to their calendar, meeting recordings, Slack, Jira or email. The suggestion chips ("what we discussed", "what got done") already prompt for this. They're listed so that no one adds copy that implies otherwise.

- "Write a follow-up email after a client meeting" (`messages/guided/en.json:33-36`): drafts the email only. It can't read the meeting or send the email.
- "Draft a weekly status update for my manager" (`:37-40`)
- "Turn meeting notes into action items" (`:57-60`): pasted notes only, no transcript or audio.
- "Works with our tools" constraint (`:453-456`, `:591-594`): the agent doesn't know their tools unless they're named.

### Typed jobs aren't screened

In "Do things for me" the person can type their own job (`custom` variant). Nothing stops "organize my inbox" or "book a table". The shared system prompt (`lib/server/claude.ts`, IDENTITY) tells the model to decline these, but only after the person has gone through the permission screen and started a web job.
