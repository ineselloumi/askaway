import Link from 'next/link';
import styles from './page.module.css';
import HomeQueryInput from './components/HomeQueryInput';

const situations = [
  {
    id: 'explain',
    icon: '💡',
    title: 'Explain something',
    description: 'Help me understand a topic, a document, a news article, etc.',
    href: '/assist?situation=explain',
  },
  {
    id: 'summarize',
    icon: '📝',
    title: 'Summarize',
    description: 'Make a document, article or communication more concise.',
    href: '/assist?situation=summarize',
  },
  {
    id: 'write',
    icon: '✍️',
    title: 'Write for me',
    description: 'Help me write an email, a letter, a text message, etc.',
    href: '/assist?situation=write',
  },
  {
    id: 'image',
    icon: '🖼️',
    title: 'Explain an image',
    description: 'Upload a letter, a receipt, a bill, etc.',
    href: '/assist?situation=image',
  },
  {
    id: 'health',
    icon: '🩺',
    title: 'Get health information',
    description: 'Ask about symptoms, medication, nutrition, etc.',
    href: '/assist?situation=health',
  },
  {
    id: 'decide',
    icon: '⚖️',
    title: 'Help me decide',
    description: 'Get help with any decision in your life.',
    href: '/assist?situation=decide',
  },
  {
    id: 'translate',
    icon: '🌍',
    title: 'Translate',
    description: 'Decode or translate languages quickly.',
    href: '/assist?situation=translate',
  },
  {
    id: 'trip',
    icon: '📍',
    title: 'Go somewhere',
    description: 'Ask about a city visit, an itinerary or a night out.',
    href: '/assist?situation=trip',
  },
  {
    id: 'recipe',
    icon: '🍳',
    title: 'Find a recipe',
    description: 'Suggestions based on your cravings or ingredients.',
    href: '/assist?situation=recipe',
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>AskAway</h1>
        <p className={styles.subtitle}>What do you need help with today?</p>
      </header>

      <div className={styles.content}>
        <HomeQueryInput />

        <p className={styles.sectionTitle}>Or click any of these to get started</p>
        <div className={styles.tiles} role="list" aria-label="Choose what you need help with">
          {situations.map((situation) => (
            <Link
              key={situation.id}
              href={situation.href}
              className={styles.tile}
              role="listitem"
            >
              <span className={styles.tileIcon} aria-hidden="true">
                {situation.icon}
              </span>
              <h2 className={styles.tileTitle}>{situation.title}</h2>
              <p className={styles.tileDescription}>{situation.description}</p>
            </Link>
          ))}
        </div>

      </div>

      <footer className={styles.footer}>
        <Link href="/about" className={styles.footerLink}>
          How does this work?
        </Link>
      </footer>
    </div>
  );
}
