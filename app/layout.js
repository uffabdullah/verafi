import "./globals.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

export const metadata = {
  title: "Verafi — Provable fairness for Solana games",
  description: "A universal, on-chain fairness protocol and verifier for Solana games.",
  icons: {
    icon: "/verafi-icon.svg",
    shortcut: "/verafi-icon.svg",
    apple: "/verafi-icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
