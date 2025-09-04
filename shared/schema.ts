import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'frontdesk' or 'technician'
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});



export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: text("ticket_id").notNull().unique(), // SATY-YYYYMMDD-XXXX format
  customerId: varchar("customer_id").notNull(),
  deviceType: text("device_type").notNull(),
  deviceModel: text("device_model"),
  serialNumber: text("serial_number"),
  purchaseDate: text("purchase_date"),
  issueCategory: text("issue_category").notNull(),
  problemDescription: text("problem_description").notNull(),
  priority: text("priority").notNull().default("Medium"),
  serviceStatus: text("service_status").notNull().default("Pending"), // Pending, In Progress, Completed, Delivered
  paymentStatus: text("payment_status").notNull().default("Pending"), // Pending, Paid
  estimatedCost: decimal("estimated_cost"),
  finalCost: decimal("final_cost"),
  assignedTechnician: text("assigned_technician"),
  serviceNotes: json("service_notes").$type<Array<{
    id: string;
    note: string;
    technicianId: string;
    timestamp: string;
    photos?: string[];
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const ticket_sequences = pgTable("ticket_sequences", {
  date: text("date").primaryKey(),
  sequence: decimal("sequence"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketId: true,
  customerId: true,
  createdAt: true,
  completedAt: true,
  serviceNotes: true,
  assignedTechnician: true,
}).extend({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().optional(),
  customerAddress: z.string().optional(),

  deviceType: z.string().min(1),
  deviceModel: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  issueCategory: z.string().min(1),

  priority: z.string().min(1),
  problemDescription: z.string().min(1),
  assignedTechnician: z.string().optional(),

  estimatedCost: z.preprocess(val => val === "" ? undefined : Number(val), z.number().optional()),
});

export const updateTicketStatusSchema = z.object({
  serviceStatus: z.enum(["Pending", "In Progress", "Waiting for Parts", "Testing", "Completed", "Delivered"]),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  paymentStatus: z.enum(["Pending", "Paid", "Advance Paid"]).optional(),
  finalCost: z.preprocess(val => val === "" ? undefined : Number(val), z.number().optional()),
  serviceNote: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["frontdesk", "technician"]),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type UpdateTicketStatus = z.infer<typeof updateTicketStatusSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type TicketWithCustomer = Ticket & {
  customer: Customer;
  assignedTechnicianName?: string;
};
