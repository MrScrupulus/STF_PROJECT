export type RecordedByInfo = {
  firstname?: string | null;
  lastname?: string | null;
  role?: string | null;
  roleLabel?: string | null;
} | null | undefined;

export function recordedByLine(recordedBy: RecordedByInfo): string | null {
  if (!recordedBy) {
    return null;
  }
  const name = `${recordedBy.firstname || ''} ${recordedBy.lastname || ''}`.trim();
  if (!name) {
    return null;
  }
  const role = recordedBy.roleLabel || recordedBy.role;
  return role ? `Ajoutée par ${name} (${role})` : `Ajoutée par ${name}`;
}
