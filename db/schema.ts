import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";


//User table
export const user = pgTable("users",{
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  techStack: text("tech_stack")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),

  likesCount: integer("likes_count").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),

  previewImage: text("preview_image"),
  previewImages: text("preview_images")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  previewTitle: text("preview_title"),
  previewDescription: text("preview_description"),
  previewDomain: text("preview_domain"),
  previewFetchedAt: timestamp("preview_fetched_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const visitorLogs = pgTable("visitor_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  country: text("country"),
  city: text("city"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(),
  resumeUrl: text("resume_url"),
  resumeUpdatedAt: timestamp("resume_updated_at", { withTimezone: true }),
  heroRoles: text("hero_roles")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type VisitorLog = typeof visitorLogs.$inferSelect;
export type NewVisitorLog = typeof visitorLogs.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

export type SiteSettings = typeof siteSettings.$inferSelect;
