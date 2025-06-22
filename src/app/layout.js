import "./globals.css";
import AppLayout from "./components/AppLayout"; // adjust a path if needed
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "CEH",
  description: "A modern quiz app.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
