import "./globals.css";
import AppLayout from "./components/AppLayout"; // adjust a path if needed
import Providers from "./components/Providers";

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
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
