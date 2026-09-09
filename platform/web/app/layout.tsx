import React from 'react';
import '../styles.css';
import '../src/styles/tokens.css';
import '../src/styles/main.css';
import '../src/styles/liquid-glass.css';

export const metadata = {
  title: '301 Super AI — Sovereign AI Platform',
  description: '100% On-Premise Industrial Autonomous Agentic Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
