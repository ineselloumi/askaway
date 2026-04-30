export interface CitationSource {
  id: number;
  url: string;
  domain: string;
  title: string;
  excerpt: string;
}

interface ClassificationResult {
  needs_citation: boolean;
  categories: string[];
  is_recent_news: boolean;
}

const DOMAIN_ALLOWLISTS: Record<string, string[]> = {
  health: [
    'cdc.gov', 'nih.gov', 'who.int', 'mayoclinic.org', 'webmd.com',
    'nhs.uk', 'pubmed.ncbi.nlm.nih.gov', 'medlineplus.gov', 'healthline.com',
    'clevelandclinic.org', 'hopkinsmedicine.org', 'medscape.com', 'nejm.org',
    'jamanetwork.com', 'thelancet.com', 'bmj.com',
  ],
  news: [
    'reuters.com', 'bbc.com', 'bbc.co.uk', 'apnews.com', 'nytimes.com',
    'theguardian.com', 'washingtonpost.com', 'npr.org', 'politico.com',
    'axios.com', 'theatlantic.com', 'time.com', 'bloomberg.com', 'ft.com',
    'economist.com', 'foreignpolicy.com', 'aljazeera.com',
  ],
  science: [
    'nature.com', 'science.org', 'scientificamerican.com', 'nasa.gov',
    'newscientist.com', 'pubmed.ncbi.nlm.nih.gov', 'sciencedirect.com',
    'pnas.org', 'cell.com', 'plos.org', 'arxiv.org', 'mit.edu',
    'nationalgeographic.com', 'livescience.com',
  ],
  statistics: [
    'statista.com', 'worldbank.org', 'un.org', 'oecd.org', 'census.gov',
    'eurostat.ec.europa.eu', 'who.int', 'ourworldindata.org', 'pewresearch.org',
    'gallup.com', 'imf.org', 'bls.gov', 'data.gov', 'unicef.org',
    'undp.org', 'worldometers.info',
  ],
  history: [
    'britannica.com', 'history.com', 'si.edu', 'wikipedia.org',
    'loc.gov', 'nationalgeographic.com', 'smithsonianmag.com',
    'historians.org', 'thehistorypress.co.uk', 'historic-uk.com',
  ],
  literature: [
    'britannica.com', 'poetryfoundation.org', 'loc.gov', 'gutenberg.org',
    'sparknotes.com', 'litcharts.com', 'goodreads.com', 'jstor.org',
    'oxfordbibliographies.com', 'theparisreview.org',
  ],
  entertainment: [
    'imdb.com', 'rottentomatoes.com', 'variety.com', 'metacritic.com',
    'rollingstone.com', 'hollywoodreporter.com', 'pitchfork.com',
    'vulture.com', 'indiewire.com', 'deadline.com', 'billboard.com',
  ],
  technology: [
    'wired.com', 'arstechnica.com', 'ieee.org', 'technologyreview.com',
    'techcrunch.com', 'theverge.com', 'zdnet.com', 'mozilla.org',
    'w3.org', 'developer.mozilla.org', 'acm.org',
  ],
  finance: [
    'bloomberg.com', 'ft.com', 'imf.org', 'federalreserve.gov', 'wsj.com',
    'investopedia.com', 'cnbc.com', 'marketwatch.com', 'economist.com',
    'sec.gov', 'ecb.europa.eu', 'bis.org', 'morningstar.com',
  ],
  law: [
    'law.cornell.edu', 'eur-lex.europa.eu', 'justice.gov', 'supremecourt.gov',
    'congress.gov', 'findlaw.com', 'oyez.org', 'legislation.gov.uk',
    'legifrance.gouv.fr', 'courtlistener.com',
  ],
  environment: [
    'ipcc.ch', 'epa.gov', 'noaa.gov', 'nationalgeographic.com',
    'nature.com', 'worldwildlife.org', 'unep.org', 'climate.nasa.gov',
    'iucn.org', 'greenpeace.org', 'wri.org', 'climatereality.org',
  ],
  sports: [
    'espn.com', 'bbc.com', 'cbssports.com', 'si.com',
    'bleacherreport.com', 'theathletic.com', 'skysports.com',
    'nba.com', 'nfl.com', 'fifa.com', 'uefa.com',
  ],
};

