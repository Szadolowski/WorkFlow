export type UserRole =
  | "ADMIN"
  | "HR"
  | "OFFICE"
  | "FOREMAN"
  | "ACCOUNTING"
  | "WORKER";

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  pesel: string;
  email: string;
};

export type UpdateEmployeeAccessPayload = {
  role: UserRole;
  temporaryPassword: string;
};

export type EmployeeListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  pesel: string | null;
  role: UserRole;
  isActive: boolean;
  isLoginEnabled: boolean;
};

export type EmployeesListResponse = {
  data: EmployeeListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type EmployeeResponse = {
  id: string;
  firstName: string;
  lastName: string;
  pesel: string | null;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  isLoginEnabled: boolean;
  createdAt: string;
};

export type EmployeeSingleResponse = {
  data: EmployeeResponse;
};

export type UpdateEmployeePayload = {
  firstName?: string;
  lastName?: string;
  pesel?: string;
  email?: string;
  rfidCardId?: string;
};
