ALTER TABLE "pg-drizzle_conversation" ADD COLUMN "stoppedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pg-drizzle_conversation" ADD COLUMN "stoppedReason" varchar(50);