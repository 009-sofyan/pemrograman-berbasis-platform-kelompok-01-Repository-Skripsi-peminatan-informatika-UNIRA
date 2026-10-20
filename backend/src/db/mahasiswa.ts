import {
    int,
    mysqlTable,
    varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./users.js";

export const mahasiswa = mysqlTable("mahasiswa", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade"}),
    nim: varchar("nim", { length: 20 }).notNull().unique(),
    programStudi: varchar("program_studi", {
        length: 100,
    }).notNull(),
    peminatan: varchar("peminatan", {
        length: 100
    }),
});