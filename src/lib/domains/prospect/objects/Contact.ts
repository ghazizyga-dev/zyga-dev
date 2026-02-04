export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  jobTitle: string | null;
  phone: string | null;
  notes: string | null;
  linkedinProviderId: string | null;
  linkedinUrl: string | null;
  companyId: number | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ContactCreateInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  notes?: string | null;
  linkedinProviderId?: string | null;
  linkedinUrl?: string | null;
  companyId?: number | null;
}

export interface ContactUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  notes?: string | null;
  linkedinProviderId?: string | null;
  linkedinUrl?: string | null;
  companyId?: number | null;
}
