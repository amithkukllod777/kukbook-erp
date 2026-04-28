import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
  switchToCompany: (company: Company) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  activeCompany: null,
  setActiveCompanyId: () => {},
  switchToCompany: () => {},
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

  const setActiveCompanyId = useCallback((id: number) => {
    setActiveId(id);
    localStorage.setItem("kukbook_active_company", String(id));
  }, []);

  /** Switch to a company and navigate to its slug-based URL */
  const switchToCompany = useCallback((company: Company) => {
    setActiveId(company.id);
    localStorage.setItem("kukbook_active_company", String(company.id));
    // Navigate to the company's slug-based URL
    window.location.href = `/app/${company.slug}`;
  }, []);

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, setActiveCompanyId, switchToCompany, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
