import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ShopSettingsProvider } from "@/contexts/ShopSettingsContext";
// NetworkProvider : gestion offline, détection réseau, sync automatique
import { NetworkProvider } from "@/contexts/NetworkContext";
import "./globals.css";
import { AuthProvider } from "./context/useContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SP Management Services",
  description: "Application globale de gestion et de suivi des stocks pour les commerçants",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <AuthProvider>
          <ShopSettingsProvider>
            <ThemeProvider>
              <ToastProvider>
                {/*
                  NetworkProvider doit être DANS ToastProvider (pour pouvoir
                  afficher des toasts lors des syncs) et DANS AuthProvider
                  (pour avoir accès au token JWT lors des appels sync).
                */}
                <NetworkProvider>
                  <SidebarProvider>
                    {children}
                  </SidebarProvider>
                </NetworkProvider>
              </ToastProvider>
            </ThemeProvider>
          </ShopSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
