"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type FacilityOption = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
};

type FacilityContextValue = {
  facilities: FacilityOption[];
  activeFacilityId: string;
  activeFacility: FacilityOption | null;
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
}: {
  children: React.ReactNode;
  facilities: FacilityOption[];
  initialActiveFacilityId: string;
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
      setActiveFacilityId: (facilityId: string) => {
        writeActiveFacilityCookie(facilityId);
        setActiveFacilityIdState(facilityId);
      },
    };

    return v;
  }, [activeFacilityId, facilities]);

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
