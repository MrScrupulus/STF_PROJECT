"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../services/authService";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Login attempt:", formData);
      const response = await authService.login(formData);
      console.log("Login response:", response);
      if (response.token) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="form-container">
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="form-input"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          className="form-input"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
        <button type="submit" className="btn btn-primary w-full">
          Se connecter
        </button>
      </form>
    </div>
  );
}
