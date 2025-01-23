"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        console.log("ProtectedRoute - User data:", userData);

        if (!userData || !userData.success) {
          console.log("ProtectedRoute - No user data or unsuccessful");
          router.push("/login");
          return;
        }

        if (requiredRole && !userData.user.roles.includes(requiredRole)) {
          console.log(
            "ProtectedRoute - User lacks required role:",
            requiredRole
          );
          router.push("/");
          return;
        }

        if (isMounted) {
          console.log("ProtectedRoute - User authorized");
          setIsAuthorized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("ProtectedRoute - Auth error:", error);
        router.push("/login");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router, requiredRole]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return isAuthorized ? children : null;
};

export default ProtectedRoute;
