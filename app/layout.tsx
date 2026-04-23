import type { Metadata } from 'next';
import { Lora, Poppins } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { PostHogProvider } from './providers';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';

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
  title: 'ask away - Simple AI for Everyone',
  description: 'Get help writing messages, understanding letters, and more. No confusing tech words. Just simple, friendly help.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${poppins.variable}`}>
      <head>
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','924960063643828');fbq('track','PageView');`,
          }}
        />
      </head>
      <body>
        <noscript>
          <img height="1" width="1" style={{display:'none'}} src="https://www.facebook.com/tr?id=924960063643828&ev=PageView&noscript=1" alt="" />
        </noscript>
        <PostHogProvider>
          <LocaleProvider>
            <ConversationsProvider>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <main id="main-content">
                {children}
              </main>
            </ConversationsProvider>
          </LocaleProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
