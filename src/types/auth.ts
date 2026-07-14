export type RoleName = "owner" | "admin" | "apoteker" | "kasir";

export interface Role {
  id: number;
  name: RoleName;
  label: string;
  description: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}
