export type UserRole =
  | "PLATFORM_ADMIN"
  | "ADMIN"
  | "DRIVER"
  | "USER"
  | "COORDINATOR";

export const roleLabels: Record<UserRole, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  ADMIN: "Administrador",
  DRIVER: "Motorista",
  USER: "Aluno",
  COORDINATOR: "Coordenador",
};

export function hasRole(
  role: string | undefined,
  allowedRoles: UserRole[],
): role is UserRole {
  return !!role && allowedRoles.includes(role as UserRole);
}
