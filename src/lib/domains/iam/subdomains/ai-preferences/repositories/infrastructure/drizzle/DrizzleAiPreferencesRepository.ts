import { sql } from "drizzle-orm";
import { db, aiPreferences } from "~/server/db";
import type { AiPreferencesRepository } from "../../AiPreferencesRepository";
import type { AiPreferences as AiPreferencesType, AiPreferencesInput } from "../../../objects";

function toAiPreferences(row: typeof aiPreferences.$inferSelect): AiPreferencesType {
  return {
    userId: row.userId,
    companyKnowledge: row.companyKnowledge,
    toneOfVoice: row.toneOfVoice,
    exampleMessages: row.exampleMessages ?? [],
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
    const rows = await db
      .insert(aiPreferences)
      .values({
        userId,
        companyKnowledge: input.companyKnowledge ?? null,
        toneOfVoice: input.toneOfVoice ?? null,
        exampleMessages: input.exampleMessages ?? null,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: aiPreferences.userId,
        set: {
          ...(input.companyKnowledge !== undefined && { companyKnowledge: input.companyKnowledge }),
          ...(input.toneOfVoice !== undefined && { toneOfVoice: input.toneOfVoice }),
          ...(input.exampleMessages !== undefined && { exampleMessages: input.exampleMessages }),
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
