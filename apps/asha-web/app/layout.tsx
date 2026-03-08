import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@assistant-ui/react-ui/styles/index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SidebarProvider, Sidebar } from "@/components/Sidebar";
import { Circle, Github, ExternalLink } from "lucide-react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-deep-obsidian text-white selection:bg-indigo-500/30 overflow-hidden`}
      >
        <SidebarProvider>
          <div className="flex min-h-screen bg-deep-obsidian overflow-hidden">
            <Sidebar />

            <section className="flex-1 flex flex-col relative overflow-hidden">
              {/* Header Overlay (Subtle) */}
              <header className="absolute top-0 left-0 right-0 h-16 pointer-events-none flex items-center justify-end px-8 z-40">
                <div className="flex items-center gap-4 bg-charcoal/80 backdrop-blur-sm border border-border-dark px-3 py-1.5 rounded-full pointer-events-auto shadow-2xl transition-all hover:bg-charcoal/90">
                  <div className="flex items-center gap-2">
                    <Circle size={8} className="fill-green-500 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Amazon Bedrock v1.0</span>
                  </div>
                  <div className="w-px h-3 bg-border-dark" />
                  <div className="flex gap-3">
                    <Github size={14} className="text-muted-grey hover:text-white cursor-pointer transition-colors" />
                    <ExternalLink size={14} className="text-muted-grey hover:text-white cursor-pointer transition-colors" />
                  </div>
                </div>
              </header>

              <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full relative pt-20 pb-4 overflow-hidden">
                {/* Main Backdrop Gradient (Subtle Glow) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[120px] rounded-full -z-10" />

                <div className="flex-1 flex flex-col overflow-hidden px-4">
                  {children}
                </div>

                <footer className="h-8 flex items-center justify-center shrink-0 mt-2">
                  <p className="text-[9px] text-muted-grey font-bold uppercase tracking-[0.3em]">
                    BharatCare Link • Medical Assistant • Confidential
                  </p>
                </footer>
              </div>
            </section>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
