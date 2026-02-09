import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
  initializeTestDb,
  cleanTestDb,
  teardownTestDb,
} from "../helpers/setupTestDb";

// --- Mock ~/server/db before any domain code loads ---

const testDbPromise = initializeTestDb();

vi.mock("~/server/db", async () => {
  const { db } = await testDbPromise;
  const { company } = await import("~/server/db/schema");
  return { db, company };
});

// --- Import the service AFTER the mock is set up ---

const { createCompanyService } = await import(
  "~/lib/domains/prospect/services/CompanyService"
);
const { DrizzleCompanyRepository } = await import(
  "~/lib/domains/prospect/repositories/infrastructure/drizzle/DrizzleCompanyRepository"
);

const CompanyService = createCompanyService(new DrizzleCompanyRepository());

// --- Helpers ---

const OWNER_A = "user-owner-a";
const OWNER_B = "user-owner-b";

async function seedTestUsers() {
  const { db } = await testDbPromise;
  const { user } = await import("~/server/db/schema");

  await db.insert(user).values([
    {
      id: OWNER_A,
      name: "Owner A",
      email: "owner-a@test.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: OWNER_B,
      name: "Owner B",
      email: "owner-b@test.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

const fullCompanyInput = {
  name: "Acme Corp",
  linkedinProviderId: "linkedin-123",
  linkedinUrl: "https://linkedin.com/company/acme",
  industry: "Technology",
  size: "51-200",
  website: "https://acme.com",
};

const minimalCompanyInput = {
  name: "Minimal Inc",
};

// --- Lifecycle ---

beforeEach(async () => {
  await cleanTestDb();
  await seedTestUsers();
});

afterAll(async () => {
  await teardownTestDb();
});

// --- Tests ---

describe("CompanyService.create", () => {
  it("creates company with all fields", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    expect(created).toMatchObject({
      ...fullCompanyInput,
      ownerId: OWNER_A,
    });
    expect(created.id).toBeTypeOf("number");
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it("creates company with required fields only", async () => {
    const created = await CompanyService.create(OWNER_A, minimalCompanyInput);

    expect(created.name).toBe("Minimal Inc");
    expect(created.linkedinProviderId).toBeNull();
    expect(created.linkedinUrl).toBeNull();
    expect(created.industry).toBeNull();
    expect(created.size).toBeNull();
    expect(created.website).toBeNull();
  });

  it("assigns unique ids", async () => {
    const firstCompany = await CompanyService.create(
      OWNER_A,
      fullCompanyInput,
    );
    const secondCompany = await CompanyService.create(
      OWNER_A,
      minimalCompanyInput,
    );

    expect(firstCompany.id).not.toBe(secondCompany.id);
  });
});

describe("CompanyService.getById", () => {
  it("returns company when owned by caller", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const found = await CompanyService.getById(created.id, OWNER_A);

    expect(found).toMatchObject({ id: created.id, name: "Acme Corp" });
  });

  it("returns null for another owner's company", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const found = await CompanyService.getById(created.id, OWNER_B);

    expect(found).toBeNull();
  });

  it("returns null for non-existent id", async () => {
    const found = await CompanyService.getById(99999, OWNER_A);

    expect(found).toBeNull();
  });
});

describe("CompanyService.getByLinkedinProviderId", () => {
  it("returns company when owned by caller", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const found = await CompanyService.getByLinkedinProviderId(
      "linkedin-123",
      OWNER_A,
    );

    expect(found).toMatchObject({ id: created.id, name: "Acme Corp" });
  });

  it("returns null for another owner's company", async () => {
    await CompanyService.create(OWNER_A, fullCompanyInput);

    const found = await CompanyService.getByLinkedinProviderId(
      "linkedin-123",
      OWNER_B,
    );

    expect(found).toBeNull();
  });

  it("returns null for non-existent linkedin provider id", async () => {
    const found = await CompanyService.getByLinkedinProviderId(
      "nonexistent-id",
      OWNER_A,
    );

    expect(found).toBeNull();
  });
});

describe("CompanyService.list", () => {
  it("returns all companies for owner", async () => {
    await CompanyService.create(OWNER_A, fullCompanyInput);
    await CompanyService.create(OWNER_A, minimalCompanyInput);

    const companyList = await CompanyService.list(OWNER_A);

    expect(companyList).toHaveLength(2);
  });

  it("returns empty array when none exist", async () => {
    const companyList = await CompanyService.list(OWNER_A);

    expect(companyList).toEqual([]);
  });

  it("excludes other owners' companies", async () => {
    await CompanyService.create(OWNER_A, fullCompanyInput);
    await CompanyService.create(OWNER_B, minimalCompanyInput);

    const ownerACompanies = await CompanyService.list(OWNER_A);

    expect(ownerACompanies).toHaveLength(1);
    expect(ownerACompanies[0]!.name).toBe("Acme Corp");
  });
});

describe("CompanyService.update", () => {
  it("updates specified fields", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const updated = await CompanyService.update(created.id, OWNER_A, {
      name: "Acme International",
      industry: "Finance",
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Acme International",
      industry: "Finance",
    });
  });

  it("preserves unmodified fields", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const updated = await CompanyService.update(created.id, OWNER_A, {
      name: "Acme International",
    });

    expect(updated!.linkedinProviderId).toBe("linkedin-123");
    expect(updated!.linkedinUrl).toBe("https://linkedin.com/company/acme");
    expect(updated!.industry).toBe("Technology");
    expect(updated!.size).toBe("51-200");
    expect(updated!.website).toBe("https://acme.com");
  });

  it("returns null for another owner's company", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const result = await CompanyService.update(created.id, OWNER_B, {
      name: "Hacked Corp",
    });

    expect(result).toBeNull();
  });

  it("does NOT modify when ownership check fails", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    await CompanyService.update(created.id, OWNER_B, {
      name: "Hacked Corp",
    });

    const unchanged = await CompanyService.getById(created.id, OWNER_A);
    expect(unchanged!.name).toBe("Acme Corp");
  });

  it("returns null for non-existent company", async () => {
    const result = await CompanyService.update(99999, OWNER_A, {
      name: "Ghost Corp",
    });

    expect(result).toBeNull();
  });

  it("can set optional fields to null", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const updated = await CompanyService.update(created.id, OWNER_A, {
      linkedinProviderId: null,
      website: null,
    });

    expect(updated!.linkedinProviderId).toBeNull();
    expect(updated!.website).toBeNull();
  });
});

describe("CompanyService.delete", () => {
  it("deletes owned company and returns true", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const deleted = await CompanyService.delete(created.id, OWNER_A);

    expect(deleted).toBe(true);

    const found = await CompanyService.getById(created.id, OWNER_A);
    expect(found).toBeNull();
  });

  it("returns false for another owner's company", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    const deleted = await CompanyService.delete(created.id, OWNER_B);

    expect(deleted).toBe(false);
  });

  it("does NOT delete when ownership check fails", async () => {
    const created = await CompanyService.create(OWNER_A, fullCompanyInput);

    await CompanyService.delete(created.id, OWNER_B);

    const stillExists = await CompanyService.getById(created.id, OWNER_A);
    expect(stillExists).not.toBeNull();
  });

  it("returns false for non-existent company", async () => {
    const deleted = await CompanyService.delete(99999, OWNER_A);

    expect(deleted).toBe(false);
  });
});
