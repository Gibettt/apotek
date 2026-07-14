import type { RoleName } from "./auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormValues {
  name: string;
  email: string;
  role: RoleName;
  status: boolean;
}
