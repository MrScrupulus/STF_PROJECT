import { Header } from "@/components/layout/Header";
import "./globals.scss";
import styles from "@/styles/components/layout/layout.module.scss";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "@/styles/theme.scss";
import ThemeSwitch from "@/components/theme/ThemeSwitch";

export const metadata = {
  title: "Street Fishing",
  description: "Application pour le street fishing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <QueryProvider>
            <div className={styles.mainLayout}>
              <Header />
              <main className={styles.main}>{children}</main>
              <div className={styles.themeSwitch}>
                <ThemeSwitch />
              </div>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
