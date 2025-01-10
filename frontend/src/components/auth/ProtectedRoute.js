"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function ProtectedRoute({ children, requiredRole }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (!userData.roles.includes(requiredRole)) {
          router.push(
            userData.roles.includes("ROLE_ADMIN") ? "/dashboard" : "/profile"
          );
        }
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  return children;
}
