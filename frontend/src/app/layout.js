import { Header } from "../components/layout/Header";
import "./globals.scss";
import styles from "@/styles/layout/layout.module.scss";

export const metadata = {
  title: "Street Fishing",
  description: "Application pour le street fishing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={styles.mainLayout}>
        <Header />
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
