import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface Company {
  id: number;
  name: string;
  slug: string;
  gstin?: string | null;
  industry?: string | null;
}

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompanyId: (id: number) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  activeCompany: null,
  setActiveCompanyId: () => {},
  isLoading: true,
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<number | null>(() => {
    const stored = localStorage.getItem("kukbook_active_company");
    return stored ? parseInt(stored, 10) : null;
  });

  const { data: companiesData, isLoading } = trpc.company.list.useQuery();

  const companies = companiesData ?? [];
  const activeCompany = companies.find((c: Company) => c.id === activeId) ?? companies[0] ?? null;

  useEffect(() => {
    if (activeCompany && activeCompany.id !== activeId) {
      setActiveId(activeCompany.id);
      localStorage.setItem("kukbook_active_company", String(activeCompany.id));
    }
  }, [activeCompany, activeId]);

  const setActiveCompanyId = (id: number) => {
    setActiveId(id);
    localStorage.setItem("kukbook_active_company", String(id));
  };

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, setActiveCompanyId, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
