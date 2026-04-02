import Link from 'next/link';
import styles from './page.module.css';

const principles = [
  {
    icon: '🎯',
    title: 'Start where you are',
    description: 'No empty text box staring at you. Pick a situation and we guide you from there.',
  },
  {
    icon: '💬',
    title: 'Dive deeper, one question at a time',
    description: 'We ask simple questions in plain words. No confusing tech talk.',
  },
  {
    icon: '🤝',
    title: 'You are in control',
    description: 'The tool is at your service, so nothing happens until you say so.',
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backButton}>
            ← Back to home
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>How ask away works</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What is it?</h2>
          <p className={styles.paragraph}>
            ask away helps you with everyday tasks and questions. Need to reply to a
            message? Want to understand a confusing letter? Want to learn about a topic? We can help.
          </p>
          <p className={styles.paragraph}>
            We use artificial intelligence technology, also called "AI", to write responses for you. But we made it simple.
            No confusing words. No empty boxes where you have to figure out what to type.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our principles</h2>
          <p className={styles.paragraph}>
            We built this for people who find artificial intelligence tools confusing and need a little extra guidance. 
          </p>
          <ul className={styles.list}>
            {principles.map((principle, index) => (
              <li key={index} className={styles.listItem}>
                <span className={styles.listIcon} aria-hidden="true">
                  {principle.icon}
                </span>
                <div className={styles.listContent}>
                  <h3 className={styles.listTitle}>{principle.title}</h3>
                  <p className={styles.listDescription}>{principle.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How we handle your information</h2>
          <p className={styles.paragraph}>
            When you share context or paste a message, we only use it to help you get the answer you need.
            We do not save your conversations or share them with anyone else.
          </p>
          <p className={styles.paragraph}>
            This is a simple tool. You use it, you get your result, that is it.
          </p>
        </section>

        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to try it?</h2>
          <Link href="/" className={styles.ctaButton}>
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
