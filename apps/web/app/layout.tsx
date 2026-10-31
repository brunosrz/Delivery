import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ecossistema Delivery Express",
  description: "Plataforma completa para delivery e gestão de restaurantes",
  icons: {
    icon: [
      { url: "/favicon.png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/favicon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "Ecossistema Delivery Express",
    description: "Plataforma completa para delivery e gestão de restaurantes",
    images: [
      {
        url: "/favicon.png",
        width: 1200,
        height: 1200,
        alt: "Logo do ecossistema Delivery Express",
      },
    ],
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ecossistema Delivery Express",
    description: "Plataforma completa para delivery e gestão de restaurantes",
    images: ["/favicon.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#fffaf0]`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
