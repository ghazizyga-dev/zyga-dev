import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "~/server/db/schema";

let pgliteInstance: PGlite;
let drizzleInstance: ReturnType<typeof drizzle>;

export async function initializeTestDb() {
  pgliteInstance = new PGlite();
  drizzleInstance = drizzle(pgliteInstance, { schema });

  await migrate(drizzleInstance, { migrationsFolder: "./drizzle" });

  return { db: drizzleInstance, pglite: pgliteInstance };
}

export async function cleanTestDb() {
  await pgliteInstance.exec(`
    TRUNCATE "pg-drizzle_credit_balance" CASCADE;
    TRUNCATE "pg-drizzle_contact" CASCADE;
    TRUNCATE "pg-drizzle_company" CASCADE;
    TRUNCATE "pg-drizzle_ai_preferences" CASCADE;
    TRUNCATE "user" CASCADE;
  `);
}

export async function teardownTestDb() {
  await pgliteInstance.close();
}
