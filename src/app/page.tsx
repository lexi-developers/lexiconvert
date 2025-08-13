import { Converter } from '@/components/converter';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-background">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">
            LexiConvert
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            上傳您的文件，選擇目標格式，我們將在幾秒鐘內為您轉換。
          </p>
        </header>
        <Converter />
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LexiConvert. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
