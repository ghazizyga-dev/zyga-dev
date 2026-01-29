import { describe, it, expect, vi } from "vitest";
import { getTestInstance } from "better-auth/test";

// --- Create test auth instance (in-memory SQLite) ---

const testInstancePromise = getTestInstance(
  { emailAndPassword: { enabled: true } },
  { disableTestUser: true },
);

vi.mock("~/server/better-auth", async () => {
  const { auth } = await testInstancePromise;
  return { auth };
});

// --- Import the service AFTER the mock is set up ---

const { IamService } = await import(
  "~/lib/domains/iam/services/IamService"
);

// --- Helpers ---

async function signUpUser(email: string, name: string, password: string) {
  const { auth } = await testInstancePromise;
  return auth.api.signUpEmail({
    body: { email, name, password },
  });
}

async function signInAndGetHeaders(email: string, password: string) {
  const { signInWithUser } = await testInstancePromise;
  const { headers } = await signInWithUser(email, password);
  return headers;
}

// --- Tests ---

describe("IamService.getCurrentUser", () => {
  it("returns null when no auth headers", async () => {
    const result = await IamService.getCurrentUser(new Headers());

    expect(result).toBeNull();
  });

  it("returns null for invalid session token", async () => {
    const headers = new Headers();
    headers.set("cookie", "better-auth.session_token=invalid-garbage-token");

    const result = await IamService.getCurrentUser(headers);

    expect(result).toBeNull();
  });

  it("returns user for valid session", async () => {
    await signUpUser("alice@test.com", "Alice", "password123");
    const headers = await signInAndGetHeaders("alice@test.com", "password123");

    const result = await IamService.getCurrentUser(headers);

    expect(result).not.toBeNull();
    expect(result!.email).toBe("alice@test.com");
    expect(result!.name).toBe("Alice");
  });

  it("maps all user fields correctly", async () => {
    await signUpUser("bob@test.com", "Bob Smith", "password123");
    const headers = await signInAndGetHeaders("bob@test.com", "password123");

    const result = await IamService.getCurrentUser(headers);

    expect(result).toMatchObject({
      email: "bob@test.com",
      name: "Bob Smith",
      image: null,
    });
    expect(result!.id).toBeTypeOf("string");
    expect(result!.id.length).toBeGreaterThan(0);
  });

  it("returns null after session is revoked", async () => {
    await signUpUser("carol@test.com", "Carol", "password123");
    const headers = await signInAndGetHeaders("carol@test.com", "password123");

    // Verify session works before revoking
    const beforeRevoke = await IamService.getCurrentUser(headers);
    expect(beforeRevoke).not.toBeNull();

    // Revoke all sessions for this user
    const { auth } = await testInstancePromise;
    await auth.api.revokeSessions({ headers });

    const afterRevoke = await IamService.getCurrentUser(headers);

    expect(afterRevoke).toBeNull();
  });

  it("returns correct user among multiple users", async () => {
    await signUpUser("dan@test.com", "Dan", "password123");
    await signUpUser("eve@test.com", "Eve", "password123");

    const danHeaders = await signInAndGetHeaders("dan@test.com", "password123");
    const eveHeaders = await signInAndGetHeaders("eve@test.com", "password123");

    const danResult = await IamService.getCurrentUser(danHeaders);
    const eveResult = await IamService.getCurrentUser(eveHeaders);

    expect(danResult!.email).toBe("dan@test.com");
    expect(danResult!.name).toBe("Dan");
    expect(eveResult!.email).toBe("eve@test.com");
    expect(eveResult!.name).toBe("Eve");
    expect(danResult!.id).not.toBe(eveResult!.id);
  });
});
