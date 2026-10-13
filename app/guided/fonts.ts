import { DM_Sans, Source_Serif_4 } from 'next/font/google';

// The handoff's type roles: a serif for headings, a sans for UI. Ask Away has
// no brand fonts in these roles, so the design's open stand-ins are used as is.
export const guidedSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['500'],
  variable: '--font-guided-serif',
  display: 'swap',
});

export const guidedSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-guided-sans',
  display: 'swap',
});
