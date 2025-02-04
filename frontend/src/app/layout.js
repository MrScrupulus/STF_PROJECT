import { Header } from "../components/layout/Header";
import "./globals.scss";
import styles from "@/styles/layout/layout.module.scss";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "@/styles/theme.scss";

export const metadata = {
  title: "Street Fishing",
  description: "Application pour le street fishing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={styles.mainLayout}>
        <ThemeProvider>
          <QueryProvider>
            <Header />
            <main className={styles.main}>{children}</main>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
