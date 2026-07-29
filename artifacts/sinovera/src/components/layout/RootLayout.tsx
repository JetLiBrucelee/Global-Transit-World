import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ReactNode } from "react";

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full bg-background text-foreground">
        {children}
      </main>
      <Footer />
    </div>
  );
}
