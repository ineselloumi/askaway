import Link from 'next/link';
import { guidedSans, guidedSerif } from '../guided/fonts';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Privacy Policy — AskAway',
};

export default function PrivacyPage() {
  return (
    <div className={`${styles.page} ${guidedSerif.variable} ${guidedSans.variable}`}>
      <Link href="/" className={styles.back}>← Back to AskAway</Link>

      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.meta}>Effective Date: October 13, 2026</p>

      <p className={styles.intro}>
        AskAway is a service operated by Future Products LLC ("we," "us," or "our"). This Privacy Policy explains how we handle information when you use askaway.guide. We are committed to being transparent and protecting your privacy.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
        <div className={styles.body}>
          <p>AskAway is designed to work without an account. Here is what we do and do not collect:</p>
          <p><strong>We do NOT collect:</strong></p>
          <ul>
            <li>Account information (no accounts or sign-ups required)</li>
            <li>Your name, email address, or contact details, unless you include them in something you type</li>
            <li>Payment information</li>
            <li>Precise location data</li>
          </ul>
          <p><strong>We DO collect:</strong></p>
          <ul>
            <li>The content of the requests you send to the AI assistant, including any photos or files you attach, and the answers you receive</li>
            <li>The text of a request while you are still writing it, which is checked as you type (see section 3)</li>
            <li>An anonymous identifier stored in your browser, which links your saved conversations to that browser</li>
            <li>Your approximate location (country, region and city), estimated from your IP address</li>
            <li>Usage data such as pages viewed, buttons and options selected, and recordings of how the site is used (see section 5)</li>
            <li>Technical information your browser sends automatically (e.g., browser type, device type, referring URL) via standard server logs</li>
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
        <div className={styles.body}>
          <p>The information we receive is used to:</p>
          <ul>
            <li>Provide the AskAway service, including generating answers and saving your conversation history</li>
            <li>Diagnose and fix technical problems</li>
            <li>Understand how the service is used so we can improve it</li>
            <li>Measure whether our own advertising brings visitors to AskAway</li>
          </ul>
          <p>We do not sell your data, and we do not use the content of your conversations for advertising.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. AI Providers and Saved Conversations</h2>
        <div className={styles.body}>
          <p><strong>Anthropic.</strong> AskAway uses Anthropic's Claude models to generate answers. Your requests, and any photos or files you attach, are sent to Anthropic's API to process and return an answer. When you ask AskAway to do a job on its own, such as researching a topic, Anthropic's tools search and read public web pages using queries based on your request. Anthropic's own privacy policy governs how they handle data submitted through their API. We encourage you to review it at <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer">anthropic.com</a>.</p>
          <p><strong>TypeSafe AI.</strong> While you write a request, its text is sent to TypeSafe AI's Jev model, which judges how complete the request is so that AskAway can suggest what to add. This happens as you type, before you send the request. TypeSafe AI's own privacy policy governs how they handle that data. You can review it at <a href="https://typesafe.ai" target="_blank" rel="noopener noreferrer">typesafe.ai</a>.</p>
          <p><strong>Saved conversations.</strong> Your conversations are saved so that you can return to them from the history menu. They are linked to an anonymous identifier stored in your browser, not to your name or email address. Your approximate location and basic details about the conversation, such as its length, are saved with it.</p>
          <p>Do not submit sensitive personal information such as passwords, financial account numbers, or government ID numbers through AskAway.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Data Sharing</h2>
        <div className={styles.body}>
          <p>We do not sell your data. We share data only with the service providers needed to run AskAway, and only as described here:</p>
          <ul>
            <li>Anthropic, to generate AI answers and carry out web research</li>
            <li>TypeSafe AI, to check requests as you write them</li>
            <li>Supabase, which stores saved conversations and the anonymous identifier</li>
            <li>Vercel, which hosts the website</li>
            <li>PostHog, for usage analytics and session recordings</li>
            <li>Meta, through the Meta Pixel, to measure our advertising</li>
            <li>ipapi.co, which your browser contacts to estimate your approximate location from your IP address</li>
            <li>As required by law or to protect the rights, safety, or property of Future Products LLC or others</li>
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Cookies, Analytics and Tracking</h2>
        <div className={styles.body}>
          <p><strong>Essential storage.</strong> AskAway stores an anonymous session in a cookie so your saved conversations can be found again, and keeps your progress through the guided setup in your browser's local storage.</p>
          <p><strong>PostHog.</strong> We use PostHog to understand how the site is used. It records page views, the options you select, and session recordings that replay how a visit unfolded. These recordings can include text you type into AskAway.</p>
          <p><strong>Meta Pixel.</strong> We use the Meta Pixel to measure whether our advertising on Meta's platforms brings visitors. It reports page views, and the fact that a request was submitted, to Meta. It does not send the content of your requests. Meta may associate this activity with your Meta account and may set its own cookies.</p>
          <p>You can block these tools with your browser's privacy settings or a content blocker. AskAway will continue to work.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Children's Privacy</h2>
        <div className={styles.body}>
          <p>AskAway is not directed at children under 13 years of age. We do not knowingly collect any personal information from children under 13. If you believe a child has submitted personal information to us, please contact us and we will delete it promptly.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Data Security</h2>
        <div className={styles.body}>
          <p>We take reasonable precautions to protect the service and any data in transit. However, no system is completely secure. Use AskAway at your own risk and do not submit sensitive personal information.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Your Rights</h2>
        <div className={styles.body}>
          <p>AskAway does not ask for your name or email address, but your saved conversations and the usage data described above may relate to you. Depending on where you live, you may have the right to access, correct, or delete this information. To make a request, contact us at the address below from the browser you used, and we will do our best to assist you. Clearing your browser's cookies and site data removes the anonymous identifier, which disconnects your saved conversations from your browser.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Changes to This Policy</h2>
        <div className={styles.body}>
          <p>We may update this Privacy Policy from time to time. The "Effective Date" at the top of this page will reflect any changes. Continued use of AskAway after changes are posted constitutes your acceptance of the updated policy.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Contact</h2>
        <div className={styles.body}>
          <p>For questions about this Privacy Policy, please contact us at: <a href="mailto:ines@askaway.guide">ines@askaway.guide</a></p>
          <p>Thank you for using AskAway.</p>
        </div>
      </div>
    </div>
  );
}
