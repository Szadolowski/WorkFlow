"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type FacilityOption = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
};

export type CurrentUser = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
};

type FacilityContextValue = {
  facilities: FacilityOption[];
  activeFacilityId: string;
  activeFacility: FacilityOption | null;
  currentUser: CurrentUser;
  setActiveFacilityId: (facilityId: string) => void;
};

const FacilityContext = createContext<FacilityContextValue | null>(null);
const ACTIVE_FACILITY_COOKIE = "active_facility_id";

function writeActiveFacilityCookie(facilityId: string) {
  document.cookie = `${ACTIVE_FACILITY_COOKIE}=${facilityId}; path=/; max-age=31536000; samesite=lax`;
}

export default function FacilityProvider({
  children,
  facilities,
  initialActiveFacilityId,
  currentUser,
}: {
  children: React.ReactNode;
  facilities: FacilityOption[];
  initialActiveFacilityId: string;
  currentUser: CurrentUser;
}) {
  const [activeFacilityId, setActiveFacilityIdState] = useState(
    initialActiveFacilityId,
  );

  useEffect(() => {
    if (activeFacilityId) {
      writeActiveFacilityCookie(activeFacilityId);
    }
  }, [activeFacilityId]);

  const value = useMemo(() => {
    const activeFacility =
      facilities.find((facility) => facility.id === activeFacilityId) ?? null;

    const v: FacilityContextValue = {
      facilities,
      activeFacilityId,
      activeFacility,
      currentUser,
      setActiveFacilityId: (facilityId: string) => {
        writeActiveFacilityCookie(facilityId);
        setActiveFacilityIdState(facilityId);
      },
    };

    return v;
  }, [activeFacilityId, facilities, currentUser]);

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
}

export function useFacility() {
  const context = useContext(FacilityContext);

  if (!context) {
    throw new Error("useFacility must be used within FacilityProvider");
  }

  return context;
}
