"use client";
import { useState } from "react";
import { competitionService } from "@/services/competitionService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CreateCompetition() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    teamSize: "",
    type: "street",
    maxParticipants: "",
    hasNoLimit: false,
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending data:", formData); // Debug
      await competitionService.create(formData);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating competition:", error);
    }
  };

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Créer une compétition</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titre
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date de début
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Taille des équipes
              </label>
              <input
                type="number"
                value={formData.teamSize}
                onChange={(e) =>
                  setFormData({ ...formData, teamSize: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="street">Street</option>
                <option value="boat">Boat</option>
                <option value="float">Float</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasNoLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, hasNoLimit: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Pas de limite de participants
                </span>
              </label>
            </div>

            {!formData.hasNoLimit && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre maximum de participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxParticipants: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="1"
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Créer la compétition
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
