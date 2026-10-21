
import {
    int,
    mysqlEnum,
    mysqlTable,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/mysql-core";
import { mahasiswa } from "./mahasiswa.js";

export const skripsi = mysqlTable("skripsi", {
    id: int("id").autoincrement().primaryKey(),

    mahasiswaId: int("mahasiswa_id")
        .notNull()
        .references(() => mahasiswa.id, {
            onDelete: "cascade",
        }),

    judul: varchar("judul", { length: 255 }).notNull(),

    abstrak: text("abstrak"),

    tahun: int("tahun").notNull(),

    fileUrl: varchar("file_url", { length: 500 }),

    status: mysqlEnum("status", [
        "draft",
        "diajukan",
        "disetujui",
        "ditolak",
    ])
        .notNull()
        .default("draft"),

    createdAt: timestamp("created_at").defaultNow(),
});
