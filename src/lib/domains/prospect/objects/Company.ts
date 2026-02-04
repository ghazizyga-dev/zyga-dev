export interface Company {
  id: number;
  name: string;
  linkedinProviderId: string | null;
  linkedinUrl: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CompanyCreateInput {
  name: string;
  linkedinProviderId?: string | null;
  linkedinUrl?: string | null;
  industry?: string | null;
  size?: string | null;
  website?: string | null;
}

export interface CompanyUpdateInput {
  name?: string;
  linkedinProviderId?: string | null;
  linkedinUrl?: string | null;
  industry?: string | null;
  size?: string | null;
  website?: string | null;
}
