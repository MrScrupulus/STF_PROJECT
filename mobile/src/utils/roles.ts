export function isPlatformAdmin(roles: string[] | undefined | null): boolean {
  return (roles || []).includes('ROLE_ADMIN');
}

export function canOrganizeEvents(roles: string[] | undefined | null): boolean {
  const list = roles || [];
  return list.includes('ROLE_ADMIN') || list.includes('ROLE_ORGANIZER');
}
