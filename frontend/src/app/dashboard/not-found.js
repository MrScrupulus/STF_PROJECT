"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Page non trouvée</h2>
      <p>La page que vous recherchez n'existe pas.</p>
      <Link
        href="/dashboard"
        style={{
          display: "inline-block",
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#2563eb",
          color: "white",
          textDecoration: "none",
          borderRadius: "0.5rem",
        }}
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
