import Link from 'next/link';
import styles from './page.module.css';
import HomeQueryInput from './components/HomeQueryInput';
import TilesCarousel from './components/TilesCarousel';

const primarySituations = [
  {
    id: 'explain',
    icon: '💡',
    title: 'Explain something',
    description: 'Help me understand a topic, a document, a news article, etc.',
    href: '/assist?situation=explain',
    color: '#FEF9EC',
  },
  {
    id: 'summarize',
    icon: '📝',
    title: 'Summarize',
    description: 'Make a document, article or communication more concise.',
    href: '/assist?situation=summarize',
    color: '#EBF4FF',
  },
  {
    id: 'write',
    icon: '✍️',
    title: 'Write for me',
    description: 'Help me write an email, a letter, a text message, etc.',
    href: '/assist?situation=write',
    color: '#F0EEFF',
  },
  {
    id: 'image',
    icon: '🖼️',
    title: 'Explain an image',
    description: 'Upload a letter, a receipt, a bill, etc.',
    href: '/assist?situation=image',
    color: '#EDFBF3',
  },
];

const moreSituations = [
  {
    id: 'health',
    icon: '🩺',
    title: 'Get health information',
    description: 'Ask about symptoms, medication, nutrition, etc.',
    href: '/assist?situation=health',
    color: '#FEF0F0',
  },
  {
    id: 'decide',
    icon: '⚖️',
    title: 'Help me decide',
    description: 'Get help with any decision in your life.',
    href: '/assist?situation=decide',
    color: '#E8FAF8',
  },
  {
    id: 'translate',
    icon: '🌍',
    title: 'Translate',
    description: 'Decode or translate languages quickly.',
    href: '/assist?situation=translate',
    color: '#EEF2FF',
  },
  {
    id: 'trip',
    icon: '📍',
    title: 'Go somewhere',
    description: 'Ask about a city visit, an itinerary or a night out.',
    href: '/assist?situation=trip',
    color: '#FFF4EC',
  },
  {
    id: 'recipe',
    icon: '🍳',
    title: 'Find a recipe',
    description: 'Suggestions based on your cravings or ingredients.',
    href: '/assist?situation=recipe',
    color: '#FFF0F3',
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          ask away <span className={styles.titleTagline}>| do more with AI</span>
        </h1>
      </header>

      <div className={styles.content}>
        <p className={styles.sectionTitle}>Click any of these to get started</p>
        <TilesCarousel situations={primarySituations} />

        <p className={styles.sectionTitle}>Ideas of what you can do</p>
        <TilesCarousel situations={moreSituations} />

        <p className={styles.sectionTitle}>Or start typing directly</p>
        <div className={styles.searchCard}>
          <HomeQueryInput />
        </div>

      </div>

      <footer className={styles.footer}>
        <Link href="/about" className={styles.footerLink}>How does this work?</Link>
        <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
        <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
      </footer>

    </div>
  );
}
