import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
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
        <ThemeProvider>
          <ToastProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </ToastProvider>
        </ThemeProvider>
         </AuthProvider>
      </body>
    </html>
  );
}
