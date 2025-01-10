"use client";
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, searchBy, users]);

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter((user) => {
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
    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      const usersData = await adminService.getUsers();
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId) => {
    try {
      await adminService.toggleUserRole(userId);
      fetchUsers();
    } catch (error) {
      console.error("Error toggling role:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      try {
        await adminService.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await adminService.verifyUser(userId);
      fetchUsers();
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
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
                  handleVerifyUser(user.id);
                  onClose();
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard Administrateur</h1>

        {/* Barre de recherche */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
          >
            <option value="all">Tout</option>
            <option value="email">Email</option>
            <option value="name">Nom/Prénom</option>
            <option value="number">N° Adhérent</option>
            <option value="role">Rôle</option>
          </select>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl mb-4">Liste des Utilisateurs</h2>
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
                    <td className="px-4 py-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={user.roles.includes("ROLE_ADMIN")}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleRole(user.id);
                          }}
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
    </ProtectedRoute>
  );
}
