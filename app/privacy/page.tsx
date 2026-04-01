import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Privacy Policy — AskAway',
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>← Back to AskAway</Link>

      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.meta}>Effective Date: March 31, 2026</p>

      <p className={styles.intro}>
        AskAway is a service operated by Future Products LLC ("we," "us," or "our"). This Privacy Policy explains how we handle information when you use askaway.guide. We are committed to being transparent and protecting your privacy.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
        <div className={styles.body}>
          <p>AskAway is designed to minimize data collection. Here is what we do and do not collect:</p>
          <p><strong>We do NOT collect:</strong></p>
          <ul>
            <li>Account information (no accounts or sign-ups required)</li>
            <li>Your name, email address, or contact details</li>
            <li>Payment information</li>
            <li>Precise location data</li>
          </ul>
          <p><strong>We MAY collect:</strong></p>
          <ul>
            <li>The content of messages you submit to the AI assistant, solely to generate a response</li>
            <li>Basic, anonymized usage data such as page views or error logs, used only to keep the service running</li>
            <li>Technical information your browser sends automatically (e.g., browser type, device type, referring URL) via standard server logs</li>
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
        <div className={styles.body}>
          <p>Any information we receive is used only to:</p>
          <ul>
            <li>Provide and improve the AskAway service</li>
            <li>Diagnose and fix technical problems</li>
            <li>Understand general usage patterns (in aggregate, not individually)</li>
          </ul>
          <p>We do not use your data for advertising, profiling, or any purpose beyond operating the service.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. AI-Powered Responses</h2>
        <div className={styles.body}>
          <p>AskAway uses a third-party AI provider (Anthropic) to generate responses to your questions. Your messages are sent to Anthropic's API to process and return an answer. Anthropic's own privacy policy governs how they handle data submitted through their API. We encourage you to review it at <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer">anthropic.com</a>.</p>
          <p>We do not store your conversation history after your session ends. Do not submit sensitive personal information such as passwords, financial account numbers, or government ID numbers through AskAway.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Data Sharing</h2>
        <div className={styles.body}>
          <p>We do not sell your data. We do not share your data with third parties except:</p>
          <ul>
            <li>Anthropic, as described above, to generate AI responses</li>
            <li>Hosting and infrastructure providers necessary to operate the website</li>
            <li>As required by law or to protect the rights, safety, or property of Future Products LLC or others</li>
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Cookies and Tracking</h2>
        <div className={styles.body}>
          <p>AskAway uses minimal or no cookies. We do not use advertising trackers or third-party analytics platforms. If we add any analytics in the future, this policy will be updated accordingly.</p>
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
          <p>Because AskAway does not collect personally identifiable information, there is generally no personal data to access, correct, or delete. If you have questions or concerns about your data, you may contact us at the address below and we will do our best to assist you.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Changes to This Policy</h2>
        <div className={styles.body}>
          <p>We may update this Privacy Policy from time to time. The "Last Updated" date at the top of this page will reflect any changes. Continued use of AskAway after changes are posted constitutes your acceptance of the updated policy.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Contact</h2>
        <div className={styles.body}>
          <p>For questions about this Privacy Policy, please contact us at: askaway.guide</p>
          <p>Thank you for using AskAway.</p>
        </div>
      </div>
    </div>
  );
}
