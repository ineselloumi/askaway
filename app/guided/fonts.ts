import { DM_Sans, Inter, Source_Serif_4 } from 'next/font/google';

// The handoff's type roles: a serif for headings, a sans for UI. Ask Away has
// no brand fonts in these roles, so the design's open stand-ins are used as is.
const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['500'],
  variable: '--font-guided-serif',
  display: 'swap',
});

// chatgpt.askaway.guide sets its headings in a Helvetica-like sans instead. The
// brand CSS points --font-guided-serif at this one (html[data-brand='chatgpt']),
// so server and client render the same markup.
const headingSans = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['500'],
  variable: '--font-guided-heading-sans',
  display: 'swap',
  preload: false,
});

/** The heading font variables (both brands' faces; only the one in use downloads). */
export const guidedSerif = { variable: `${sourceSerif.variable} ${headingSans.variable}` };

export const guidedSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-guided-sans',
  display: 'swap',
});
