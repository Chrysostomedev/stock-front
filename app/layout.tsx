import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ShopSettingsProvider } from "@/contexts/ShopSettingsContext";
// NetworkProvider : gestion offline, détection réseau, sync automatique
import { NetworkProvider } from "@/contexts/NetworkContext";
import { DashboardShopProvider } from "@/contexts/DashboardShopContext";
import "./globals.css";
import { AuthProvider } from "./context/useContext";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "SP Management Services",
  description: "Application globale de gestion et de suivi des stocks de SPSERVICE",
  manifest: "/manifest.json",
  themeColor: "#2563EB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SP Services",
  },
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <PwaRegister />
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
                  <DashboardShopProvider>
                    <SidebarProvider>
                      {children}
                    </SidebarProvider>
                  </DashboardShopProvider>
                </NetworkProvider>
              </ToastProvider>
            </ThemeProvider>
          </ShopSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
