import ClientLayout from "../components/layout/ClientLayout";
import AppShell from "../components/layout/AppShell";
import "./globals.scss";
import "../styles/theme.scss";
import "../styles/components/layout/layout.module.scss";
import "../styles/global/leaflet-draw.css";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://streetfishing-tournament.fr"
  ),
  title:
    "Street Fishing Tournament | La plateforme de référence pour les compétitions de street fishing",
  description: "Application de street fishing",
  keywords: "street fishing, tournoi, compétition, France",
  openGraph: {
    title: "Street Fishing Tournament",
    description:
      "La plateforme de référence pour les compétitions de street fishing",
    images: ["/images/og-image.jpg"],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Street Fishing Tournament",
    description:
      "La plateforme de référence pour les compétitions de street fishing",
    images: ["/images/twitter-image.jpg"],
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <ClientLayout>
          <AppShell>{children}</AppShell>
        </ClientLayout>
      </body>
    </html>
  );
}
