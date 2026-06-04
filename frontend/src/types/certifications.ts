export type CertificationType = "BHP" | "MEDICAL" | "UDT" | "OTHER";

export type CertificationDictionaryItem = {
  id: string;
  type: CertificationType;
  name: string;
  description: string | null;
  defaultValidityMonths: number | null;
  isActive: boolean;
  createdAt: string;
};

export type EmployeeCertification = {
  id: string;
  employeeId: string;
  dictionaryId: string;
  certificateNumber: string | null;
  issuedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string | null;
  dictionary: CertificationDictionaryItem;
  documents: {
    id: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }[];
};

export type CertificationDictionaryResponse = {
  data: CertificationDictionaryItem[];
};

export type EmployeeCertificationsResponse = {
  data: EmployeeCertification[];
};

export type EmployeeCertificationSingleResponse = {
  data: EmployeeCertification;
};

export type CreateEmployeeCertificationPayload = {
  dictionaryId: string;
  certificateNumber?: string;
  issuedAt: string;
  expiresAt: string;
  documentIds?: string[];
};

export type CreateCertificationDictionaryPayload = {
  type: CertificationType;
  name: string;
  description?: string;
  defaultValidityMonths?: number;
};

export type UpdateCertificationDictionaryPayload =
  Partial<CreateCertificationDictionaryPayload> & {
    isActive?: boolean;
  };

export type CertificationDictionarySingleResponse = {
  data: CertificationDictionaryItem;
};

export type ExpiringCertificationItem = {
  id: string;
  employeeId: string;
  dictionaryId: string;
  certificateNumber: string | null;
  issuedAt: string;
  expiresAt: string;
  daysToExpiry: number;
  dictionary: CertificationDictionaryItem;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    role: string;
    facility: {
      id: string;
      name: string;
      code: string | null;
    };
  };
  documents: {
    id: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }[];
};

export type ExpiringCertificationsResponse = {
  data: ExpiringCertificationItem[];
  meta: {
    facilityId: string;
    days: number;
    from: string;
    to: string;
    total: number;
  };
};
