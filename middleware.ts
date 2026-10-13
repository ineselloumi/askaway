import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isGuidedEnabled } from '@/lib/guided/flag';

// Where each original Ask Away "situation" lands in the guided flow.
const SITUATION_START: Record<string, string> = {
  write: 'write',
  explain: 'understand',
  summarize: 'understand',
  translate: 'understand',
};

/** Old /assist links (bookmarks, ads, story pages, the auth callback) open the guided flow instead. */
function legacyRedirect(request: NextRequest): NextResponse | null {
  if (!isGuidedEnabled() || request.nextUrl.pathname !== '/assist') return null;
  const from = request.nextUrl.searchParams;
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = '';
  const query = from.get('query');
  if (query) url.searchParams.set('q', query);
  else url.searchParams.set('start', SITUATION_START[from.get('situation') ?? ''] ?? 'chat');
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const redirect = legacyRedirect(request);
  if (redirect) return redirect;

  let supabaseResponse = NextResponse.next({ request });

  // No Supabase project configured (e.g. a fresh local checkout): nothing to refresh.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps the cookie alive
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
