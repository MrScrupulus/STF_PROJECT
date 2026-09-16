"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import Footer from "../Footer";
import BottomNavBar from "./BottomNavBar";

const BARE_PREFIXES = ["/legal", "/contact"];

function isBareDocument(pathname) {
  if (!pathname) return false;
  return BARE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const bare = isBareDocument(pathname);

  if (bare) {
    return (
      <main id="main-content" role="main" aria-label="Contenu principal">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        role="main"
        aria-label="Contenu principal"
        style={{ paddingBottom: "80px" }}
      >
        {children}
      </main>
      <Footer />
      <BottomNavBar />
    </>
  );
}
