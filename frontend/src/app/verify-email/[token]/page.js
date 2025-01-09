"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authService } from "../../../services/authService";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState("verifying");
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    let isMounted = true;

    async function verifyEmail() {
      try {
        const token = params.token;
        console.log("Tentative de vérification avec le token:", token);

        const response = await authService.verifyEmail(token);
        console.log("Réponse de vérification:", response);

        if (isMounted && response.success) {
          setStatus("success");
          setTimeout(() => {
            if (isMounted) {
              router.push("/login");
            }
          }, 3000);
        } else {
          if (isMounted) {
            setStatus("error");
          }
        }
      } catch (error) {
        console.error("Email verification failed:", error);
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [router, params]);

  return (
    <div className="container mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Vérification de l'email</h1>
      {status === "verifying" && <p>Vérification de votre email en cours...</p>}
      {status === "success" && (
        <p className="text-green-600">
          Email vérifié avec succès ! Vous allez être redirigé vers la page de
          connexion...
        </p>
      )}
      {status === "error" && (
        <p className="text-red-600">
          Erreur lors de la vérification de l'email. Le lien est peut-être
          expiré ou invalide.
        </p>
      )}
    </div>
  );
}
