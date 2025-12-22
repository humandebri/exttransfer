"use client";

// components/ext-transfer/canister-store.tsx: Shared canister state with persistence for sidebar/workspace.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  CANISTERS,
  type CanisterEntry,
} from "@/components/ext-transfer/transfer-data";

const STORAGE_KEY = "exttransfer:canisters";

type CanisterContextValue = {
  canisters: CanisterEntry[];
  selectedCanisterId: string | null;
  selectedCanister: CanisterEntry | null;
  addCanister: (entry: CanisterEntry) => void;
  updateCanister: (id: string, updates: Partial<CanisterEntry>) => void;
  removeCanister: (id: string) => void;
  setSelectedCanisterId: (id: string | null) => void;
};

const CanisterContext = createContext<CanisterContextValue | undefined>(
  undefined
);

function parseStoredCanisters(value: string | null): CanisterEntry[] {
  if (!value) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const entries: CanisterEntry[] = [];
  for (const item of parsed) {
    if (!isRecord(item)) {
      continue;
    }
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id) {
      continue;
    }
    const name =
      typeof item.name === "string" && item.name.trim()
        ? item.name.trim()
        : "Custom Collection";
    const status =
      typeof item.status === "string" && item.status.trim()
        ? item.status.trim()
        : "Active";
    entries.push({ id, name, status });
  }
  return entries;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function CanisterProvider({ children }: { children: ReactNode }) {
  const [canisters, setCanisters] = useState<CanisterEntry[]>(() => CANISTERS);
  const [selectedCanisterId, setSelectedCanisterId] = useState<string | null>(
    CANISTERS[0]?.id ?? null
  );

  useEffect(() => {
    const stored = parseStoredCanisters(
      typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY)
    );
    if (stored.length > 0) {
      setCanisters(stored);
      setSelectedCanisterId((prev) => prev ?? stored[0]?.id ?? null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(canisters));
  }, [canisters]);

  const addCanister = useCallback((entry: CanisterEntry) => {
    setCanisters((prev) => [entry, ...prev]);
  }, []);

  const updateCanister = useCallback(
    (id: string, updates: Partial<CanisterEntry>) => {
      setCanisters((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates, id: item.id } : item
        )
      );
    },
    []
  );

  const removeCanister = useCallback((id: string) => {
    setCanisters((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (!selectedCanisterId) {
      if (canisters.length > 0) {
        setSelectedCanisterId(canisters[0]?.id ?? null);
      }
      return;
    }
    const exists = canisters.some((item) => item.id === selectedCanisterId);
    if (!exists) {
      setSelectedCanisterId(canisters[0]?.id ?? null);
    }
  }, [canisters, selectedCanisterId]);

  const selectedCanister = useMemo(() => {
    if (!selectedCanisterId) {
      return null;
    }
    return canisters.find((item) => item.id === selectedCanisterId) ?? null;
  }, [canisters, selectedCanisterId]);

  const value = useMemo(
    () => ({
      canisters,
      selectedCanisterId,
      selectedCanister,
      addCanister,
      updateCanister,
      removeCanister,
      setSelectedCanisterId,
    }),
    [
      canisters,
      selectedCanisterId,
      selectedCanister,
      addCanister,
      updateCanister,
      removeCanister,
      setSelectedCanisterId,
    ]
  );

  return (
    <CanisterContext.Provider value={value}>
      {children}
    </CanisterContext.Provider>
  );
}

export function useCanisters() {
  const ctx = useContext(CanisterContext);
  if (!ctx) {
    throw new Error("useCanisters must be used within CanisterProvider");
  }
  return ctx;
}