function buildDomainAllowlist(categories: string[]): string[] {
  const domains = new Set<string>();
  for (const cat of categories) {
    for (const domain of DOMAIN_ALLOWLISTS[cat] ?? []) {
      domains.add(domain);
    }
  }
  return Array.from(domains);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function cleanExcerpt(raw: string): string {
  let text = raw
    // Strip video/audio duration artifacts (e.g. "0 seconds of 1 minute, 2 seconds")
    .replace(/\d+\s+seconds?\s+of\s+\d+\s+minutes?,\s+\d+\s+seconds?\.?/gi, '')
    // Strip common scraping noise: "Share", "Subscribe", cookie banners, etc.
    .replace(/\b(Share|Subscribe|Sign in|Sign up|Cookie policy|Accept cookies|Advertisement)\b[^\n]*/gi, '')
    // Collapse extra whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Truncate at the last sentence boundary within 400 chars
  if (text.length > 400) {
    const truncated = text.slice(0, 400);
    const lastSentence = Math.max(
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('! '),
      truncated.lastIndexOf('? '),
    );
    text = lastSentence > 100 ? truncated.slice(0, lastSentence + 1) : truncated.trim() + '…';
  }

  return text;
}

export async function classifyQuery(question: string, anthropicKey: string): Promise<ClassificationResult> {
  const prompt = `Classify this user question for citation purposes.

Question: "${question}"

Return ONLY valid JSON, no other text:
{
  "needs_citation": true or false,
  "categories": [],
  "is_recent_news": true or false
}

Rules:
- needs_citation = true if the question involves: facts, statistics, recent news, scientific claims, health/medical info, historical facts, legal info, financial data, sports records, or any verifiable external data
- needs_citation = false if the question is for: personal advice without factual claims, creative writing, summarizing user-provided content, translation, or general conversational help
- categories = array of relevant topics from this list only: health, news, science, statistics, history, literature, entertainment, technology, finance, law, environment, sports
- is_recent_news = true only if the question specifically asks about recent events or current news`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Classification request failed');

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in classification response');
  return JSON.parse(jsonMatch[0]) as ClassificationResult;
}

export async function fetchCitations(
  query: string,
  categories: string[],
  isRecentNews: boolean,
  tavilyKey: string,
): Promise<CitationSource[]> {
  const includeDomains = buildDomainAllowlist(categories);

  const body: Record<string, unknown> = {
    api_key: tavilyKey,
    query,
    search_depth: 'basic',
    max_results: 5,
    include_answer: false,
  };

  if (includeDomains.length > 0) body.include_domains = includeDomains;
  if (isRecentNews) body.days = 30;

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Tavily search failed');

  const data = await response.json();
  const results: Array<{ url: string; title: string; content: string }> = data.results ?? [];

  return results
    .filter(r => r.url && r.content)
    .slice(0, 5)
    .map((r, i) => ({
      id: i + 1,
      url: r.url,
      domain: extractDomain(r.url),
      title: r.title ?? r.url,
      excerpt: cleanExcerpt(r.content),
    }));
}

export function buildCitationContext(sources: CitationSource[]): string {
  if (!sources.length) return '';

  const list = sources
    .map(s => `[${s.id}] ${s.title}\nURL: ${s.url}\n${s.excerpt}`)
    .join('\n\n');

  return `

CITATION INSTRUCTIONS:
The following sources were fetched in real time and represent current, up-to-date information. Treat them as your primary and authoritative source for this response — they override your training knowledge cutoff. Do NOT disclaim that you lack recent information; the sources below ARE the recent information. Summarize and answer directly from them.

Where your answer references a fact or claim from one of these sources, wrap the exact phrase in citation markers. Use ONLY this exact format — a number inside curly braces, no other text:
[[the specific phrase]]{1}
[[another phrase]]{2}
[[same source again]]{1}

Sources:
${list}

Citation rules:
- Use the source content to answer the question fully and confidently
- The number in {N} must match the source number above (e.g. {1} for source [1], {2} for source [2])
- Do NOT write {source_1} or {source1} — only the plain number like {1}
- You may cite the same source multiple times
- Leave statements without a matching source uncited — do not force citations
- Never tell the user to "check other sources" if the answer is already in the sources above`;
}
