import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import Link from "next/link";
import { Send } from "lucide-react";

const inter = Inter({subsets: ["latin"] });

export const metadata = {
  title: "Mentrai - AI Carrer Coach",
  description: "A powerful AI coach to excel in your carrer",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{
      baseTheme: dark
    }}>
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className}`}
      >
       <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
           {/* header */}
           <Header />
           <main className="min-h-screen">{children}</main> 
           <Toaster richColors />
           {/* footer */}
           <footer className="bg-black/50 py-12 ">
            <div className="container mx-auto px-4 text-center text-gray-200">
             <p>
          Have ideas to improve the site?{' '}
          <Link href="/" className="underline inline-flex items-center">
            Share them
            <Send className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </p>
            </div>
           </footer>
          </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
