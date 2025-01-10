"use client";
import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (!userData.roles.includes("ROLE_ADMIN")) {
          router.push("/profile");
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/login");
      }
    };

    fetchUserData();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard Administrateur</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl mb-4">Bienvenue {user.email}</h2>
          <p>Accès administrateur</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
