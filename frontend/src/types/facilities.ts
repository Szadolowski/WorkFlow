export type FacilityListItem = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  _count: {
    employees: number;
    projects: number;
    readers: number;
    accessUsers: number;
  };
};

export type FacilitiesResponse = {
  data: FacilityListItem[];
};

export type FacilitySingleResponse = {
  data: FacilityListItem;
};

export type CreateFacilityPayload = {
  name: string;
  code?: string;
  address?: string;
};

export type UpdateFacilityPayload = Partial<CreateFacilityPayload> & {
  isActive?: boolean;
};

export type FacilityEmployeeAccessItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  primaryFacility: {
    id: string;
    name: string;
    code: string | null;
  };
  isPrimaryFacility: boolean;
  hasAdditionalAccess: boolean;
  isAssigned: boolean;
};

export type FacilityEmployeesResponse = {
  data: {
    facility: {
      id: string;
      name: string;
      code: string | null;
      address: string | null;
      isActive: boolean;
    };
    employees: FacilityEmployeeAccessItem[];
  };
};

export type UpdateFacilityEmployeesPayload = {
  employeeIds: string[];
};
