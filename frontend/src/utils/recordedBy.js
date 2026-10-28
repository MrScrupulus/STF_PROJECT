export function recordedByLine(recordedBy) {
  if (!recordedBy) {
    return null;
  }
  const name = `${recordedBy.firstname || ""} ${recordedBy.lastname || ""}`.trim();
  if (!name) {
    return null;
  }
  const role = recordedBy.roleLabel || recordedBy.role;
  return role ? `Ajoutée par ${name} (${role})` : `Ajoutée par ${name}`;
}
