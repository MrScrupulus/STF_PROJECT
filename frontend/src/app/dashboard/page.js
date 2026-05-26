"use client";
import { useEffect, useState, useMemo } from "react";
import { adminService } from "../../services/adminService";
import { teamService } from "../../services/teamService";
import { competitionService } from "../../services/competitionService";
import { competitionsService } from "../../services/competitions";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import Link from "next/link";
import { speciesService } from "../../services/speciesService";
import styles from "../../styles/pages/dashboard.module.scss";
import modalStyles from "../../styles/components/ui/modal.module.scss";
import { authService } from "../../services/authService";
import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaCheckCircle, FaTimesCircle, FaSearch } from "react-icons/fa";
import { toast } from "react-hot-toast";
import classNames from "classnames";
import layoutStyles from "../../styles/components/layout/layout.module.scss";
import SpeciesPieChart from "../../components/competition/SpeciesPieChart";
import CatchesMap from "../../components/competition/CatchesMap";
import { perimeterService } from "../../services/perimeterService";
import { logger } from "../../utils/logger";
import { resolvePhotoUri } from "../../utils/photoUrl";
import { formatCompetitionDateTime } from "../../utils/dateUtils";

/** Normalisation pour recherche sans accents */
function normalizeForSearch(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
  const [pendingCatches, setPendingCatches] = useState([]);
  const [pendingCatchesPage, setPendingCatchesPage] = useState(1);
  const [pendingCatchesPages, setPendingCatchesPages] = useState(1);
  const [pendingCatchesTotal, setPendingCatchesTotal] = useState(0);
  const PENDING_CATCHES_LIMIT = 10;
  const [selectedCatch, setSelectedCatch] = useState(null);
  const [showCatchModal, setShowCatchModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyTeamId, setPenaltyTeamId] = useState("");
  const [penaltyPoints, setPenaltyPoints] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [penaltyFishCatchId, setPenaltyFishCatchId] = useState("");
  const [penaltyCatchOptions, setPenaltyCatchOptions] = useState([]);
  const [penaltyList, setPenaltyList] = useState([]);
  const [penaltyTotal, setPenaltyTotal] = useState(0);
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [penaltyScope, setPenaltyScope] = useState("global");
  const [penaltySubmitBusy, setPenaltySubmitBusy] = useState(false);
  const [penaltyCompetitionId, setPenaltyCompetitionId] = useState("");
  const [penaltyTeamSearch, setPenaltyTeamSearch] = useState("");

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
      logger.debug("Starting to fetch admin data...");
      const [usersData, competitionsData, speciesData, teamsData, pendingCatchesData] =
        await Promise.all([
          adminService.getUsers(),
          competitionService.getAllAdmin(),
          speciesService.getAll(),
          adminService.getTeams(),
          adminService
            .getPendingCatches(1, PENDING_CATCHES_LIMIT)
            .catch(() => ({ success: true, catches: [], total: 0, page: 1, pages: 1 })),
        ]);

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

      logger.debug("Processed data:", {
        users: processedUsers.length,
        competitions: processedCompetitions.length,
        species: processedSpecies.length,
        teams: processedTeams.length,
      });

      // Mise à jour du state avec vérification
      setUsers(processedUsers);
      setCompetitions(processedCompetitions);
      setSpecies(processedSpecies);
      setTeams(processedTeams);
      setPendingCatches(pendingCatchesData?.catches || []);
      setPendingCatchesPage(pendingCatchesData?.page || 1);
      setPendingCatchesPages(pendingCatchesData?.pages || 1);
      setPendingCatchesTotal(pendingCatchesData?.total || 0);

      setLoading(false);
    } catch (error) {
      logger.error("Fetch error:", error);
      setError("Erreur lors du chargement des données");
      setLoading(false);
    }
  };

  const loadMorePendingCatches = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const nextPage = pendingCatchesPage + 1;
      if (nextPage > pendingCatchesPages) {
        return;
      }

      logger.debug('Chargement page suivante:', { nextPage, currentPage: pendingCatchesPage, totalPages: pendingCatchesPages });

      const response = await adminService.getPendingCatches(
        nextPage,
        PENDING_CATCHES_LIMIT
      );

      logger.debug('Réponse backend:', {
        page: response?.page,
        pages: response?.pages,
        total: response?.total,
        catchesCount: response?.catches?.length
      });

      const newCatches = response?.catches || [];
      
      // Filtrer les doublons en vérifiant les IDs
      setPendingCatches((prev) => {
        const existingIds = new Set(prev.map(c => c.id));
        const uniqueNewCatches = newCatches.filter(c => !existingIds.has(c.id));
        return [...prev, ...uniqueNewCatches];
      });
      
      setPendingCatchesPage(response?.page || nextPage);
      setPendingCatchesPages(response?.pages || pendingCatchesPages);
      setPendingCatchesTotal(response?.total || pendingCatchesTotal);
    } catch (error) {
      logger.error("Error loading more pending catches:", error);
      toast.error("Erreur lors du chargement des prises supplémentaires");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        // ProtectedRoute gère déjà l'authentification, on charge juste les données
        if (isMounted) {
          await fetchData();
        }
      } catch (error) {
        logger.error("Error loading data:", error);
        setError("Erreur lors du chargement des données");
      }
    };
    loadData();
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
      logger.error("Erreur lors du changement de rôle:", error);
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
        logger.error("Error deleting user:", error);
      }
    }
  };

  const handleVerifyUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir valider cet utilisateur ?")) {
      try {
        await adminService.verifyUser(userId);
        fetchData();
      } catch (error) {
        logger.error("Error verifying user:", error);
      }
    }
  };

  const handleDeleteCompetition = async (competitionId) => {
    try {
      await competitionService.delete(competitionId);
      fetchData();
    } catch (error) {
      logger.error("Error deleting competition:", error);
    }
  };

  const handleDeleteSpecies = async (speciesId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette espèce ?")) {
      try {
        await speciesService.delete(speciesId);
        fetchData();
      } catch (error) {
        logger.error("Error deleting species:", error);
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
        className: modalStyles.modal__overlay,
        onClick: (e) => {
          if (e.target === e.currentTarget) onCancel();
        },
      },
      createElement(
        "div",
        { className: modalStyles.modal__content },
        createElement(
          "div",
          { className: modalStyles.modal__header },
          createElement("h2", null, "Confirmation")
        ),
        createElement(
          "div",
          { className: modalStyles.modal__body },
          createElement("p", null, message)
        ),
        createElement(
          "div",
          { className: modalStyles.modal__actions },
          createElement(
            "button",
            {
              onClick: onConfirm,
              className: `${modalStyles.modal__button} ${modalStyles["modal__button--confirm"]}`,
            },
            "Confirmer"
          ),
          createElement(
            "button",
            {
              onClick: onCancel,
              className: `${modalStyles.modal__button} ${modalStyles["modal__button--cancel"]}`,
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
        logger.error("Error toggling role:", error);
      }
    };

    const handleConfirmDelete = async () => {
      try {
        await onDelete(user.id);
        setShowDeleteConfirm(false);
        onClose();
      } catch (error) {
        logger.error("Error deleting user:", error);
      }
    };

    useEffect(() => {
      setIsAdminLocal(user.roles?.includes("ROLE_ADMIN"));
    }, [user]);

    const userFields = [
      { label: "Prénom", value: user.firstname },
      { label: "Nom", value: user.lastname },
      { label: "Email", value: user.email },
      { label: "Rôles", value: user.roles?.join(", ") },
      { label: "Téléphone", value: user.phoneNumber },
      { label: "Statut", value: user.isVerified ? "Vérifié" : "Non vérifié" },
    ];

    return createElement(
      "div",
      { className: modalStyles.modal__overlay },
      createElement(
        "div",
        { className: modalStyles.modal__content },
        createElement(
          "div",
          { className: modalStyles.modal__header },
          createElement("h2", null, "Détails de l'utilisateur"),
          createElement(
            "button",
            { onClick: onClose, className: modalStyles.modal__close },
            "×"
          )
        ),
        createElement(
          "div",
          { className: modalStyles.modal__body },
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
          { className: modalStyles.modal__actions },
          createElement(RoleSwitch, {
            isAdmin: isAdminLocal,
            onToggle: handleRoleToggle,
          }),
          createElement(
            "div",
            { className: modalStyles.modal__buttons },
            createElement(
              "button",
              {
                onClick: () => onUpdate(user),
                className: `${modalStyles.modal__button} ${modalStyles["modal__button--primary"]}`,
              },
              "Modifier"
            ),
            createElement(
              "button",
              {
                onClick: handleDelete,
                className: `${modalStyles.modal__button} ${modalStyles["modal__button--danger"]}`,
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
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [isRankingPublic, setIsRankingPublic] = useState(competition.isRankingPublic || false);
    const [updatingRanking, setUpdatingRanking] = useState(false);
    const [perimeters, setPerimeters] = useState([]);
    const status = getCompetitionStatus(
      competition.startDate,
      competition.endDate
    );

    // Mettre à jour isRankingPublic quand la compétition change
    useEffect(() => {
      setIsRankingPublic(competition.isRankingPublic || false);
    }, [competition.isRankingPublic]);

    const handleDelete = () => {
      setShowConfirm(true);
    };

    const handleConfirmDelete = async () => {
      try {
        await handleDeleteCompetition(competition.id);
        setShowConfirm(false);
        onClose();
      } catch (error) {
        logger.error("Error deleting competition:", error);
      }
    };

    const handleLoadStats = async () => {
      if (stats) {
        setShowStats(!showStats);
        return;
      }
      
      setLoadingStats(true);
      try {
        const [statsResponse, perimetersResponse] = await Promise.all([
          competitionsService.getStats(competition.id),
          perimeterService.getAll(competition.id).catch(() => ({ success: true, perimeters: [] }))
        ]);
        
        if (statsResponse.success) {
          setStats(statsResponse.stats);
          setShowStats(true);
        }
        
        if (perimetersResponse.success) {
          setPerimeters(perimetersResponse.perimeters || []);
        }
      } catch (error) {
        logger.error("Error loading stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    const handleToggleRankingVisibility = async () => {
      setUpdatingRanking(true);
      const newValue = !isRankingPublic;
      try {
        const response = await competitionsService.update(competition.id, {
          ...competition,
          isRankingPublic: newValue,
        });
        
        if (response.success) {
          setIsRankingPublic(newValue);
          // Mettre à jour la compétition dans la liste locale
          const updatedCompetition = { ...competition, isRankingPublic: newValue };
          setSelectedCompetition(updatedCompetition);
          
          // Rafraîchir les données pour mettre à jour l'affichage
          fetchData();
          
          // Afficher un message de confirmation avec toast
          toast.success(newValue 
            ? "✅ Le classement est maintenant public et visible par tous les utilisateurs." 
            : "🔒 Le classement est maintenant privé et visible uniquement par les administrateurs.",
            { duration: 4000 }
          );
        }
      } catch (error) {
        logger.error("Error updating ranking visibility:", error);
        toast.error("❌ Erreur lors de la mise à jour de la visibilité du classement.");
      } finally {
        setUpdatingRanking(false);
      }
    };

    // Récupérer les espèces de la compétition
    const competitionSpecies = competition.species || [];

    const competitionFields = [
      { label: "Titre", value: competition.name },
      {
        label: "Date de début",
        value: formatCompetitionDateTime(competition.startDate),
      },
      {
        label: "Date de fin",
        value: formatCompetitionDateTime(competition.endDate),
      },
      { label: "Type", value: competition.type },
      {
        label: "Statut",
        value: status.text,
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
      { className: modalStyles.modal__overlay },
      createElement(
        "div",
        { className: modalStyles.modal__content },
        createElement(
          "div",
          { className: modalStyles.modal__header },
          createElement("h2", null, "Détails de la compétition"),
          createElement(
            "button",
            { onClick: onClose, className: modalStyles.modal__close },
            "×"
          )
        ),
        createElement(
          "div",
          { className: modalStyles.modal__body },
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
          ),
          competitionSpecies.length > 0 && createElement(
            "div",
            { className: styles.user__field },
            createElement(
              "span",
              { className: styles.user__label },
              "Espèces configurées"
            ),
            createElement(
              "div",
              { style: { marginTop: "8px" } },
              competitionSpecies.map((compSpecies) =>
                createElement(
                  "div",
                  {
                    key: compSpecies.id,
                    style: {
                      padding: "8px",
                      marginBottom: "8px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                    },
                  },
                  createElement(
                    "div",
                    { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" } },
                    createElement("strong", null, compSpecies.name),
                    compSpecies.isBonusEnabled && createElement(
                      "span",
                      {
                        style: {
                          backgroundColor: "#10b981",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                        },
                      },
                      "Bonus"
                    )
                  ),
                  createElement(
                    "div",
                    { style: { fontSize: "14px", color: "#666" } },
                    `Coefficient: ${compSpecies.coefficient}`,
                    compSpecies.basePoints !== null && compSpecies.basePoints !== undefined &&
                      createElement("span", { style: { marginLeft: "12px" } }, `| Points bonus: ${compSpecies.basePoints}`)
                  )
                )
              )
            )
          ),
          createElement(
            "div",
            { className: styles.user__field },
            createElement(
              "span",
              { className: styles.user__label },
              "Classement public"
            ),
            createElement(
              "div",
              { className: styles.competition__ranking_toggle },
              createElement(
                "div",
                { className: styles.competition__ranking_status_wrapper },
                createElement(
                  "span",
                  { 
                    className: `${styles.competition__ranking_status} ${
                      isRankingPublic ? styles["competition__ranking_status--public"] : styles["competition__ranking_status--private"]
                    }`
                  },
                  isRankingPublic ? "✅ Visible par tous" : "🔒 Visible uniquement par les administrateurs"
                ),
                isRankingPublic && createElement(
                  "span",
                  { className: styles.competition__ranking_badge },
                  "PUBLIÉ"
                )
              ),
              createElement(
                "button",
                {
                  onClick: handleToggleRankingVisibility,
                  disabled: updatingRanking,
                  className: `${styles.competition__ranking_toggle_btn} ${
                    isRankingPublic ? styles["competition__ranking_toggle_btn--active"] : ""
                  }`,
                },
                updatingRanking ? "..." : (isRankingPublic ? "Masquer" : "Publier")
              )
            )
          ),
          createElement(
            "div",
            { className: styles.competition__stats_section },
            createElement(
              "button",
              {
                onClick: handleLoadStats,
                className: `${modalStyles.modal__button} ${modalStyles["modal__button--secondary"]}`,
                disabled: loadingStats,
              },
              loadingStats ? "Chargement..." : (showStats ? "Masquer les statistiques" : "Afficher les statistiques")
            ),
            showStats && stats && createElement(
              "div",
              { className: styles.competition__stats_content },
              createElement(
                "div",
                { className: styles.competition__stats_summary },
                createElement(
                  "h3",
                  { className: styles.competition__stats_title },
                  "Résumé"
                ),
                createElement(
                  "div",
                  { className: styles.competition__stats_item },
                  createElement("strong", null, "Total de poissons pêchés : "),
                  stats.totalCatches || 0
                )
              ),
              stats.speciesStats && stats.speciesStats.length > 0 && createElement(
                "div",
                { className: styles.competition__stats_species },
                createElement(
                  "h3",
                  { className: styles.competition__stats_title },
                  "Répartition par espèce"
                ),
                createElement(SpeciesPieChart, { speciesStats: stats.speciesStats })
              ),
              stats.catchesForMap && stats.catchesForMap.length > 0 && createElement(
                "div",
                { className: styles.competition__stats_map },
                createElement(
                  "h3",
                  { className: styles.competition__stats_title },
                  "Localisation des prises"
                ),
                createElement(CatchesMap, { 
                  catches: stats.catchesForMap,
                  perimeters: perimeters
                })
              ),
              stats.biggestBySpecies && stats.biggestBySpecies.length > 0 && createElement(
                "div",
                { className: styles.competition__stats_biggest },
                createElement(
                  "h3",
                  { className: styles.competition__stats_title },
                  "Plus grand poisson par espèce"
                ),
                createElement(
                  "div",
                  { className: styles.competition__biggest_list },
                  stats.biggestBySpecies.map((biggest) =>
                    createElement(
                      "div",
                      { key: biggest.id, className: styles.competition__biggest_item },
                      createElement(
                        "div",
                        { className: styles.competition__biggest_header },
                        createElement("strong", null, biggest.species.name),
                        createElement("span", { className: styles.competition__biggest_size }, `${biggest.size} cm`)
                      ),
                      createElement(
                        "div",
                        { className: styles.competition__biggest_details },
                        createElement("div", null, `Équipe : ${biggest.team.name}${biggest.team.registrationNumber ? ` (N° ${biggest.team.registrationNumber})` : ""}`),
                        biggest.caughtBy && createElement("div", null, `Pêché par : ${biggest.caughtBy.firstname} ${biggest.caughtBy.lastname}`),
                        createElement("div", null, `Points : ${biggest.points} pts`),
                        createElement("div", { className: styles.competition__biggest_date }, `Date : ${new Date(biggest.createdAt).toLocaleString("fr-FR")}`)
                      )
                    )
                  )
                )
              ),
              stats.top3BySpecies && Object.keys(stats.top3BySpecies).length > 0 && createElement(
                "div",
                { className: styles.competition__stats_top3 },
                createElement(
                  "h3",
                  { className: styles.competition__stats_title },
                  "Top 3 des plus grands poissons par espèce"
                ),
                Object.entries(stats.top3BySpecies).map(([speciesId, top3]) => {
                  const speciesName = top3[0]?.species?.name || "Inconnu";
                  return createElement(
                    "div",
                    { key: speciesId, className: styles.competition__top3_species },
                    createElement(
                      "h4",
                      { className: styles.competition__top3_species_title },
                      speciesName
                    ),
                    createElement(
                      "table",
                      { className: styles.competition__top3_table },
                      createElement(
                        "thead",
                        null,
                        createElement(
                          "tr",
                          null,
                          createElement("th", null, "Rang"),
                          createElement("th", null, "Taille (cm)"),
                          createElement("th", null, "Points"),
                          createElement("th", null, "Équipe"),
                          createElement("th", null, "Pêché par"),
                          createElement("th", null, "Date")
                        )
                      ),
                      createElement(
                        "tbody",
                        null,
                        top3.map((catchItem, index) =>
                          createElement(
                            "tr",
                            { key: catchItem.id },
                            createElement("td", null, `#${index + 1}`),
                            createElement("td", null, catchItem.size),
                            createElement("td", null, `${catchItem.points} pts`),
                            createElement("td", null, `${catchItem.team.name}${catchItem.team.registrationNumber ? ` (N° ${catchItem.team.registrationNumber})` : ""}`),
                            createElement("td", null, catchItem.caughtBy ? `${catchItem.caughtBy.firstname} ${catchItem.caughtBy.lastname}` : "-"),
                            createElement("td", null, new Date(catchItem.createdAt).toLocaleDateString("fr-FR"))
                          )
                        )
                      )
                    )
                  );
                })
              )
            )
          )
        ),
        createElement(
          "div",
          { className: modalStyles.modal__actions },
          createElement(
            "div",
            { className: modalStyles.modal__buttons },
            createElement(
              Link,
              {
                href: `/competitions/${competition.id}`,
                className: `${modalStyles.modal__button} ${modalStyles["modal__button--secondary"]}`,
                style: { textDecoration: 'none', display: 'inline-block' }
              },
              "Voir la compétition"
            ),
            createElement(
              "button",
              {
                onClick: async () => {
                  try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_URL}/api/admin/competitions/${competition.id}/pdf`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });
                    
                    if (!response.ok) {
                      const errorText = await response.text();
                      let errorMessage = 'Erreur lors du téléchargement du PDF';
                      try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorJson.error || errorMessage;
                      } catch (e) {
                        errorMessage = errorText || errorMessage;
                      }
                      throw new Error(errorMessage);
                    }
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const filename = `classement_${competition.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast.success('PDF téléchargé avec succès.');
                  } catch (error) {
                    logger.error('Erreur téléchargement PDF:', error);
                    toast.error('Erreur lors du téléchargement du PDF: ' + (error.message || 'Erreur inconnue'));
                  }
                },
                className: `${modalStyles.modal__button} ${modalStyles["modal__button--secondary"]}`,
              },
              "📄 Télécharger PDF"
            ),
            createElement(
              "button",
              {
                onClick: () =>
                  router.push(`/dashboard/competitions/${competition.id}/edit`),
                className: `${modalStyles.modal__button} ${modalStyles["modal__button--primary"]}`,
              },
              "Modifier"
            ),
            createElement(
              "button",
              {
                onClick: handleDelete,
                className: `${modalStyles.modal__button} ${modalStyles["modal__button--danger"]}`,
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
        logger.error("Error saving species:", error);
      }
    };

    return createElement(
      "div",
      { className: modalStyles.modal__overlay },
      createElement(
        "div",
        { className: modalStyles.modal__content },
        createElement(
          "div",
          { className: styles.species_modal__header },
          createElement("h2", null, "Détails de l'espèce"),
          createElement(
            "button",
            { onClick: onClose, className: modalStyles.modal__close },
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
                className: `${styles.species_modal__button} ${modalStyles["modal__button--primary"]}`,
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
        logger.error("Error saving team:", error);
      }
    };

    return createElement(
      "div",
      { className: modalStyles.modal__overlay },
      createElement(
        "div",
        { className: modalStyles.modal__content },
        createElement(
          "div",
          { className: modalStyles.modal__header },
          createElement("h2", null, "Détails de l'équipe"),
          createElement(
            "button",
            { onClick: onClose, className: modalStyles.modal__close },
            "×"
          )
        ),
        createElement(
          "div",
          { className: modalStyles.modal__body },
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
          { className: modalStyles.modal__actions },
          createElement(
            "button",
            {
              onClick: handleSave,
              className: `${modalStyles.modal__button} ${modalStyles["modal__button--primary"]}`,
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
        return item.startDate ? formatCompetitionDateTime(item.startDate) : "";
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

  const penaltyEligibleTeams = useMemo(() => {
    const cid = parseInt(String(penaltyCompetitionId), 10);
    if (!penaltyCompetitionId || Number.isNaN(cid)) return [];
    return teams.filter((t) => {
      if (t.isPersonalJournal) return false;
      const tcid = t.competition?.id;
      if (tcid == null) return false;
      return Number(tcid) === cid;
    });
  }, [teams, penaltyCompetitionId]);

  const penaltyTeamsSearchResults = useMemo(() => {
    const q = normalizeForSearch(penaltyTeamSearch);
    if (!q) return penaltyEligibleTeams;
    return penaltyEligibleTeams.filter((t) => {
      if (normalizeForSearch(t.name).includes(q)) return true;
      for (const m of t.members || []) {
        if (normalizeForSearch(m.firstname).includes(q)) return true;
        if (normalizeForSearch(m.lastname).includes(q)) return true;
        if (normalizeForSearch(m.username).includes(q)) return true;
      }
      return false;
    });
  }, [penaltyEligibleTeams, penaltyTeamSearch]);

  const reloadPenaltyModalData = async (teamIdRaw) => {
    if (teamIdRaw === "" || teamIdRaw == null) {
      setPenaltyCatchOptions([]);
      setPenaltyList([]);
      setPenaltyTotal(0);
      return;
    }
    const tid = parseInt(String(teamIdRaw), 10);
    if (Number.isNaN(tid)) {
      return;
    }
    setPenaltyLoading(true);
    try {
      const [catchesRes, penRes] = await Promise.all([
        adminService.getTeamPenaltyEligibleCatches(tid),
        adminService.getTeamPenalties(tid),
      ]);
      if (catchesRes?.success && Array.isArray(catchesRes.catches)) {
        setPenaltyCatchOptions(
          catchesRes.catches.map((c) => ({
            id: c.id,
            speciesName: c.species?.name || "?",
            size: c.size,
            points: c.points,
            label: `#${c.id} — ${c.species?.name || "?"} — ${c.size} cm (${c.points} pts)`,
          }))
        );
      } else {
        setPenaltyCatchOptions([]);
      }
      if (penRes?.success) {
        setPenaltyList(penRes.penalties || []);
        setPenaltyTotal(penRes.totalPenaltyPoints ?? 0);
      }
    } catch (e) {
      toast.error(e.message || "Erreur chargement équipe / pénalités");
    } finally {
      setPenaltyLoading(false);
    }
  };

  const openPenaltyModal = () => {
    setPenaltyCompetitionId("");
    setPenaltyTeamSearch("");
    setPenaltyTeamId("");
    setPenaltyPoints("");
    setPenaltyReason("");
    setPenaltyFishCatchId("");
    setPenaltyCatchOptions([]);
    setPenaltyList([]);
    setPenaltyTotal(0);
    setPenaltyScope("global");
    setShowPenaltyModal(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className={classNames(layoutStyles.main, layoutStyles.dashboard_page)}>
      <div className={styles.dashboard__container}>
        <div className={styles.dashboard__header}>
          <div className={styles.dashboard__header_content}>
            <h1 className={styles.dashboard__title}>Tableau de bord</h1>
          </div>
        </div>
        <div className={styles.dashboard__search}>
          <div className={styles.dashboard__search_icon}>
            <FaSearch />
          </div>
          <input
            type="text"
            placeholder="Rechercher dans tous les tableaux..."
            className={styles.dashboard__search_input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div
          className={`${styles.dashboard__grid} ${
            searchTerm ? styles.searching : ""
          }`}
        >
          {/* Section Utilisateurs */}
          <div
            className={`${styles.dashboard__card} ${
              searchTerm && filteredData.users.length === 0
                ? styles["fade-out"]
                : ""
            }`}
            style={{
              display:
                searchTerm && filteredData.users.length === 0
                  ? "none"
                  : "block",
            }}
          >
            <h2 className={styles.dashboard__section_title}>Utilisateurs</h2>
            <div className={styles.dashboard__users_list}>
              {renderTable(
                searchTerm ? filteredData.users : users,
                TABLE_HEADERS.users,
                "users"
              )}
            </div>
          </div>

          {/* Section Compétitions */}
          <div
            className={`${styles.dashboard__card} ${
              searchTerm && filteredData.competitions.length === 0
                ? styles["fade-out"]
                : ""
            }`}
            style={{
              display:
                searchTerm && filteredData.competitions.length === 0
                  ? "none"
                  : "block",
            }}
          >
            <div className={styles.dashboard__section_header}>
              <h2 className={styles.dashboard__section_title}>Compétitions</h2>
              <button
                className={styles.dashboard__create_button}
                onClick={() => router.push("/dashboard/competitions/create")}
              >
                Créer une compétition
              </button>
            </div>
            <div className={styles.dashboard__users_list}>
              {renderTable(
                searchTerm ? filteredData.competitions : competitions,
                TABLE_HEADERS.competitions,
                "competitions"
              )}
            </div>
          </div>

          {/* Section Teams */}
          <div
            className={`${styles.dashboard__card} ${
              searchTerm && filteredData.teams.length === 0
                ? styles["fade-out"]
                : ""
            }`}
            style={{
              display:
                searchTerm && filteredData.teams.length === 0
                  ? "none"
                  : "block",
            }}
          >
            <h2 className={styles.dashboard__section_title}>Équipes</h2>
            <div className={styles.dashboard__users_list}>
              {renderTable(
                searchTerm ? filteredData.teams : teams,
                TABLE_HEADERS.teams,
                "teams"
              )}
            </div>
          </div>

          {/* Section Species */}
          <div
            className={`${styles.dashboard__card} ${
              searchTerm && filteredData.species.length === 0
                ? styles["fade-out"]
                : ""
            }`}
            style={{
              display:
                searchTerm && filteredData.species.length === 0
                  ? "none"
                  : "block",
            }}
          >
            <div className={styles.dashboard__section_header}>
              <h2 className={styles.dashboard__section_title}>Espèces</h2>
              <button
                className={styles.dashboard__create_button}
                onClick={() => router.push("/dashboard/species/create")}
              >
                Créer une espèce
              </button>
            </div>
            <div className={styles.dashboard__users_list}>
              {renderTable(
                searchTerm ? filteredData.species : species,
                TABLE_HEADERS.species,
                "species"
              )}
            </div>
          </div>

          {/* Section Prises en attente de validation */}
          <div className={styles.dashboard__card}>
            <div className={styles.dashboard__section_header}>
              <h2 className={styles.dashboard__section_title} style={{ flex: "1 1 auto" }}>
                Prises en attente de validation
                {pendingCatches.length > 0 && (
                  <span className={styles.dashboard__badge}>
                    {pendingCatches.length}
                  </span>
                )}
              </h2>
              <div className={styles.dashboard__section_actions}>
                <Link href="/catch/add" className={styles.dashboard__create_button}>
                  ➕ Ajouter une prise
                </Link>
                <button
                  type="button"
                  className={styles.dashboard__penalty_button}
                  onClick={openPenaltyModal}
                >
                  ⚖️ Pénalités
                </button>
              </div>
            </div>
            {pendingCatches.length === 0 ? (
              <div className={styles.dashboard__empty_state}>
                <p>Aucune prise en attente de validation</p>
              </div>
            ) : (
              <div>
                <div className={styles.dashboard__catches_list}>
                  {pendingCatches.map((catchItem) => (
                    <div key={catchItem.id} className={styles.dashboard__catch_card}>
                      <div className={styles.dashboard__catch_header}>
                        <div>
                          <h3>{catchItem.species.name}</h3>
                          <p className={styles.dashboard__catch_info}>
                            {catchItem.size} cm - {catchItem.points} pts
                          </p>
                          <p className={styles.dashboard__catch_info}>
                            Équipe: <strong>{catchItem.team.name}</strong>
                            {catchItem.competition && (
                              <> - {catchItem.competition.name}</>
                            )}
                          </p>
                          {catchItem.caughtBy && (
                            <p className={styles.dashboard__catch_info}>
                              Pêché par: {catchItem.caughtBy.firstname} {catchItem.caughtBy.lastname}
                            </p>
                          )}
                          <p className={styles.dashboard__catch_date}>
                            {new Date(catchItem.createdAt).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        {catchItem.photoUrl && (
                          <div 
                            className={styles.dashboard__catch_photo}
                            onClick={() => {
                              setSelectedImage(resolvePhotoUri(catchItem.photoUrl) ?? catchItem.photoUrl);
                              setShowImageModal(true);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <img
                              src={resolvePhotoUri(catchItem.photoUrl) ?? ""}
                              alt={`${catchItem.species.name} de ${catchItem.size}cm`}
                              style={{
                                maxWidth: "150px",
                                maxHeight: "150px",
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {catchItem.comment && (
                        <div className={styles.dashboard__catch_comment}>
                          <strong>Commentaire:</strong> {catchItem.comment}
                        </div>
                      )}
                      <div className={styles.dashboard__catch_actions}>
                        <button
                          className={`${styles.dashboard__button} ${styles["dashboard__button--validate"]}`}
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              await adminService.validateCatch(catchItem.id);
                              toast.success("Prise validée avec succès.");
                              fetchData();
                            } catch (error) {
                              toast.error(error.message || "Erreur lors de la validation");
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing}
                        >
                          <FaCheckCircle /> Valider
                        </button>
                        <button
                          className={`${styles.dashboard__button} ${styles["dashboard__button--reject"]}`}
                          onClick={() => {
                            setSelectedCatch(catchItem);
                            setShowCatchModal(true);
                          }}
                          disabled={isProcessing}
                        >
                          <FaTimesCircle /> Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingCatchesPage < pendingCatchesPages && (
                  <div className={styles.dashboard__load_more}>
                    <button
                      type="button"
                      className={styles.dashboard__load_more_button}
                      onClick={loadMorePendingCatches}
                      disabled={isProcessing}
                    >
                      Charger plus de prises ({pendingCatches.length}/{pendingCatchesTotal})
                    </button>
                  </div>
                )}
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                    Debug: Page {pendingCatchesPage} / {pendingCatchesPages} | Total: {pendingCatchesTotal} | Affichées: {pendingCatches.length}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ajout des modals */}
        {showUserModal && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setShowUserModal(false)}
            onDelete={handleDeleteUser}
            onUpdate={(user) => {
              // Gérer la mise à jour
              router.push(`/dashboard/users/${user.id}/edit`);
            }}
          />
        )}

        {showCompetitionModal && (
          <CompetitionDetailsModal
            competition={selectedCompetition}
            onClose={() => setShowCompetitionModal(false)}
          />
        )}

        {showSpeciesModal && (
          <SpeciesDetailsModal
            species={selectedSpecies}
            onClose={() => setShowSpeciesModal(false)}
          />
        )}

        {showTeamModal && (
          <TeamDetailsModal
            team={selectedTeam}
            onClose={() => setShowTeamModal(false)}
          />
        )}

        {showRoleModal && userToModify && (
          <div className={modalStyles.modal__overlay}>
            <div className={modalStyles.modal__content}>
              <h3 className={modalStyles.modal__title}>
                Modifier le rôle de {userToModify.firstname}{" "}
                {userToModify.lastname}
              </h3>
              <p className={modalStyles.modal__text}>
                Êtes-vous sûr de vouloir{" "}
                {userToModify.roles?.includes("ROLE_ADMIN")
                  ? "retirer"
                  : "ajouter"}{" "}
                les droits administrateur ?
              </p>
              <div className={modalStyles.modal__actions}>
                <button
                  className={`${modalStyles.modal__button} ${modalStyles["modal__button--confirm"]}`}
                  onClick={confirmRoleChange}
                >
                  Confirmer
                </button>
                <button
                  className={`${modalStyles.modal__button} ${modalStyles["modal__button--cancel"]}`}
                  onClick={() => setShowRoleModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pénalités équipe */}
        {showPenaltyModal && (
          <div className={modalStyles.modal__overlay}>
            <div className={`${modalStyles.modal__content} ${styles.dashboard__penalty_modal_content}`}>
              <h3 className={modalStyles.modal__title}>Pénalités (retirer des points au score)</h3>
              <p className={modalStyles.modal__text}>
                Choisissez la compétition, puis retrouvez l&apos;équipe (nom, prénom, nom ou pseudo d&apos;un membre).
                Définissez si la retenue affecte tout le score ou une prise précise pour le suivi.
              </p>
              <div className={modalStyles.modal__form_group}>
                <label htmlFor="penaltyCompetitionSelect">Compétition *</label>
                <select
                  id="penaltyCompetitionSelect"
                  style={{ width: "100%", padding: "8px", borderRadius: 8 }}
                  value={penaltyCompetitionId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPenaltyCompetitionId(v);
                    setPenaltyTeamId("");
                    setPenaltyTeamSearch("");
                    setPenaltyFishCatchId("");
                    setPenaltyCatchOptions([]);
                    setPenaltyList([]);
                    setPenaltyTotal(0);
                  }}
                >
                  <option value="">Choisir une compétition…</option>
                  {(competitions || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {penaltyCompetitionId ? (
                <>
                  <div className={modalStyles.modal__form_group}>
                    <label htmlFor="penaltyTeamSearchField">Rechercher une équipe</label>
                    <input
                      id="penaltyTeamSearchField"
                      type="search"
                      value={penaltyTeamSearch}
                      onChange={(e) => setPenaltyTeamSearch(e.target.value)}
                      placeholder="Nom d'équipe, prénom, nom ou pseudo…"
                      style={{ width: "100%", padding: "8px", borderRadius: 8, boxSizing: "border-box" }}
                    />
                    <p style={{ fontSize: 13, opacity: 0.75, marginTop: 6, marginBottom: 0 }}>
                      {penaltyTeamsSearchResults.length} équipe
                      {penaltyTeamsSearchResults.length > 1 ? "s" : ""} dans cette compétition
                      {penaltyTeamSearch.trim() ? " (filtrées)" : ""}.
                    </p>
                  </div>
                  <div className={modalStyles.modal__form_group}>
                    <span style={{ display: "block", marginBottom: 8 }}>Équipe *</span>
                    <div className={styles.dashboard__penalty_team_list}>
                      {penaltyTeamsSearchResults.length === 0 ? (
                        <p className={styles.dashboard__penalty_empty_hint}>
                          Aucune équipe ne correspond à la recherche.
                        </p>
                      ) : (
                        penaltyTeamsSearchResults.map((t) => {
                          const memberLine = (t.members || [])
                            .slice(0, 4)
                            .map((m) =>
                              [m.firstname, m.lastname].filter(Boolean).join(" ").trim() ||
                              m.username ||
                              ""
                            )
                            .filter(Boolean)
                            .join(" · ");
                          const selected =
                            penaltyTeamId !== "" && String(penaltyTeamId) === String(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={classNames(styles.dashboard__penalty_team_row, {
                                [styles["dashboard__penalty_team_row--selected"]]: selected,
                              })}
                              onClick={() => {
                                setPenaltyTeamId(String(t.id));
                                setPenaltyFishCatchId("");
                                reloadPenaltyModalData(t.id);
                              }}
                            >
                              <span className={styles.dashboard__penalty_team_row_name}>{t.name}</span>
                              {memberLine ? (
                                <span className={styles.dashboard__penalty_team_row_members}>
                                  {memberLine}
                                </span>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className={styles.dashboard__penalty_empty_hint}>
                  Sélectionnez d&apos;abord une compétition pour afficher les équipes.
                </p>
              )}

              <div className={modalStyles.modal__form_group}>
                <span style={{ display: "block", marginBottom: 8 }}>Portée</span>
                <label style={{ marginRight: 16 }}>
                  <input
                    type="radio"
                    name="penScope"
                    checked={penaltyScope === "global"}
                    onChange={() => setPenaltyScope("global")}
                  />{" "}
                  Globale sur le score
                </label>
                <label>
                  <input
                    type="radio"
                    name="penScope"
                    checked={penaltyScope === "catch"}
                    onChange={() => setPenaltyScope("catch")}
                  />{" "}
                  Associée à une prise (référence)
                </label>
              </div>

              {penaltyScope === "catch" && penaltyTeamId && (
                <div className={modalStyles.modal__form_group}>
                  <span style={{ display: "block", marginBottom: 8 }}>Prise *</span>
                  {penaltyLoading ? (
                    <p className={styles.dashboard__penalty_empty_hint}>Chargement des prises…</p>
                  ) : penaltyCatchOptions.length === 0 ? (
                    <p className={styles.dashboard__penalty_empty_hint}>
                      Aucune prise validable pour cette équipe (prises rejetées exclues).
                    </p>
                  ) : (
                    <div className={styles.dashboard__penalty_catch_list}>
                      {penaltyCatchOptions.map((opt) => {
                        const sel = String(penaltyFishCatchId) === String(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={classNames(styles.dashboard__penalty_catch_row, {
                              [styles["dashboard__penalty_catch_row--selected"]]: sel,
                            })}
                            onClick={() => setPenaltyFishCatchId(String(opt.id))}
                          >
                            <span className={styles.dashboard__penalty_catch_row_id}>#{opt.id}</span>
                            <span className={styles.dashboard__penalty_catch_row_species}>
                              {opt.speciesName}
                            </span>
                            <span className={styles.dashboard__penalty_catch_row_meta}>
                              {opt.size} cm · {opt.points} pts
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className={modalStyles.modal__form_group}>
                <label htmlFor="penaltyPoints">Points à retirer *</label>
                <input
                  id="penaltyPoints"
                  type="number"
                  min={1}
                  step={1}
                  value={penaltyPoints}
                  onChange={(e) =>
                    setPenaltyPoints(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="Ex. 50"
                  style={{ width: "100%", padding: "8px", borderRadius: 8 }}
                />
              </div>
              <div className={modalStyles.modal__form_group}>
                <label htmlFor="penaltyReason">Motif (optionnel)</label>
                <textarea
                  id="penaltyReason"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="Motif..."
                  rows={2}
                  className={modalStyles.modal__textarea}
                />
              </div>

              {penaltyTeamId ? (
                <div style={{ marginBottom: 16 }}>
                  <strong>Pénalités enregistrées :</strong> {penaltyLoading ? " …" : `−${penaltyTotal} pts cumulés`}
                  {!penaltyLoading && penaltyList.length > 0 && (
                    <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                      {penaltyList.map((p) => (
                        <li key={p.id} style={{ marginBottom: 6 }}>
                          <span>
                            −{p.points} pts
                            {p.speciesName ? ` (${p.speciesName}${p.fishCatchId ? ` #${p.fishCatchId}` : ""})` : ""}
                            {p.reason ? ` — ${p.reason}` : ""}{" "}
                          </span>
                          <button
                            type="button"
                            style={{ marginLeft: 8, fontSize: 12, cursor: "pointer" }}
                            onClick={async () => {
                              if (!window.confirm("Supprimer cette pénalité ?")) return;
                              try {
                                await adminService.deleteTeamPenalty(
                                  parseInt(penaltyTeamId, 10),
                                  p.id
                                );
                                toast.success("Pénalité supprimée.");
                                reloadPenaltyModalData(penaltyTeamId);
                              } catch (err) {
                                toast.error(err.message || "Erreur suppression");
                              }
                            }}
                          >
                            Supprimer
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!penaltyLoading && penaltyList.length === 0 && (
                    <p style={{ fontSize: 14, opacity: 0.8 }}>Aucune pénalité.</p>
                  )}
                </div>
              ) : null}

              <div className={modalStyles.modal__actions}>
                <button
                  type="button"
                  className={`${modalStyles.modal__button} ${modalStyles["modal__button--confirm"]}`}
                  disabled={
                    penaltySubmitBusy ||
                    !penaltyTeamId ||
                    !penaltyPoints ||
                    parseInt(penaltyPoints, 10) < 1 ||
                    (penaltyScope === "catch" && !penaltyFishCatchId)
                  }
                  onClick={async () => {
                    const pid = parseInt(penaltyPoints, 10);
                    if (Number.isNaN(pid) || pid < 1) {
                      toast.error("Points invalides.");
                      return;
                    }
                    setPenaltySubmitBusy(true);
                    try {
                      await adminService.addTeamPenalty(parseInt(penaltyTeamId, 10), {
                        points: pid,
                        reason: penaltyReason.trim() || undefined,
                        fishCatchId:
                          penaltyScope === "catch"
                            ? parseInt(penaltyFishCatchId, 10)
                            : undefined,
                      });
                      toast.success("Pénalité enregistrée.");
                      setPenaltyPoints("");
                      setPenaltyReason("");
                      setPenaltyFishCatchId("");
                      reloadPenaltyModalData(penaltyTeamId);
                      fetchData();
                    } catch (err) {
                      toast.error(err.message || "Erreur lors de l'enregistrement");
                    } finally {
                      setPenaltySubmitBusy(false);
                    }
                  }}
                >
                  {penaltySubmitBusy ? "Enregistrement…" : "Enregistrer la pénalité"}
                </button>
                <button
                  type="button"
                  className={`${modalStyles.modal__button} ${modalStyles["modal__button--cancel"]}`}
                  onClick={() => setShowPenaltyModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de rejet de prise */}
        {showCatchModal && selectedCatch && (
          <div className={modalStyles.modal__overlay}>
            <div className={modalStyles.modal__content}>
              <h3 className={modalStyles.modal__title}>Rejeter la prise</h3>
              <p className={modalStyles.modal__text}>
                <strong>{selectedCatch.species.name}</strong> de {selectedCatch.size} cm
                <br />
                Équipe: {selectedCatch.team.name}
              </p>
              <div className={modalStyles.modal__form_group}>
                <label htmlFor="rejectionReason">
                  Motif du rejet <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi cette prise est rejetée..."
                  rows={4}
                  className={modalStyles.modal__textarea}
                  required
                />
              </div>
              <div className={modalStyles.modal__actions}>
                <button
                  className={`${modalStyles.modal__button} ${modalStyles["modal__button--confirm"]}`}
                  onClick={async () => {
                    if (!rejectionReason.trim()) {
                      toast.error("Veuillez indiquer un motif de rejet");
                      return;
                    }
                    setIsProcessing(true);
                    try {
                      await adminService.rejectCatch(selectedCatch.id, rejectionReason);
                      toast.success("Prise rejetée avec succès.");
                      setShowCatchModal(false);
                      setSelectedCatch(null);
                      setRejectionReason("");
                      fetchData();
                    } catch (error) {
                      toast.error(error.message || "Erreur lors du rejet");
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing || !rejectionReason.trim()}
                >
                  {isProcessing ? "Traitement..." : "Rejeter"}
                </button>
                <button
                  className={`${modalStyles.modal__button} ${modalStyles["modal__button--cancel"]}`}
                  onClick={() => {
                    setShowCatchModal(false);
                    setSelectedCatch(null);
                    setRejectionReason("");
                  }}
                  disabled={isProcessing}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'image pour agrandir la photo */}
        {showImageModal && selectedImage && (
          <div 
            className={styles.dashboard__image_modal_overlay}
            onClick={() => {
              setShowImageModal(false);
              setSelectedImage(null);
            }}
          >
            <div 
              className={styles.dashboard__image_modal_content}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.dashboard__image_modal_close}
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                }}
                aria-label="Fermer"
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="Photo de la prise en grand format"
                className={styles.dashboard__image_modal_img}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}

// Composant utilitaire pour les statistiques
function StatItem({ value, label }) {
  return (
    <div className={styles.dashboard__stat}>
      <div className={styles.dashboard__stat_value}>{value}</div>
      <div className={styles.dashboard__stat_label}>{label}</div>
    </div>
  );
}
