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
