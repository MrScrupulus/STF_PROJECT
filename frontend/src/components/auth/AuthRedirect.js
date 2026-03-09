"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "../../services/authService";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/legal",
  "/verify-email",
  "/reset-password",
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default function AuthRedirect({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;

    const authenticated = authService.isAuthenticated();

    if (!authenticated && !isPublicPath(pathname)) {
      router.replace("/login");
      return;
    }

    if (authenticated && pathname === "/") {
      router.replace("/competitions");
      return;
    }
  }, [pathname, router]);

  return children;
}
