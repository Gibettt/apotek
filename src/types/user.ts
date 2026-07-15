import type { RoleName } from "./auth";

export interface User {
  id: string;
  authUserId?: string;
  namaLengkap: string;
  username?: string;
  email?: string;
  telepon?: string;
  role: RoleName;
  roleId?: string;
  status: boolean;
  cabangIds: string[];
  defaultCabangId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormValues {
  namaLengkap: string;
  username?: string;
  email: string;
  telepon?: string;
  role: RoleName;
  status: boolean;
  cabangIds: string[];
}
