import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { PreviewProvider } from '@/context/preview-provider';

export const metadata: Metadata = {
  title: 'LexiConvert',
  description: 'Convert document formats easily in your browser.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <PreviewProvider>
            {children}
            <Toaster />
        </PreviewProvider>
      </body>
    </html>
  );
}
