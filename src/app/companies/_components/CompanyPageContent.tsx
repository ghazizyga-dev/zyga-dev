"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { CompanyDetails } from "~/app/companies/_components/CompanyDetails";
import { CompanyContactList } from "~/app/companies/_components/CompanyContactList";

interface Company {
  id: number;
  name: string;
  linkedinUrl: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
}

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
}

interface CompanyPageContentProps {
  companyId: number;
}

export function CompanyPageContent({ companyId }: CompanyPageContentProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCompanyData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [companyResponse, contactsResponse] = await Promise.all([
        fetch(`/api/contacts/companies/${companyId}`),
        fetch(`/api/contacts?companyId=${companyId}`),
      ]);

      if (!companyResponse.ok) {
        throw new Error("Company not found");
      }

      const companyData = (await companyResponse.json()) as Company;
      setCompany(companyData);

      if (contactsResponse.ok) {
        const contactsData = (await contactsResponse.json()) as Contact[];
        setContacts(contactsData);
      }
    } catch {
      setErrorMessage("Failed to load company details.");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void fetchCompanyData();
  }, [fetchCompanyData]);

  if (isLoading) {
    return <p className="text-white/50">Loading company details...</p>;
  }

  if (errorMessage || !company) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-red-400">{errorMessage ?? "Company not found."}</p>
        <Link href="/contacts" className="text-blue-400 hover:underline">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <Link href="/contacts" className="text-sm text-white/50 hover:text-white/70">
        &larr; Back to contacts
      </Link>
      <CompanyDetails company={company} onUpdated={fetchCompanyData} />
      <CompanyContactList contacts={contacts} />
    </div>
  );
}
