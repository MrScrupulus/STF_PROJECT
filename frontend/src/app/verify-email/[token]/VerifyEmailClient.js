"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../../services/authService";

export default function VerifyEmailClient({ token }) {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token manquant");
        return;
      }

      try {
        console.log("Tentative de vérification avec le token:", token);
        const response = await authService.verifyEmail(token);
        console.log("Réponse de vérification:", response);
        setStatus("success");
        setMessage("Votre email a été vérifié avec succès !");
      } catch (error) {
        console.error("Erreur de vérification:", error);
        setStatus("error");
        setMessage(
          error.message || "Une erreur est survenue lors de la vérification"
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {status === "verifying" && (
          <div className="text-center">
            <h2 className="text-xl font-bold">Vérification en cours...</h2>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
              <p>{message}</p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Se connecter
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
