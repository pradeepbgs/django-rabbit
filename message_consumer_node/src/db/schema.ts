import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";



export const RequestLogs = sqliteTable("request_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    method: text("method").notNull(),
    path: text("path").notNull(),
    headers: text("headers").notNull(),
    body: text("body"),
    response_status: integer("response_status").notNull(),
    response_body: text("response_body"),
    timestamp: text("timestamp").notNull(),
});