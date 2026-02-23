import Link from 'next/link';
import styles from './page.module.css';

const principles = [
  {
    icon: '🎯',
    title: 'Start with what you need',
    description: 'No empty text box staring at you. Pick a situation and we guide you from there.',
  },
  {
    icon: '💬',
    title: 'One question at a time',
    description: 'We ask simple questions in plain words. No confusing tech talk.',
  },
  {
    icon: '🤝',
    title: 'You are in control',
    description: 'Nothing happens until you say so. We show you the result before asking for anything.',
  },
  {
    icon: '👍',
    title: 'Encouragement along the way',
    description: 'Little messages to let you know you are doing it right. No pressure.',
  },
  {
    icon: '💰',
    title: 'Fair and clear pricing',
    description: 'Pay only after you see the result. One-time payment, no subscription, no surprises.',
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
        <h1 className={styles.title}>How AskAway Works</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What is this?</h2>
          <p className={styles.paragraph}>
            AskAway helps you with everyday writing tasks. Need to reply to a
            message? Want to understand a confusing letter? Not sure if something
            is a scam? We can help.
          </p>
          <p className={styles.paragraph}>
            We use smart technology to write drafts for you. But we made it simple.
            No confusing words. No empty boxes where you have to figure out what to type.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Design Principles</h2>
          <p className={styles.paragraph}>
            We built this for people who find technology confusing. Everything here
            is designed to feel calm and easy.
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
          <h2 className={styles.sectionTitle}>How We Handle Your Information</h2>
          <p className={styles.paragraph}>
            When you paste a message, we only use it to help you write a reply.
            We do not save your messages. We do not share them with anyone else.
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
