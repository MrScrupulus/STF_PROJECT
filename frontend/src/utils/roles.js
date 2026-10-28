export const APP_ROLES = [
  { id: "ROLE_COMMISSAIRE", label: "Commissaire", css: "commissaire" },
  { id: "ROLE_ORGANIZER", label: "Créateur", css: "organizer" },
  { id: "ROLE_SCIENCE", label: "Sciences+", css: "science" },
  { id: "ROLE_ADMIN", label: "Admin", css: "admin" },
];

const LABELS = Object.fromEntries(APP_ROLES.map((r) => [r.id, r.label]));

export function visibleRoles(roles = []) {
  return APP_ROLES.filter((role) => roles.includes(role.id));
}

export function formatRoleLabels(roles = []) {
  const labels = visibleRoles(roles).map((role) => role.label);
  return labels.length ? labels.join(", ") : "Utilisateur";
}

export function roleSearchHaystack(roles = []) {
  return [...(roles || []), formatRoleLabels(roles)].join(" ").toLowerCase();
}

export function isPlatformAdmin(roles = []) {
  return (roles || []).includes("ROLE_ADMIN");
}

export function canOrganizeEvents(roles = []) {
  const list = roles || [];
  return list.includes("ROLE_ADMIN") || list.includes("ROLE_ORGANIZER");
}

export { LABELS as ROLE_LABELS };
