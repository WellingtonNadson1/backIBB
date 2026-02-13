// src/utils/roleMapper.ts (Backend)
export const ROLE_MAP = {
  // Web → Banco
  USER_CENTRAL: "USERCENTRAL",
  USER_SUPERVISOR_AREA: "USERSUPERVISOR",
  USER_SUPERVISOR_SETOR: "USERSUPERVISOR",
  USER_LIDER: "USERLIDER",
};

export const ROLE_MAP_TO_MOBILE = {
  USER_CENTRAL: "USER_CENTRAL",
  USER_SUPERVISOR_AREA: "USER_SUPERVISOR",
  USER_SUPERVISOR_SETOR: "USER_SUPERVISOR",
  USER_SUPERVISOR_DISTRITO: "USER_SUPERVISOR",
  USER_LIDER: "USER_LIDER",
  USER_FINANCEIRO: "USER_FINANCEIRO", // Fora do MVP
  ADMIN: "ADMIN", // Fora do MVP
} as const;

export function normalizeMobileRoles(dbRoles: string[]): string[] {
  //@ts-ignore
  return dbRoles.map((r) => ROLE_MAP_TO_MOBILE[r] || r);
}
