"use client";

export default function Error({ error, reset }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Une erreur s'est produite</h2>
      <p>{error?.message || "Une erreur inattendue s'est produite"}</p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
