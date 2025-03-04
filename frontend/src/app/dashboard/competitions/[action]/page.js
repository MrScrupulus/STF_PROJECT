"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/dashboard/competition-create.module.scss";

export default function CompetitionForm() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">
        Description
      </label>
      <textarea
        value={formData.description || ""}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        rows="4"
        placeholder="Description détaillée de la compétition..."
      />
    </div>
  );
}
