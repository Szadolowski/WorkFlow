export type ContractType = "UOP" | "UZ" | "UD" | "B2B";

export type EmployeeContract = {
  id: string;
  employeeId: string;
  type: ContractType;
  salaryAmount: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type EmployeeContractsResponse = {
  data: EmployeeContract[];
};

export type EmployeeContractSingleResponse = {
  data: EmployeeContract;
};

export type CreateEmployeeContractPayload = {
  type: ContractType;
  salaryAmount: number;
  startDate: string;
  endDate?: string;
};
