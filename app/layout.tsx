import type { Metadata } from 'next';
import { Lora, Poppins } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from './providers';

const lora = Lora({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-lora',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AskAway - Simple AI for Everyone',
  description: 'Get help writing messages, understanding letters, and more. No confusing tech words. Just simple, friendly help.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${poppins.variable}`}>
      <body>
        <PostHogProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <main id="main-content">
            {children}
          </main>
        </PostHogProvider>
      </body>
    </html>
  );
}
