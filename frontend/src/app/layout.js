import { Header } from "../components/layout/Header";
import "./globals.scss";

export const metadata = {
  title: "Street Fishing",
  description: "Application de gestion des compétitions de street fishing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
