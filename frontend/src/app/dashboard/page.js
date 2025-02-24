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
import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaCheckCircle, FaTimesCircle, FaSearch } from "react-icons/fa";

// Définir les en-têtes pour chaque section
const TABLE_HEADERS = {
  users: [
    { id: "name", label: "Nom" },
    { id: "firstname", label: "Prénom" },
    { id: "email", label: "Email" },
    { id: "role", label: "Rôle" },
    { id: "verified", label: "Statut Email", desktopOnly: true },
  ],
  competitions: [
    { id: "name", label: "Titre" },
    { id: "startDate", label: "Date et heure" },
    { id: "status", label: "Statut" },
  ],
  species: [
    { id: "name", label: "Nom" },
    { id: "coefficient", label: "Coefficient" },
  ],
  teams: [
    { id: "name", label: "Nom de l'équipe" },
    { id: "size", label: "Membres" },
  ],
};

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
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const router = useRouter();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filteredData, setFilteredData] = useState({
    users: [],
    competitions: [],
    teams: [],
    species: [],
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToModify, setUserToModify] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => ({
      users: {
        total: users.length,
        active: users.filter((u) => u.isVerified).length,
      },
      competitions: {
        total: competitions.length,
        active: competitions.filter((c) => new Date(c.endDate) > new Date())
          .length,
      },
      teams: {
        total: teams.length,
        registered: teams.filter((t) => t.isRegistered).length,
      },
      species: {
        total: species.length,
        bonus: species.filter((s) => s.isBonus).length,
      },
    }),
  });

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

      // Logs détaillés pour chaque réponse
      console.log("Users raw data:", usersData);
      console.log("Competitions raw data:", competitionsData);
      console.log("Species raw data:", speciesData);
      console.log("Teams raw data:", teamsData);

      // Extraction des données avec vérification de la structure
      const processedUsers = Array.isArray(usersData)
        ? usersData
        : usersData?.users || [];
      const processedCompetitions = competitionsData?.competitions || [];
      const processedSpecies = Array.isArray(speciesData)
        ? speciesData
        : speciesData?.data || [];
      const processedTeams = Array.isArray(teamsData)
        ? teamsData
        : teamsData?.teams || [];

      // Log des données traitées
      console.log("Processed data:", {
        users: processedUsers,
        competitions: processedCompetitions,
        species: processedSpecies,
        teams: processedTeams,
      });

      // Mise à jour du state avec vérification
      setUsers(processedUsers);
      setCompetitions(processedCompetitions);
      setSpecies(processedSpecies);
      setTeams(processedTeams);

      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Erreur lors du chargement des données");
      setLoading(false);
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

  useEffect(() => {
    const searchData = () => {
      const term = searchTerm.toLowerCase();

      const filteredUsers = users.filter((user) =>
        Object.values(user).some((value) =>
          String(value).toLowerCase().includes(term)
        )
      );

      const filteredCompetitions = competitions.filter((comp) =>
        Object.values(comp).some((value) =>
          String(value).toLowerCase().includes(term)
        )
      );

      const filteredTeams = teams.filter((team) =>
        Object.values(team).some((value) =>
          String(value).toLowerCase().includes(term)
        )
      );

      const filteredSpecies = species.filter((spec) =>
        Object.values(spec).some((value) =>
          String(value).toLowerCase().includes(term)
        )
      );

      setFilteredData({
        users: filteredUsers,
        competitions: filteredCompetitions,
        teams: filteredTeams,
        species: filteredSpecies,
      });
    };

    searchData();
  }, [searchTerm, users, competitions, teams, species]);

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

  const handleToggleRole = (user) => {
    setUserToModify(user);
    setShowRoleModal(true);
  };

  const confirmRoleChange = async () => {
    try {
      await adminService.toggleUserRole(userToModify.id);
      await fetchData();
      setShowRoleModal(false);
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
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

  const RoleSwitch = ({ isAdmin, onToggle }) => {
    return createElement(
      "div",
      { className: styles.switch__container },
      createElement("button", {
        className: `${styles.switch__toggle} ${
          isAdmin ? styles["switch__toggle--admin"] : ""
        }`,
        onClick: onToggle,
        "aria-label": "Toggle role",
      }),
      createElement(
        "span",
        { className: styles.switch__label },
        isAdmin ? "Admin" : "User"
      )
    );
  };

  const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return createElement(
      "div",
      {
        className: styles.modal__overlay,
        onClick: (e) => {
          if (e.target === e.currentTarget) onCancel();
        },
      },
      createElement(
        "div",
        { className: styles.modal__content },
        createElement(
          "div",
          { className: styles.modal__header },
          createElement("h2", null, "Confirmation")
        ),
        createElement(
          "div",
          { className: styles.modal__body },
          createElement("p", null, message)
        ),
        createElement(
          "div",
          { className: styles.modal__actions },
          createElement(
            "button",
            {
              onClick: onConfirm,
              className: `${styles.modal__button} ${styles["modal__button--confirm"]}`,
            },
            "Confirmer"
          ),
          createElement(
            "button",
            {
              onClick: onCancel,
              className: `${styles.modal__button} ${styles["modal__button--cancel"]}`,
            },
            "Annuler"
          )
        )
      )
    );
  };

  const UserDetailsModal = ({ user, onClose, onDelete, onUpdate }) => {
    const [isAdminLocal, setIsAdminLocal] = useState(
      user.roles?.includes("ROLE_ADMIN")
    );
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleRoleToggle = () => {
      setShowConfirm(true);
    };

    const handleDelete = () => {
      setShowDeleteConfirm(true);
    };

    const handleConfirmToggle = async () => {
      try {
        await handleToggleRole(user);
        setIsAdminLocal(!isAdminLocal);
        setShowConfirm(false);
        onClose();
      } catch (error) {
        console.error("Error toggling role:", error);
      }
    };

    const handleConfirmDelete = async () => {
      try {
        await onDelete(user.id);
        setShowDeleteConfirm(false);
        onClose();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    };

    useEffect(() => {
      setIsAdminLocal(user.roles?.includes("ROLE_ADMIN"));
    }, [user]);

    const userFields = [
      { label: "Prénom", value: user.firstname },
      { label: "Nom", value: user.lastname },
      { label: "Email", value: user.email },
      { label: "N° Adhérent", value: user.subscriberNumber },
      { label: "Rôles", value: user.roles?.join(", ") },
      { label: "Téléphone", value: user.phoneNumber },
      { label: "Pays", value: user.country },
      {
        label: "Date de naissance",
        value: user.birthdate
          ? new Date(user.birthdate).toLocaleDateString()
          : "",
      },
      { label: "Statut", value: user.isVerified ? "Vérifié" : "Non vérifié" },
    ];

    return createElement(
      "div",
      { className: styles.modal__overlay },
      createElement(
        "div",
        { className: styles.modal__content },
        createElement(
          "div",
          { className: styles.modal__header },
          createElement("h2", null, "Détails de l'utilisateur"),
          createElement(
            "button",
            { onClick: onClose, className: styles.modal__close },
            "×"
          )
        ),
        createElement(
          "div",
          { className: styles.modal__body },
          createElement(
            "div",
            { className: styles.user__details },
            userFields.map((field) =>
              createElement(
                "div",
                { key: field.label, className: styles.user__field },
                createElement(
                  "span",
                  { className: styles.user__label },
                  field.label
                ),
                createElement(
                  "span",
                  { className: styles.user__value },
                  field.value || "Non renseigné"
                )
              )
            )
          )
        ),
        createElement(
          "div",
          { className: styles.modal__actions },
          createElement(RoleSwitch, {
            isAdmin: isAdminLocal,
            onToggle: handleRoleToggle,
          }),
          createElement(
            "div",
            { className: styles.modal__buttons },
            createElement(
              "button",
              {
                onClick: () => onUpdate(user),
                className: `${styles.modal__button} ${styles["modal__button--primary"]}`,
              },
              "Modifier"
            ),
            createElement(
              "button",
              {
                onClick: handleDelete,
                className: `${styles.modal__button} ${styles["modal__button--danger"]}`,
              },
              "Supprimer"
            )
          )
        )
      ),
      showConfirm &&
        createElement(ConfirmModal, {
          message: `Êtes-vous sûr de vouloir ${
            isAdminLocal ? "retirer" : "ajouter"
          } les droits administrateur pour cet utilisateur ?`,
          onConfirm: handleConfirmToggle,
          onCancel: () => setShowConfirm(false),
        }),
      showDeleteConfirm &&
        createElement(ConfirmModal, {
          message: "Êtes-vous sûr de vouloir supprimer cet utilisateur ?",
          onConfirm: handleConfirmDelete,
          onCancel: () => setShowDeleteConfirm(false),
        })
    );
  };

  const CompetitionDetailsModal = ({ competition, onClose }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const status = getCompetitionStatus(
      competition.startDate,
      competition.endDate
    );

    const handleDelete = () => {
      setShowConfirm(true);
    };

    const handleConfirmDelete = async () => {
      try {
        await handleDeleteCompetition(competition.id);
        setShowConfirm(false);
        onClose();
      } catch (error) {
        console.error("Error deleting competition:", error);
      }
    };

    const competitionFields = [
      { label: "Titre", value: competition.name },
      {
        label: "Date de début",
        value: new Date(competition.startDate).toLocaleString(),
      },
      {
        label: "Date de fin",
        value: new Date(competition.endDate).toLocaleString(),
      },
      { label: "Type", value: competition.type },
      {
        label: "Statut",
        value: status.text,DOM,
        className: status.className,
      },
      {
        label: "Taille des équipes",
        value:
          typeof competition.teamSize === "number"
            ? `${competition.teamSize} pêcheur${
                competition.teamSize > 1 ? "s" : ""
              }`
            : "Non définie",
      },
      {
        label: "Participants max",
        value: competition.maxParticipants
          ? `${competition.maxParticipants} équipes`
          : "Sans limite",
      },
    ];

    return createElement(
      "div",
      { className: styles.modal__overlay },
      createElement(
        "div",
        { className: styles.modal__content },
        createElement(
          "div",
          { className: styles.modal__header },
          createElement("h2", null, "Détails de la compétition"),
          createElement(
            "button",
            { onClick: onClose, className: styles.modal__close },
            "×"
          )
        ),
        createElement(
          "div",
          { className: styles.modal__body },
          competitionFields.map((field) =>
            createElement(
              "div",
              { key: field.label, className: styles.user__field },
              createElement(
                "span",
                { className: styles.user__label },
                field.label
              ),
              createElement(
                "span",
                {
                  className: `${styles.user__value} ${field.className || ""}`,
                },
                field.value || "Non renseigné"
              )
            )
          )
        ),
        createElement(
          "div",
          { className: styles.modal__actions },
          createElement(
            "div",
            { className: styles.modal__buttons },
            createElement(
              "button",
              {
                onClick: () =>
                  router.push(`/dashboard/competitions/${competition.id}/edit`),
                className: `${styles.modal__button} ${styles["modal__button--primary"]}`,
              },
              "Modifier"
            ),
            createElement(
              "button",
              {
                onClick: handleDelete,
                className: `${styles.modal__button} ${styles["modal__button--danger"]}`,
              },
              "Supprimer"
            )
          )
        )
      ),
      showConfirm &&
        createElement(ConfirmModal, {
          message: "Êtes-vous sûr de vouloir supprimer cette compétition ?",
          onConfirm: handleConfirmDelete,
          onCancel: () => setShowConfirm(false),
        })
    );
  };

  const SpeciesDetailsModal = ({ species, onClose }) => {
    const [editData, setEditData] = useState({
      name: species?.name || "",
      coefficient: species?.coefficient?.toString() || "0",
      basePoints: species?.basePoints?.toString() || "50",
    });
    const [showConfirm, setShowConfirm] = useState(false);
    const isCreating = !species;

    const handleSave = () => {
      setShowConfirm(true);
    };

    const handleConfirmSave = async () => {
      try {
        const dataToSend = {
          name: editData.name,
          coefficient: parseFloat(editData.coefficient) || 0,
          basePoints: parseInt(editData.basePoints) || 50,
        };

        if (isCreating) {
          await speciesService.create(dataToSend);
        } else {
          await speciesService.update(species.id, dataToSend);
        }
        fetchData();
        setShowConfirm(false);
        onClose();
      } catch (error) {
        console.error("Error saving species:", error);
      }
    };

    return createElement(
      "div",
      { className: styles.modal__overlay },
      createElement(
        "div",
        { className: styles.modal__content },
        createElement(
          "div",
          { className: styles.species_modal__header },
          createElement("h2", null, "Détails de l'espèce"),
          createElement(
            "button",
            { onClick: onClose, className: styles.modal__close },
            "×"
          )
        ),
        createElement(
          "div",
          { className: styles.species_modal__body },
          createElement(
            "div",
            { className: styles.species_modal__form },
            createElement(
              "div",
              { className: styles.species_modal__field },
              createElement(
                "label",
                { className: styles.species_modal__label },
                "Nom de l'espèce"
              ),
              createElement("input", {
                type: "text",
                value: editData.name,
                onChange: (e) =>
                  setEditData({ ...editData, name: e.target.value }),
                className: styles.species_modal__input,
              })
            ),
            !isCreating &&
              createElement(
                "div",
                { className: styles.species_modal__field },
                createElement(
                  "label",
                  { className: styles.species_modal__label },
                  "Coefficient"
                ),
                createElement("input", {
                  type: "number",
                  step: "0.1",
                  min: "0",
                  value: editData.coefficient,
                  onChange: (e) =>
                    setEditData({
                      ...editData,
                      coefficient: e.target.value || "0",
                    }),
                  className: styles.species_modal__input,
                })
              ),
            createElement(
              "div",
              { className: styles.species_modal__field },
              createElement(
                "label",
                { className: styles.species_modal__label },
                "Points bonus"
              ),
              createElement("input", {
                type: "number",
                value: editData.basePoints,
                onChange: (e) =>
                  setEditData({
                    ...editData,
                    basePoints: parseInt(e.target.value),
                  }),
                className: styles.species_modal__input,
              })
            )
          ),
          createElement(
            "div",
            { className: styles.species_modal__actions },
            createElement(
              "button",
              {
                onClick: handleSave,
                className: `${styles.species_modal__button} ${styles["modal__button--primary"]}`,
              },
              isCreating ? "Créer" : "Enregistrer"
            )
          )
        )
      ),
      showConfirm &&
        createElement(ConfirmModal, {
          message: isCreating
            ? "Êtes-vous sûr de vouloir créer cette espèce ?"
            : "Êtes-vous sûr de vouloir modifier cette espèce ?",
          onConfirm: handleConfirmSave,
          onCancel: () => setShowConfirm(false),
        })
    );
  };

  const TeamDetailsModal = ({ team, onClose }) => {
    const [editData, setEditData] = useState({
      name: team?.name || "",
      members: team?.members || [],
    });
    const [showConfirm, setShowConfirm] = useState(false);
    const isCreating = !team;

    const handleSave = () => {
      setShowConfirm(true);
    };

    const handleConfirmSave = async () => {
      try {
        const dataToSend = {
          name: editData.name,
          members: editData.members,
        };

        if (isCreating) {
          await teamService.create(dataToSend);
        } else {
          await teamService.update(team.id, dataToSend);
        }
        fetchData();
        setShowConfirm(false);
        onClose();
      } catch (error) {
        console.error("Error saving team:", error);
      }
    };

    return createElement(
      "div",
      { className: styles.modal__overlay },
      createElement(
        "div",
        { className: styles.modal__content },
        createElement(
          "div",
          { className: styles.modal__header },
          createElement("h2", null, "Détails de l'équipe"),
          createElement(
            "button",
            { onClick: onClose, className: styles.modal__close },
            "×"
          )
        ),
        createElement(
          "div",
          { className: styles.modal__body },
          createElement(
            "div",
            { className: styles.user__details },
            [
              { label: "Nom", value: team.name },
              {
                label: "Membres",
                value: team.members
                  ?.map((m) => `${m.firstname} ${m.lastname}`)
                  .join(", "),
              },
              {
                label: "Compétition",
                value: team.competition
                  ? team.competition.name
                  : "Non inscrite",
              },
              {
                label: "N° d'inscription",
                value: team.registrationNumber || "Non attribué",
              },
            ].map((field) =>
              createElement(
                "div",
                { key: field.label, className: styles.user__field },
                createElement(
                  "span",
                  { className: styles.user__label },
                  field.label
                ),
                createElement(
                  "span",
                  { className: styles.user__value },
                  field.value || "Non renseigné"
                )
              )
            )
          )
        ),
        createElement(
          "div",
          { className: styles.modal__actions },
          createElement(
            "button",
            {
              onClick: handleSave,
              className: `${styles.modal__button} ${styles["modal__button--primary"]}`,
            },
            isCreating ? "Créer" : "Enregistrer"
          )
        )
      ),
      showConfirm &&
        createElement(ConfirmModal, {
          message: isCreating
            ? "Êtes-vous sûr de vouloir créer cette équipe ?"
            : "Êtes-vous sûr de vouloir modifier cette équipe ?",
          onConfirm: handleConfirmSave,
          onCancel: () => setShowConfirm(false),
        })
    );
  };

  // Fonction pour rendre le contenu des cellules
  const renderCellContent = (item, fieldId) => {
    if (!item) return "";

    switch (fieldId) {
      case "name":
        return item.lastname || item.name || "";
      case "firstname":
        return item.firstname || "";
      case "email":
        return item.email || "";
      case "startDate":
        return item.startDate ? new Date(item.startDate).toLocaleString() : "";
      case "coefficient":
        return item.coefficient || "0";
      case "status":
        if (item.startDate && item.endDate) {
          const status = getCompetitionStatus(item.startDate, item.endDate);
          return createElement(
            "span",
            { className: status.className },
            status.text
          );
        }
        return "";
      case "size":
        return item.members?.length || "0";
      case "role":
        const isAdmin = item.roles?.includes("ROLE_ADMIN");
        const isMobileView =
          typeof window !== "undefined" && window.innerWidth <= 600;

        if (isMobileView) {
          return createElement(
            "span",
            {
              className: `${styles.role_text} ${
                isAdmin ? styles["role_text--admin"] : styles["role_text--user"]
              }`,
            },
            isAdmin ? "Admin" : "User"
          );
        }

        return createElement(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: { display: "inline-block" },
          },
          createElement("button", {
            className: `${styles["role-switch"]} ${
              isAdmin
                ? styles["role-switch--admin"]
                : styles["role-switch--user"]
            }`,
            onClick: (e) => {
              e.stopPropagation();
              handleToggleRole(item);
            },
            title: isAdmin ? "Changer en User" : "Changer en Admin",
          })
        );
      case "verified":
        return item.isVerified ? (
          <span className={styles.verified}>Vérifié ✓</span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVerifyUser(item.id);
            }}
            className={styles.verifyButton}
          >
            Valider
          </button>
        );
      default:
        return item[fieldId] || "";
    }
  };

  // Fonction de rendu générique pour les tableaux
  const renderTable = (items, columns, type) => {
    const isMobileView =
      typeof window !== "undefined" && window.innerWidth <= 600;

    // Filtrer les colonnes selon le mode d'affichage
    const visibleColumns = columns.filter((column) => {
      if (isMobileView) {
        // En mobile : seulement nom, prénom, email et rôle
        return !column.desktopOnly;
      }
      // En desktop : toutes les colonnes
      return true;
    });

    return createElement(
      "table",
      { className: styles.dashboard__users_table },
      createElement(
        "thead",
        null,
        createElement(
          "tr",
          null,
          visibleColumns.map((column) =>
            createElement("th", { key: column.id }, column.label)
          )
        )
      ),
      createElement(
        "tbody",
        null,
        items.map((item) =>
          createElement(
            "tr",
            {
              key: item.id,
              onClick: () => handleItemClick(item, type),
              style: { cursor: "pointer" },
            },
            visibleColumns.map((column) =>
              createElement(
                "td",
                { key: column.id },
                renderCellContent(item, column.id)
              )
            )
          )
        )
      )
    );
  };

  const handleItemClick = (item, type) => {
    switch (type) {
      case "users":
        setSelectedUser(item);
        setShowUserModal(true);
        break;
      case "competitions":
        setSelectedCompetition(item);
        setShowCompetitionModal(true);
        break;
      case "teams":
        setSelectedTeam(item);
        setShowTeamModal(true);
        break;
      case "species":
        setSelectedSpecies(item);
        setShowSpeciesModal(true);
        break;
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setIsDarkTheme(savedTheme === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    const dashboard = document.querySelector(`.${styles.dashboard}`);
    if (dashboard) {
      dashboard.setAttribute("data-theme", isDarkTheme ? "dark" : "light");
    }
  }, [isDarkTheme]);

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log("Users data:", users);

  return createElement(
    ProtectedRoute,
    { requiredRole: "ROLE_ADMIN" },
    createElement(
      "div",
      { className: styles.dashboard__container },
      createElement(
        "div",
        { className: styles.dashboard__header },
        createElement(
          "div",
          { className: styles.dashboard__header_content },
          createElement(
            "h1",
            { className: styles.dashboard__title },
            "Tableau de bord"
          )
        )
      ),
      createElement(
        "div",
        { className: styles.dashboard__search },
        createElement(
          "div",
          { className: styles.dashboard__search_icon },
          createElement(FaSearch)
        ),
        createElement("input", {
          type: "text",
          placeholder: "Rechercher dans tous les tableaux...",
          className: styles.dashboard__search_input,
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
        })
      ),
      createElement(
        "div",
        {
          className: `${styles.dashboard__grid} ${
            searchTerm ? styles.searching : ""
          }`,
        },
        // Section Utilisateurs
        createElement(
          "div",
          {
            className: `${styles.dashboard__card} ${
              searchTerm && filteredData.users.length === 0
                ? styles["fade-out"]
                : ""
            }`,
            style: {
              display:
                searchTerm && filteredData.users.length === 0
                  ? "none"
                  : "block",
            },
          },
          createElement(
            "h2",
            { className: styles.dashboard__section_title },
            "Utilisateurs"
          ),
          createElement(
            "div",
            { className: styles.dashboard__users_list },
            renderTable(
              searchTerm ? filteredData.users : users,
              TABLE_HEADERS.users,
              "users"
            )
          )
        ),

        // Section Compétitions
        createElement(
          "div",
          {
            className: `${styles.dashboard__card} ${
              searchTerm && filteredData.competitions.length === 0
                ? styles["fade-out"]
                : ""
            }`,
            style: {
              display:
                searchTerm && filteredData.competitions.length === 0
                  ? "none"
                  : "block",
            },
          },
          createElement(
            "div",
            { className: styles.dashboard__section_header },
            createElement(
              "h2",
              { className: styles.dashboard__section_title },
              "Compétitions"
            ),
            createElement(
              "button",
              {
                className: styles.dashboard__create_button,
                onClick: () => router.push("/dashboard/competitions/create"),
              },
              "Créer une compétition"
            )
          ),
          createElement(
            "div",
            { className: styles.dashboard__users_list },
            renderTable(
              searchTerm ? filteredData.competitions : competitions,
              TABLE_HEADERS.competitions,
              "competitions"
            )
          )
        ),

        // Section Teams
        createElement(
          "div",
          {
            className: `${styles.dashboard__card} ${
              searchTerm && filteredData.teams.length === 0
                ? styles["fade-out"]
                : ""
            }`,
            style: {
              display:
                searchTerm && filteredData.teams.length === 0
                  ? "none"
                  : "block",
            },
          },
          createElement(
            "h2",
            { className: styles.dashboard__section_title },
            "Équipes"
          ),
          createElement(
            "div",
            { className: styles.dashboard__users_list },
            renderTable(
              searchTerm ? filteredData.teams : teams,
              TABLE_HEADERS.teams,
              "teams"
            )
          )
        ),

        // Section Species
        createElement(
          "div",
          {
            className: `${styles.dashboard__card} ${
              searchTerm && filteredData.species.length === 0
                ? styles["fade-out"]
                : ""
            }`,
            style: {
              display:
                searchTerm && filteredData.species.length === 0
                  ? "none"
                  : "block",
            },
          },
          createElement(
            "div",
            { className: styles.dashboard__section_header },
            createElement(
              "h2",
              { className: styles.dashboard__section_title },
              "Espèces"
            ),
            createElement(
              "button",
              {
                className: styles.dashboard__create_button,
                onClick: () => router.push("/dashboard/species/create"),
              },
              "Créer une espèce"
            )
          ),
          createElement(
            "div",
            { className: styles.dashboard__users_list },
            renderTable(
              searchTerm ? filteredData.species : species,
              TABLE_HEADERS.species,
              "species"
            )
          )
        )
      ),

      // Ajout des modals
      showUserModal &&
        createElement(UserDetailsModal, {
          user: selectedUser,
          onClose: () => setShowUserModal(false),
          onDelete: handleDeleteUser,
          onUpdate: (user) => {
            // Gérer la mise à jour
            router.push(`/dashboard/users/${user.id}/edit`);
          },
        }),

      showCompetitionModal &&
        createElement(CompetitionDetailsModal, {
          competition: selectedCompetition,
          onClose: () => setShowCompetitionModal(false),
        }),

      showSpeciesModal &&
        createElement(SpeciesDetailsModal, {
          species: selectedSpecies,
          onClose: () => setShowSpeciesModal(false),
        }),

      showTeamModal &&
        createElement(TeamDetailsModal, {
          team: selectedTeam,
          onClose: () => setShowTeamModal(false),
        }),

      showRoleModal &&
        userToModify &&
        createElement(
          "div",
          { className: styles.modal__overlay },
          createElement(
            "div",
            { className: styles.modal__content },
            createElement(
              "h3",
              { className: styles.modal__title },
              `Modifier le rôle de ${userToModify.firstname} ${userToModify.lastname}`
            ),
            createElement(
              "p",
              { className: styles.modal__text },
              `Êtes-vous sûr de vouloir ${
                userToModify.roles?.includes("ROLE_ADMIN")
                  ? "retirer"
                  : "ajouter"
              } les droits administrateur ?`
            ),
            createElement(
              "div",
              { className: styles.modal__actions },
              createElement(
                "button",
                {
                  className: `${styles.modal__button} ${styles["modal__button--confirm"]}`,
                  onClick: confirmRoleChange,
                },
                "Confirmer"
              ),
              createElement(
                "button",
                {
                  className: `${styles.modal__button} ${styles["modal__button--cancel"]}`,
                  onClick: () => setShowRoleModal(false),
                },
                "Annuler"
              )
            )
          )
        )
    )
  );
}

// Composant utilitaire pour les statistiques
function StatItem({ value, label }) {
  return createElement(
    "div",
    {
      className: styles.dashboard__stat,
    },
    createElement(
      "div",
      {
        className: styles.dashboard__stat_value,
      },
      value
    ),
    createElement(
      "div",
      {
        className: styles.dashboard__stat_label,
      },
      label
    )
  );
}
