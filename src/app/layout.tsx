import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "QDoc Challenge — Vaccine Eligibility & Reminder System",
  description:
    "Smart Vaccine Eligibility and Reminder System. Determine vaccine eligibility, track immunization history, and receive intelligent reminders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#ffffff",
                border: "1px solid #c2dcee",
                color: "#12455a",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
