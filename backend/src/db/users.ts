import {
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const USER_ACCOUNT_STATUSES = [
  "ACTIVE",
  "PENDING_VERIFICATION",
  "REJECTED",
] as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  nama: varchar("nama", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", [
    "mahasiswa",
    "kaprodi",
    "tendik",
  ]).notNull(),
  status: mysqlEnum("status", USER_ACCOUNT_STATUSES)
    .notNull()
    .default("ACTIVE"),
  // Klaim awal dari form registrasi. Nilai final tetap diambil dari data
  // mahasiswa yang diisi Tendik saat verifikasi.
  claimNim: varchar("claim_nim", { length: 20 }),
  claimProgramStudi: varchar("claim_program_studi", { length: 100 }),
  verifiedBy: int("verified_by"),
  verifiedAt: timestamp("verified_at"),
  rejectReason: varchar("reject_reason", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});