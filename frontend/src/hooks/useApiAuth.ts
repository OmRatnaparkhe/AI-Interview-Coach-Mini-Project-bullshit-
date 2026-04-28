import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setClerkTokenGetter } from "../api/client";

export function useApiAuth() {
  const { getToken } = useAuth();
  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);
}

