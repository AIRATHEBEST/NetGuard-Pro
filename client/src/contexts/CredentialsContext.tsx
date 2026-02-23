import { createContext, useContext, ReactNode, useEffect, useState } from "react";

interface Credentials {
  supabaseUrl: string;
  supabaseKey: string;
  databaseUrl: string;
  jwtSecret: string;
}

interface CredentialsContextType {
  credentials: Credentials | null;
  isSetup: boolean;
  setCredentials: (creds: Credentials) => void;
  clearCredentials: () => void;
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentialsState] = useState<Credentials | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    // Load credentials from localStorage on mount
    const stored = localStorage.getItem("netguardpro_credentials");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCredentialsState(parsed);
        setIsSetup(true);
      } catch (err) {
        console.error("Failed to parse credentials:", err);
      }
    }
  }, []);

  const setCredentials = (creds: Credentials) => {
    setCredentialsState(creds);
    localStorage.setItem("netguardpro_credentials", JSON.stringify(creds));
    setIsSetup(true);
  };

  const clearCredentials = () => {
    setCredentialsState(null);
    localStorage.removeItem("netguardpro_credentials");
    setIsSetup(false);
  };

  return (
    <CredentialsContext.Provider value={{ credentials, isSetup, setCredentials, clearCredentials }}>
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const context = useContext(CredentialsContext);
  if (context === undefined) {
    throw new Error("useCredentials must be used within CredentialsProvider");
  }
  return context;
}
