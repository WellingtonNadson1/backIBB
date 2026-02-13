// src/contexts/RoleContext.tsx
const ROLE_DISPLAY_NAMES = {
  USER_CENTRAL: "Central",
  USER_SUPERVISOR: "Supervisor",
  USER_LIDER: "Líder",
};

function getRoleHomePath(role: string): string {
  switch (role) {
    case "USER_CENTRAL":
      return "/(central)/dashboard";
    case "USER_SUPERVISOR":
      return "/(supervisor)/(home)";
    case "USER_LIDER":
      return "/(celula)/(home)";
    default:
      return "/";
  }
}
