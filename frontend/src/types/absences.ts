export type AbsenceType = "HOLIDAY" | "SICK_LEAVE" | "UNEXCUSED" | "SPECIAL";

export type EmployeeAbsence = {
  id: string;
  employeeId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  documentId: string | null;
  isApproved: boolean;
  createdAt: string;
  document: {
    id: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  } | null;
};

export type EmployeeAbsencesResponse = {
  data: EmployeeAbsence[];
};

export type EmployeeAbsenceSingleResponse = {
  data: EmployeeAbsence;
};

export type CreateAbsencePayload = {
  type: AbsenceType;
  startDate: string;
  endDate: string;
  documentId?: string;
  isApproved?: boolean;
};

export type UpdateAbsenceApprovalPayload = {
  isApproved: boolean;
};
