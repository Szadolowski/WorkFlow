export type TimeEntryStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PendingTimeEntry = {
  id: string;
  startTime: string;
  endTime: string;
  calculatedHours: string;
  status: TimeEntryStatus;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  project: {
    id: string;
    name: string;
    facilityId: string;
  };
};

export type PendingTimeEntriesResponse = {
  data: PendingTimeEntry[];
};

export type UpdateTimeEntryStatusPayload = {
  status: "APPROVED" | "REJECTED";
};

export type TimeEntrySingleResponse = {
  data: PendingTimeEntry;
};
