export type RoleName = "owner" | "admin" | "apoteker" | "kasir";

export interface Role {
  id: string;
  kode: RoleName;
  nama: string;
  deskripsi?: string;
}

export interface AuthUser {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  role: RoleName;
  status: boolean;
  cabangIds: string[];
  activeCabangId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}
