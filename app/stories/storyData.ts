// ─── Story conversation data ──────────────────────────────────────────────────
// Each story maps to a read-only demo chat shown when a user clicks a card.
// `role: 'user'`      → the example person (Maria, Tom, …)
// `role: 'assistant'` → ask away's response
//
// Markdown supported in assistant messages:
//   ## Heading   →  section title
//   ### Heading  →  sub-heading
//   * item       →  bullet
//   **text**     →  bold inline
//   🎟️ …        →  rendered as a callout line

export interface StoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Story {
  id: string;
  person: string;
  subtitle: string;
  /** Situation to land on when user clicks "Try it yourself" */
  situation: string;
  messages: StoryMessage[];
}

export const stories: Record<string, Story> = {

  // ── Maria — Paris trip ────────────────────────────────────────────────────
  maria: {
    id: 'maria',
    person: 'Maria',
    subtitle: 'How Maria planned her ideal trip to Paris',
    situation: 'trip',
    messages: [
      {
        role: 'user',
        content:
          "I'm planning a 4-day trip to Paris in June and need help planning an itinerary. I'm into art and history, traveling with my cousin Frankie, and our budget is flexible. We'll be staying near the Notre Dame cathedral.\n\nCan you map out each day with morning, afternoon, and evening activities? Also throw in restaurant suggestions near wherever we will be, anything I should book ahead of time, and any tips for beating the crowds.",
      },
      {
        role: 'assistant',
        content: `## Day 1 — The Historic Heart (you're already in the best spot)
### Morning
Start at Notre Dame Cathedral — by June 2026 it's fully reopened and stunning. Get there by 8:30 AM before the crowds hit. Walk across to Sainte-Chapelle right after (the stained glass is best in morning light).
### Afternoon
Cross to the Left Bank and explore Saint-Germain-des-Prés — browse galleries, pop into the Musée de Cluny (medieval art, incredible tapestries), and wander the narrow streets.
### Evening
Dinner in Saint-Germain. Try Allard — classic old-school Parisian bistro, been there since 1931. Then an evening walk along the Seine as the sun sets (it won't set until nearly 10 PM).
🎟️ Book ahead: Sainte-Chapelle timed entry

## Day 2 — The Louvre + Palais Royal
### Morning
The Louvre — book the first entry slot (9 AM). Focus on 2-3 wings max or you'll burn out. Richelieu wing for French history, Denon for the big hitters.
### Afternoon
Walk to the Palais Royal gardens to decompress, then explore the Marais — hit Place des Vosges (Paris's oldest square) and duck into small galleries along Rue de Bretagne.
### Evening
Dinner in the Marais. Breizh Café does exceptional Breton crepes and galettes — sounds simple, tastes incredible. Lively neighborhood for an after-dinner walk.
🎟️ Book ahead: Louvre timed entry (sells out weeks ahead in June)

## Day 3 — Versailles Day Trip
### Morning
Take the RER C from Saint-Michel (10 min walk from Notre Dame) to Versailles — aim to arrive when gates open at 9 AM. Head straight to the gardens before the palace crowds build.
### Afternoon
Do the palace interior after lunch. The Hall of Mirrors, the King's apartments, the whole thing. Budget about 5-6 hours total for the day.
### Evening
Back in Paris by early evening. Easy, relaxed dinner near Notre Dame — Les Deux Magots for the iconic café experience, or Au Vieux Paris d'Arcole right in the shadow of the cathedral for solid French classics.
🎟️ Book ahead: Versailles timed entry — absolutely essential in June

## Day 4 — Montmartre + Musée d'Orsay
### Morning
Head to Montmartre early — Sacré-Cœur at 8:30 AM before the tourist wave arrives. Wander the village streets around Place du Tertre, find a café for a slow breakfast.
### Afternoon
Head back south to the Musée d'Orsay (Impressionism, post-Impressionism — this one will be the highlight for art lovers). The building alone is worth it.
### Evening
Splurge dinner to close out the trip. Septime in the 11th is one of Paris's best restaurants — creative, seasonal, not stuffy. Book well in advance. Or if you want something more classic, Le Comptoir du Relais near Saint-Germain.
🎟️ Book ahead: Musée d'Orsay timed entry + dinner reservation

## General Tips for Beating the Crowds

* Arrive at every major site right at opening — the difference between 9 AM and 11 AM is enormous in June
* Get a Navigo Easy card for metro/RER — way easier than buying individual tickets
* Most museums are free the first Sunday of the month — worth timing if it lands in your trip
* Avoid the Eiffel Tower unless it's a priority — the lines in June are brutal and it eats a half day`,
      },
    ],
  },

  // ── Tom — bank scam ───────────────────────────────────────────────────────
  tom: {
    id: 'tom',
    person: 'Tom',
    subtitle: 'How Tom caught a scammer targeting his bank account',
    situation: 'explain',
    messages: [
      {
        role: 'user',
        content:
          `I received this email yesterday, is it legitimate?

From: security-alert@hsbc-support-center.com
Subject: ⚠️ Urgent: Suspicious activity detected on your account

Hi Tom,

We detected unusual sign-in activity on your HSBC account ending in 3486. To protect your account, we have temporarily limited access.

Please verify your identity within 24 hours to restore full access:

👉 **Verify my account now**

If you do not verify, your account will be permanently suspended.

HSBC Security Team`,
      },
      {
        role: 'assistant',
        content: `This is a phishing email. Do not click any links in it. Here's why it's clearly fraudulent:

The sender domain is fake. Bank of America's real domain is bankofamerica.com. This email comes from bankofamerica-support-center.com — a completely different domain designed to look legitimate at a glance.

## The tactics are classic phishing patterns
* Artificial urgency ("24 hours" or "permanently suspended")
* Threats of account loss to pressure you into acting fast without thinking
* Emoji in the subject line to grab attention
* A vague "unusual activity" claim with just enough detail (last 4 digits) to seem credible

## The last 4 digits don't mean much
Scammers can obtain partial account numbers from data breaches or simply guess — this detail is meant to make the email feel personalized and trustworthy.

## What to do
* Don't click any links in the email
* Mark it as phishing/spam in your email client
* If you're genuinely worried about your BofA account, go directly to bankofamerica.com by typing it in your browser, or call the number on the back of your card
* You can also forward phishing emails to abuse@bankofamerica.com`,
      },
    ],
  },

  // ── Hannah — sleep habits ─────────────────────────────────────────────────
  hannah: {
    id: 'hannah',
    person: 'Hannah',
    subtitle: 'How Hannah improved her sleep habits',
    situation: 'health',
    messages: [
      {
        role: 'user',
        content: 'I have been having trouble falling asleep and staying asleep. I often wake up at 3 or 4 am and struggle to fall back asleep. What can I do to improve my sleep?',
      },
      {
        role: 'assistant',
        content: `Sleep trouble like yours — especially that early-morning waking — is really common and usually very responsive to behavioral changes. Here's what tends to work best:

## Sleep hygiene basics
* Avoid screens or bright overhead lights in the 1–2 hours before bed.
* Keep your bedroom cool (around 65–68°F is ideal for most people), dark, and quiet.
* Keep a consistent wake time every day, even weekends.
* Get bright light (ideally sunlight) within an hour of waking.

## When you wake at 3–4am
The worst thing you can do is lie in bed anxiously trying to force sleep — this trains your brain to associate the bed with wakefulness. Instead:

* Avoid checking your phone or clock — knowing the exact time tends to spike anxiety.
* If you've been awake for more than 20 minutes, get up and do something calm in dim light (reading a physical book, light stretching) until you feel sleepy again.
* Try slow, diaphragmatic breathing (inhale 4 counts, exhale 6–8 counts) to calm your nervous system.

## Daytime habits that affect nighttime sleep
* Avoid caffeine after noon or 1pm — its half-life is 5–7 hours, so afternoon coffee is still in your system at midnight.
* Limit alcohol. It helps you fall asleep but fragments sleep in the second half of the night, which is likely contributing to your 3–4am waking.
* Regular exercise improves sleep quality significantly, but try to finish intense workouts at least 2–3 hours before bed.

## Wind-down routine
A consistent 30–60 minute pre-bed routine signals to your brain that sleep is coming. This might include a warm shower (the subsequent body temperature drop promotes sleepiness), light reading, or gentle stretching.`,
      },
    ],
  },

  // ── Juan — seasonal allergies ─────────────────────────────────────────────
  juan: {
    id: 'juan',
    person: 'Juan',
    subtitle: 'How Juan got guidance about his medical symptoms',
    situation: 'health',
    messages: [
      {
        role: 'user',
        content: 'Every spring I tend to get a runny nose, itchy eyes, and an itchy throat. I frequently sneeze. Thankfully I don\'t have any fever. Are these the symptoms of a cold?',
      },
      {
        role: 'assistant',
        content: `These symptoms sound much more like seasonal allergies (allergic rhinitis, commonly called "hay fever") than a cold. Here's why:

The pattern you're describing — happening every spring, with a runny nose, itchy eyes, itchy throat, and sneezing — is the classic presentation of seasonal allergies.

## What points toward allergies, not a cold
* It happens every spring, which aligns with pollen seasons (tree pollen peaks in spring)
* Itchiness — of the eyes and throat especially — is a hallmark of allergic reactions, not viral infections
* No fever, which is more common with colds
* Colds typically resolve in 7–10 days; if your symptoms last weeks, that strongly points to allergies

## How they differ from a cold
* Colds often come with body aches, fatigue, and sometimes a sore throat (rather than an itchy one)
* Cold symptoms tend to evolve over days (getting worse, then better); allergy symptoms stay consistent while you're exposed to the trigger
* Colds are caused by a virus; allergies are your immune system reacting to pollen or other airborne triggers

## What you might consider
* Over-the-counter antihistamines (like cetirizine or loratadine) and nasal corticosteroid sprays are often very effective for seasonal allergy symptoms
* Tracking when your symptoms start and stop each year can help confirm the pattern
* If symptoms are significantly affecting your quality of life, an allergist can do skin or blood testing to identify your specific triggers and discuss options like immunotherapy

That said, I'm not a doctor, and it's worth mentioning this pattern to your physician — especially if you haven't already — so they can confirm the diagnosis and recommend the best treatment for you.`,
      },
    ],
  },

  // ── Nicolas — dairy-free lasagna ─────────────────────────────────────────
  nicolas: {
    id: 'nicolas',
    person: 'Nicolas',
    subtitle: 'How Nicolas found a lasagna recipe adapted to his allergies',
    situation: 'recipe',
    messages: [
      {
        role: 'user',
        content: 'Can you share a lasagna recipe that is adapted for lactose intolerant people? Please use ingredients I can easily find.',
      },
      {
        role: 'assistant',
        content: `## Dairy-Free Lasagna
A hearty, crowd-pleasing lasagna made without any dairy — you won't miss it!

## Ingredients for 6 servings
* 12 lasagna noodles
* 2 tablespoons olive oil
* 1 yellow onion, diced
* 4 garlic cloves, minced
* 500g ground beef or Italian sausage
* 1 can crushed tomatoes (28 oz)
* 2 tablespoons tomato paste
* 1 tsp dried oregano
* 1 tsp dried basil
* 1 tsp salt
* ½ tsp black pepper
* 200g raw cashews, soaked 4h or overnight
* 240ml water
* 2 tablespoons lemon juice
* 3 tablespoons nutritional yeast
* 200g dairy-free mozzarella (e.g. Violife or Daiya), shredded

## Steps
1 — Cook the noodles: Boil lasagna noodles according to package directions until al dente. Drain, drizzle with a little olive oil to prevent sticking, and set aside.

2 — Make the meat sauce: Heat olive oil in a large skillet over medium heat. Add the onion and cook until softened, about 7 minutes. Add garlic and cook 1 more minute. Add the ground beef or sausage and cook until browned, breaking it up as it cooks. Drain excess fat.

3 — Simmer the sauce: Stir in the crushed tomatoes, tomato paste, oregano, basil, salt, and pepper. Simmer on low heat for 15 minutes, stirring occasionally.

4 — Make the cashew cream: Drain the soaked cashews and blend with the water, lemon juice, and nutritional yeast until completely smooth and creamy. This is your dairy-free ricotta substitute. Season with a pinch of salt to taste.

5 — Preheat the oven: Preheat to 190°C (375°F).

6 — Assemble: In a 9×13 inch baking dish, spread a thin layer of meat sauce on the bottom. Layer 3–4 noodles, then ⅓ of the cashew cream, then ⅓ of the meat sauce. Repeat for 3 layers total. Finish with remaining meat sauce and top evenly with the shredded dairy-free mozzarella.

7 — Bake covered: Cover tightly with foil and bake for 30 minutes.

8 — Bake uncovered: Remove the foil and bake for another 15 minutes, until the top is bubbly and lightly golden.

9 — Rest and serve: Let the lasagna rest for about 10 minutes before slicing — this helps it hold together. Serve with a simple green salad and crusty bread.

The key swaps here are simple: a blended cashew cream replaces ricotta (it's creamy and rich with a very neutral flavor), and dairy-free shredded mozzarella handles the melty top layer. Everything else is completely standard. Enjoy!`,
      },
    ],
  },
};
