"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { speciesService } from "@/services/speciesService";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CreateSpecies() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    coefficient: "",
    basePoints: "",
    isBonus: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        name: formData.name,
        basePoints: parseInt(formData.basePoints) || 50,
        coefficient: formData.isBonus ? 1 : parseFloat(formData.coefficient),
      };

      await speciesService.create(dataToSend);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating species:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Ajouter une espèce</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de l'espèce
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isBonus}
                  onChange={(e) =>
                    setFormData({ ...formData, isBonus: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Espèce bonus</span>
              </label>
            </div>

            {!formData.isBonus ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coefficient
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.coefficient}
                  onChange={(e) =>
                    setFormData({ ...formData, coefficient: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Ce coefficient sera multiplié par la taille du poisson
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Points bonus
                </label>
                <input
                  type="number"
                  name="basePoints"
                  value={formData.basePoints}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Ajouter l'espèce
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
