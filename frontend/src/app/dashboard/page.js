"use client";
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { competitionService } from "@/services/competitionService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, searchBy, searchCategory, users, competitions]);

  const filterData = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      setFilteredCompetitions(competitions);
      return;
    }

    const term = searchTerm.toLowerCase();

    if (searchCategory === "all" || searchCategory === "users") {
      const filteredUsers = users.filter((user) => {
        switch (searchBy) {
          case "email":
            return user.email.toLowerCase().includes(term);
          case "name":
            return (
              user.firstname.toLowerCase().includes(term) ||
              user.lastname.toLowerCase().includes(term)
            );
          case "number":
            return user.subscriberNumber.toLowerCase().includes(term);
          case "role":
            return user.roles.some((role) => role.toLowerCase().includes(term));
          default:
            return (
              user.email.toLowerCase().includes(term) ||
              user.firstname.toLowerCase().includes(term) ||
              user.lastname.toLowerCase().includes(term) ||
              user.subscriberNumber.toLowerCase().includes(term) ||
              user.roles.some((role) => role.toLowerCase().includes(term))
            );
        }
      });
      setFilteredUsers(filteredUsers);
    }

    if (searchCategory === "all" || searchCategory === "competitions") {
      const filteredComps = competitions.filter((comp) => {
        return (
          comp.name.toLowerCase().includes(term) ||
          comp.type.toLowerCase().includes(term)
        );
      });
      setFilteredCompetitions(filteredComps);
    }
  };

  const fetchData = async () => {
    try {
      const [usersData, competitionsData] = await Promise.all([
        adminService.getUsers(),
        competitionService.getAll(),
      ]);
      setUsers(usersData);
      setCompetitions(competitionsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir modifier le rôle de cet utilisateur ?"
      )
    ) {
      try {
        await adminService.toggleUserRole(userId);
        fetchData();
      } catch (error) {
        console.error("Error toggling role:", error);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      try {
        await adminService.deleteUser(userId);
        fetchData();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleVerifyUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir valider cet utilisateur ?")) {
      try {
        await adminService.verifyUser(userId);
        fetchData();
      } catch (error) {
        console.error("Error verifying user:", error);
      }
    }
  };

  const handleDeleteCompetition = async (competitionId) => {
    try {
      await competitionService.delete(competitionId);
      fetchData();
    } catch (error) {
      console.error("Error deleting competition:", error);
    }
  };

  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Détails de l'utilisateur</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Informations personnelles</h3>
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Nom:</span> {user.lastname}
              </p>
              <p>
                <span className="font-medium">Prénom:</span> {user.firstname}
              </p>
              <p>
                <span className="font-medium">N° Adhérent:</span>{" "}
                {user.subscriberNumber}
              </p>
              <p>
                <span className="font-medium">Date de naissance:</span>{" "}
                {user.birthdate
                  ? new Date(user.birthdate).toLocaleDateString()
                  : "Non renseignée"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Coordonnées</h3>
              <p>
                <span className="font-medium">Pays:</span> {user.country}
              </p>
              <p>
                <span className="font-medium">Téléphone:</span>{" "}
                {user.phoneNumber}
              </p>
              <p>
                <span className="font-medium">Statut:</span>{" "}
                {user.isVerified ? (
                  <span className="text-green-600">Vérifié</span>
                ) : (
                  <span className="text-red-600">Non vérifié</span>
                )}
              </p>
              <p>
                <span className="font-medium">Rôle:</span>{" "}
                {user.roles.join(", ")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end items-center space-x-3">
            {!user.isVerified && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Êtes-vous sûr de vouloir valider ce profil ?"
                    )
                  ) {
                    handleVerifyUser(user.id);
                    onClose();
                  }
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Valider le profil
              </button>
            )}
            <button
              onClick={() => {
                router.push(`/dashboard/users/${user.id}/edit`);
                onClose();
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Modifier
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
                  )
                ) {
                  handleDeleteUser(user.id);
                  onClose();
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Supprimer
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CompetitionDetailsModal = ({ competition, onClose }) => {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{competition.name}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-700">Dates :</p>
              <p>
                Début :{" "}
                <span className="text-green-600">
                  {new Date(competition.startDate).toLocaleString()}
                </span>
              </p>
              <p>
                Fin :{" "}
                <span className="text-green-600">
                  {new Date(competition.endDate).toLocaleString()}
                </span>
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                Type :{" "}
                <span className="text-green-600">{competition.type}</span>
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                Taille des équipes :{" "}
                <span className="text-green-600">{competition.teamSize}</span>
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                Nombre maximum de participants :{" "}
                <span className="text-green-600">
                  {competition.maxParticipants || "Sans limite"}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Ajouter la logique de modification
                }}
              >
                Modifier
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      "Êtes-vous sûr de vouloir supprimer cette compétition ?"
                    )
                  ) {
                    handleDeleteCompetition(competition.id);
                    onClose();
                  }
                }}
              >
                Supprimer
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={onClose}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Bureau de l'ombre</h1>

        {/* Barre de recherche globale */}
        <div className="bg-white shadow-lg rounded-lg p-4 mb-8">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher dans les compétitions et utilisateurs..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
              >
                <option value="all">Tout</option>
                <option value="competitions">Compétitions</option>
                <option value="users">Utilisateurs</option>
              </select>
              {searchCategory !== "competitions" && (
                <select
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                >
                  <option value="all">Tous les champs</option>
                  <option value="email">Email</option>
                  <option value="name">Nom/Prénom</option>
                  <option value="number">N° Adhérent</option>
                  <option value="role">Rôle</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Section Compétitions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Compétitions</h2>
            <Link
              href="/dashboard/competitions/create"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Créer une compétition
            </Link>
          </div>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date de début
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date de fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompetitions.map((competition) => (
                  <tr
                    key={competition.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedCompetition(competition);
                      setShowCompetitionModal(true);
                    }}
                  >
                    <td className="px-6 py-4">{competition.name}</td>
                    <td className="px-6 py-4">
                      {new Date(competition.startDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(competition.endDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{competition.type}</td>
                    <td className="px-6 py-4">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompetition(competition);
                          setShowCompetitionModal(true);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              "Êtes-vous sûr de vouloir supprimer cette compétition ?"
                            )
                          ) {
                            handleDeleteCompetition(competition.id);
                          }
                        }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section Utilisateurs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Utilisateurs</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Prénom</th>
                    <th className="px-4 py-2">N° Adhérent</th>
                    <th className="px-4 py-2">Vérifié</th>
                    <th className="px-4 py-2">Rôle Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal(true);
                      }}
                    >
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.lastname}</td>
                      <td className="px-4 py-2">{user.firstname}</td>
                      <td className="px-4 py-2">{user.subscriberNumber}</td>
                      <td className="px-4 py-2">
                        {user.isVerified ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyUser(user.id);
                            }}
                            className="text-blue-500 hover:text-blue-700 underline"
                          >
                            Valider
                          </button>
                        )}
                      </td>
                      <td
                        className="px-4 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={user.roles.includes("ROLE_ADMIN")}
                            onChange={() => handleToggleRole(user.id)}
                          />
                          <div className="w-11 h-6 bg-red-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          <span className="ml-3 text-sm font-medium">
                            {user.roles.includes("ROLE_ADMIN") ? (
                              <span className="text-green-600">Admin</span>
                            ) : (
                              <span className="text-red-600">User</span>
                            )}
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showModal && (
            <UserDetailsModal
              user={selectedUser}
              onClose={() => {
                setShowModal(false);
                setSelectedUser(null);
              }}
            />
          )}
        </div>

        {/* Modals */}
        {showCompetitionModal && (
          <CompetitionDetailsModal
            competition={selectedCompetition}
            onClose={() => {
              setShowCompetitionModal(false);
              setSelectedCompetition(null);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
