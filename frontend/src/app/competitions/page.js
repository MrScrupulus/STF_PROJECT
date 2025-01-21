"use client";
import { useState, useEffect } from "react";
import { competitionService } from "@/services/competitionService";
import Link from "next/link";
import styles from "@/styles/pages/competitions.module.scss";

export default function CompetitionsList() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await competitionService.getAll();
        setCompetitions(response.competitions || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching competitions:", error);
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  const getCompetitionStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { text: "À venir", className: styles.statusUpcoming };
    } else if (now >= start && now <= end) {
      return { text: "En cours", className: styles.statusOngoing };
    } else {
      return { text: "Terminée", className: styles.statusEnded };
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Compétitions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(competitions) &&
          competitions.map((competition) => (
            <div
              key={competition.id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{competition.name}</h3>
                <span
                  className={
                    getCompetitionStatus(
                      competition.startDate,
                      competition.endDate
                    ).className
                  }
                >
                  {
                    getCompetitionStatus(
                      competition.startDate,
                      competition.endDate
                    ).text
                  }
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">{competition.description}</p>
                <p>
                  <span className="font-medium">Type:</span> {competition.type}
                </p>
                <p>
                  <span className="font-medium">Dates:</span>{" "}
                  {new Date(competition.startDate).toLocaleDateString()} -{" "}
                  {new Date(competition.endDate).toLocaleDateString()}
                </p>
                <Link
                  href={`/competitions/${competition.id}/register`}
                  className="inline-block mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  S'inscrire
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
