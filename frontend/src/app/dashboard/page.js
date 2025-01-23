"use client";
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { competitionService } from "@/services/competitionService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { speciesService } from "@/services/speciesService";
import styles from "@/styles/pages/dashboard.module.scss";
import { authService } from "@/services/authService";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [species, setSpecies] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const router = useRouter();

  const fetchData = async () => {
    try {
      console.log("Starting to fetch admin data...");
      const [usersData, competitionsData, speciesData, teamsData] =
        await Promise.all([
          adminService.getUsers(),
          competitionService.getAllAdmin(),
          speciesService.getAll(),
          adminService.getTeams(),
        ]);

      console.log("Admin data received:", {
        users: usersData,
        competitions: competitionsData,
        species: speciesData,
        teams: teamsData,
      });

      setUsers(usersData || []);
      setCompetitions(competitionsData?.competitions || []);
      setSpecies(speciesData || []);
      setTeams(teamsData || []);
      setLoading(false);
    } catch (error) {
      console.error("Detailed fetch error:", {
        message: error.message,
        status: error.status,
        fullError: error,
      });
      setError("Erreur lors du chargement des données");
      setLoading(false);
      if (error.status === 401) {
        console.log("Authentication error during data fetch");
        return;
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        console.log("User data in dashboard:", userData);
        if (!userData.success || !userData.user.roles.includes("ROLE_ADMIN")) {
          console.log("Non admin, redirection vers login");
          router.push("/login");
          return;
        }
        console.log("Admin user confirmed, fetching data");
        if (isMounted) {
          await fetchData();
        }
      } catch (error) {
        console.error("Auth error:", error);
        console.log("Letting ProtectedRoute handle the error");
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, searchBy, searchCategory, users, competitions]);

  const filterData = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      setFilteredCompetitions(competitions || []);
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
      const filteredComps = Array.isArray(competitions)
        ? competitions.filter((comp) => {
            return (
              comp.name.toLowerCase().includes(term) ||
              comp.type.toLowerCase().includes(term)
            );
          })
        : [];
      setFilteredCompetitions(filteredComps);
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

  const handleDeleteSpecies = async (speciesId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette espèce ?")) {
      try {
        await speciesService.delete(speciesId);
        fetchData();
      } catch (error) {
        console.error("Error deleting species:", error);
      }
    }
  };

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

  const SpeciesDetailsModal = ({ species, onClose }) => {
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({
      name: species.name,
      coefficient: species.coefficient,
      basePoints: species.basePoints,
      isBonus: species.name.toLowerCase() === "espèce bonus",
    });

    const handleUpdate = async () => {
      try {
        const dataToSend = {
          name: editData.name,
          coefficient:
            editData.name.toLowerCase() === "espèce bonus"
              ? 1
              : parseFloat(editData.coefficient),
          basePoints: editData.name.toLowerCase() === "espèce bonus" ? 50 : 50,
        };

        if (species) {
          await speciesService.update(species.id, dataToSend);
        } else {
          await speciesService.create(dataToSend);
        }
        fetchData();
        onClose();
      } catch (error) {
        console.error("Error updating/creating species:", error);
      }
    };

    const isBonus = editData.name.toLowerCase() === "espèce bonus";

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {species ? "Modifier l'espèce" : "Ajouter une espèce"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom de l'espèce
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {!isBonus && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editData.coefficient}
                    onChange={(e) =>
                      setEditData({ ...editData, coefficient: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Points bonus
                </label>
                <input
                  type="number"
                  value={editData.basePoints}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      basePoints: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-700">
                  Nom : <span className="text-green-600">{species.name}</span>
                </p>
              </div>
              {!species.isBonus && (
                <div>
                  <p className="font-semibold text-gray-700">
                    Coefficient :{" "}
                    <span className="text-green-600">
                      {species.coefficient}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-700">
                  Points bonus :{" "}
                  <span className="text-green-600">{species.basePoints}</span>
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            {editMode ? (
              <>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={handleUpdate}
                >
                  Enregistrer
                </button>
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  onClick={() => setEditMode(false)}
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => setEditMode(true)}
                >
                  Modifier
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        "Êtes-vous sûr de vouloir supprimer cette espèce ?"
                      )
                    ) {
                      handleDeleteSpecies(species.id);
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
              </>
            )}
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
      <div className={styles.dashboardContainer}>
        <h1 className={styles.title}>Bureau de l'ombre</h1>

        {/* Barre de recherche globale */}
        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Rechercher dans les compétitions et utilisateurs..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.searchSelect}>
              <select
                className={styles.searchSelect}
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
              >
                <option value="all">Tout</option>
                <option value="competitions">Compétitions</option>
                <option value="users">Utilisateurs</option>
                <option value="teams">Équipes</option>
                <option value="species">Espèces</option>
              </select>
              {searchCategory !== "competitions" && (
                <select
                  className={styles.searchSelect}
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                >
                  <option value="all">Tous les champs</option>
                  <option value="email">Email</option>
                  <option value="name">Nom/Prénom</option>
                  <option value="number">N° Adhérent</option>
                  <option value="role">Rôle</option>
                  <option value="teams">Équipes</option>
                  <option value="species">Espèces</option>
                  <option value="competitions">Compétitions</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Section Compétitions */}
        <div className={styles.contentGrid}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <h2>Compétitions</h2>
              <Link
                href="/dashboard/competitions/create"
                className={styles.createButton}
              >
                Créer une compétition
              </Link>
            </div>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Nom</th>
                    <th className={styles.tableHeader}>Type</th>
                    <th className={styles.tableHeader}>Date</th>
                    <th className={styles.tableHeader}>Statut</th>
                    <th className={styles.tableHeader}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompetitions.map((competition) => (
                    <tr
                      key={competition.id}
                      className={styles.tableRow}
                      onClick={() => {
                        setSelectedCompetition(competition);
                        setShowCompetitionModal(true);
                      }}
                    >
                      <td className={styles.tableCell}>{competition.name}</td>
                      <td className={styles.tableCell}>{competition.type}</td>
                      <td className={styles.tableCell}>
                        {new Date(competition.startDate).toLocaleDateString()}
                      </td>
                      <td className={styles.tableCell}>
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
                      </td>
                      <td className={styles.tableCell}>
                        <button className={styles.editButton}>Modifier</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Utilisateurs */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Utilisateurs</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Email</th>
                    <th className={styles.tableHeader}>Nom</th>
                    <th className={styles.tableHeader}>Prénom</th>
                    <th className={styles.tableHeader}>N° Adhérent</th>
                    <th className={styles.tableHeader}>Vérifié</th>
                    <th className={styles.tableHeader}>Rôle Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={styles.tableRow}
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal(true);
                      }}
                    >
                      <td className={styles.tableCell}>{user.email}</td>
                      <td className={styles.tableCell}>{user.lastname}</td>
                      <td className={styles.tableCell}>{user.firstname}</td>
                      <td className={styles.tableCell}>
                        {user.subscriberNumber}
                      </td>
                      <td className={styles.tableCell}>
                        {user.isVerified ? (
                          <span className={styles.verified}>✓</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyUser(user.id);
                            }}
                            className={styles.verifyButton}
                          >
                            Valider
                          </button>
                        )}
                      </td>
                      <td
                        className={styles.tableCell}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={user.roles.includes("ROLE_ADMIN")}
                            onChange={() => handleToggleRole(user.id)}
                          />
                          <div className={styles.checkboxBackground}></div>
                          <span className={styles.checkboxText}>
                            {user.roles.includes("ROLE_ADMIN") ? (
                              <span className={styles.adminText}>Admin</span>
                            ) : (
                              <span className={styles.userText}>User</span>
                            )}
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

          {/* Section Espèces */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <h2>Espèces</h2>
              <button
                onClick={() => {
                  setSelectedSpecies(null);
                  setShowSpeciesModal(true);
                }}
                className={styles.createButton}
              >
                Ajouter une espèce
              </button>
            </div>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Nom</th>
                    <th className={styles.tableHeader}>Coefficient</th>
                    <th className={styles.tableHeader}>Points bonus</th>
                    <th className={styles.tableHeader}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {species.map((specie) => (
                    <tr
                      key={specie.id}
                      className={styles.tableRow}
                      onClick={() => {
                        setSelectedSpecies(specie);
                        setShowSpeciesModal(true);
                      }}
                    >
                      <td className={styles.tableCell}>{specie.name}</td>
                      <td className={styles.tableCell}>{specie.coefficient}</td>
                      <td className={styles.tableCell}>{specie.basePoints}</td>
                      <td className={styles.tableCell}>
                        <button className={styles.editButton}>Modifier</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section des équipes */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <h2>Équipes</h2>
            </div>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Nom de l'équipe</th>
                    <th>Membres</th>
                    <th>Compétition</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td>{team.name}</td>
                      <td>
                        {team.members
                          .map(
                            (member) => `${member.firstname} ${member.lastname}`
                          )
                          .join(", ")}
                      </td>
                      <td>{team.competition?.name || "Aucune"}</td>
                      <td>
                        <button
                          onClick={() => handleEditTeam(team)}
                          className={styles.editButton}
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
        {showSpeciesModal && (
          <SpeciesDetailsModal
            species={selectedSpecies}
            onClose={() => {
              setShowSpeciesModal(false);
              setSelectedSpecies(null);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
