import { sql } from "drizzle-orm";
import { db, aiPreferences } from "~/server/db";
import type { AiPreferencesRepository } from "../../AiPreferencesRepository";
import type { AiPreferences as AiPreferencesType, AiPreferencesInput } from "../../../objects";

function parseExampleMessages(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

function toAiPreferences(row: typeof aiPreferences.$inferSelect): AiPreferencesType {
  return {
    userId: row.userId,
    companyKnowledge: row.companyKnowledge,
    toneOfVoice: row.toneOfVoice,
    exampleMessages: parseExampleMessages(row.exampleMessages),
    onboardingCompleted: row.onboardingCompleted === 1,
  };
}

export class DrizzleAiPreferencesRepository implements AiPreferencesRepository {
  async findByUserId(userId: string): Promise<AiPreferencesType | null> {
    const rows = await db
      .select()
      .from(aiPreferences)
      .where(sql`${aiPreferences.userId} = ${userId}`)
      .limit(1);

    const row = rows[0];
    return row ? toAiPreferences(row) : null;
  }

  async upsert(userId: string, input: AiPreferencesInput): Promise<AiPreferencesType> {
    const exampleMessagesJson = input.exampleMessages ? JSON.stringify(input.exampleMessages) : null;

    const rows = await db
      .insert(aiPreferences)
      .values({
        userId,
        companyKnowledge: input.companyKnowledge ?? null,
        toneOfVoice: input.toneOfVoice ?? null,
        exampleMessages: exampleMessagesJson,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: aiPreferences.userId,
        set: {
          ...(input.companyKnowledge !== undefined && { companyKnowledge: input.companyKnowledge }),
          ...(input.toneOfVoice !== undefined && { toneOfVoice: input.toneOfVoice }),
          ...(input.exampleMessages !== undefined && { exampleMessages: exampleMessagesJson }),
        },
      })
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Upsert returned no rows");
    }

    return toAiPreferences(row);
  }

  async markOnboardingCompleted(userId: string): Promise<void> {
    await db
      .insert(aiPreferences)
      .values({
        userId,
        onboardingCompleted: 1,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: aiPreferences.userId,
        set: {
          onboardingCompleted: 1,
        },
      });
  }
}
