import { createAuthClient } from "better-auth/react";

const BASE_URL = import.meta.env.WXT_API_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  fetchOptions: {
    credentials: "include",
  },
});
