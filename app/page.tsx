import { isGuidedEnabled } from '@/lib/guided/flag';
import LegacyHome from './components/LegacyHome';
import GuidedApp from './guided/GuidedApp';

// The guided first-prompt experience replaces the original Ask Away home page.
// Set NEXT_PUBLIC_GUIDED_FLOW=off to roll back.
export default function Home() {
  return isGuidedEnabled() ? <GuidedApp /> : <LegacyHome />;
}
