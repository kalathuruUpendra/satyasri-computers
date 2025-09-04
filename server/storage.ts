import {
  users,
  customers,
  tickets,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Ticket,
  type InsertTicket,
  type TicketWithCustomer,
  type UpdateTicketStatus,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { ticket_sequences } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getAllCustomers(): Promise<Customer[]>;

  // Ticket methods
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketByTicketId(ticketId: string): Promise<Ticket | undefined>;
  createTicket(
    ticket: InsertTicket & { ticketId: string; customerId: string }
  ): Promise<Ticket>;
  updateTicketStatus(
    ticketId: string,
    update: UpdateTicketStatus & { technicianId?: string }
  ): Promise<Ticket | undefined>;
  getAllTickets(): Promise<TicketWithCustomer[]>;
  getTicketsByTechnician(technicianId: string): Promise<TicketWithCustomer[]>;
  getTicketsByStatus(status: string): Promise<TicketWithCustomer[]>;

  // Utility methods
  getNextTicketSequence(date: string): Promise<number>;
}

export class PgStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        id,
        createdAt: new Date(),
        email: insertUser.email || null,
        phone: insertUser.phone || null,
      })
      .returning();
    return user;
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const [customer] = await db
      .insert(customers)
      .values({
        ...insertCustomer,
        id,
        createdAt: new Date(),
        email: insertCustomer.email || null,
        address: insertCustomer.address || null,
      })
      .returning();
    return customer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  // Ticket methods
  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketId, ticketId));
    return ticket || undefined;
  }

  async createTicket(
    ticketData: InsertTicket & { ticketId: string; customerId: string }
  ): Promise<Ticket> {
    const id = randomUUID();
    const [ticket] = await db
      .insert(tickets)
      .values({
        ...ticketData,
        id,
        serviceNotes: [],
        createdAt: new Date(),
        completedAt: null,
        deviceModel: ticketData.deviceModel || null,
        serialNumber: ticketData.serialNumber || null,
        purchaseDate: ticketData.purchaseDate || null,
        estimatedCost:
          ticketData.estimatedCost !== undefined &&
          ticketData.estimatedCost !== null
            ? String(ticketData.estimatedCost)
            : null,
        finalCost:
          ticketData.finalCost !== undefined && ticketData.finalCost !== null
            ? String(ticketData.finalCost)
            : null,
        priority: ticketData.priority || "Medium",
        serviceStatus: ticketData.serviceStatus || "Pending",
        paymentStatus: ticketData.paymentStatus || "Pending",
      })
      .returning();
    return ticket;
  }

  async updateTicketStatus(
    ticketId: string,
    update: UpdateTicketStatus & { technicianId?: string }
  ): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketId, ticketId));
    if (!ticket) return undefined;

    const [updatedTicket] = await db
      .update(tickets)
      .set({
        serviceStatus: update.serviceStatus,
        priority: update.priority || ticket.priority,
        paymentStatus: update.paymentStatus || ticket.paymentStatus,
        finalCost:
          update.finalCost !== undefined && update.finalCost !== null
            ? String(update.finalCost)
            : ticket.finalCost,
        assignedTechnician: update.technicianId || ticket.assignedTechnician,
        completedAt:
          update.serviceStatus === "Completed"
            ? new Date()
            : ticket.completedAt,
      })
      .where(eq(tickets.id, ticket.id))
      .returning();

    // Add service note if provided
    if (update.serviceNote && update.technicianId) {
      const newNote = {
        id: randomUUID(),
        note: update.serviceNote,
        technicianId: update.technicianId,
        timestamp: new Date().toISOString(),
        photos: update.photos || [],
      };

      await db
        .update(tickets)
        .set({
          serviceNotes: sql`${tickets.serviceNotes} || ${JSON.stringify([
            newNote,
          ])}::jsonb`,
        })
        .where(eq(tickets.ticketId, ticketId));
    }

    return updatedTicket || undefined;
  }

  async getAllTickets(): Promise<TicketWithCustomer[]> {
    // Join tickets, customers, and users for technician name
    const rows = await db
      .select({
        id: tickets.id,
        ticketId: tickets.ticketId,
        customerId: tickets.customerId,
        deviceType: tickets.deviceType,
        deviceModel: tickets.deviceModel,
        serialNumber: tickets.serialNumber,
        purchaseDate: tickets.purchaseDate,
        issueCategory: tickets.issueCategory,
        problemDescription: tickets.problemDescription,
        priority: tickets.priority,
        serviceStatus: tickets.serviceStatus,
        paymentStatus: tickets.paymentStatus,
        estimatedCost: tickets.estimatedCost,
        finalCost: tickets.finalCost,
        assignedTechnician: tickets.assignedTechnician,
        serviceNotes: tickets.serviceNotes,
        createdAt: tickets.createdAt,
        completedAt: tickets.completedAt,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        customerAddress: customers.address,
        customerCreatedAt: customers.createdAt,
        assignedTechnicianName: users.fullName,
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(users, eq(tickets.assignedTechnician, users.id))
      .orderBy(desc(tickets.createdAt));
    return rows as TicketWithCustomer[];
  }

  async getTicketsByTechnician(
    technicianId: string
  ): Promise<TicketWithCustomer[]> {
    const rows = await db
      .select({
        ...tickets,
        customer: customers,
        assignedTechnicianName: sql`u.fullName`,
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(users, eq(tickets.assignedTechnician, users.id))
      .where(eq(tickets.assignedTechnician, technicianId))
      .orderBy(desc(tickets.createdAt));
    return rows as TicketWithCustomer[];
  }

  async getTicketsByStatus(status: string): Promise<TicketWithCustomer[]> {
    const rows = await db
      .select({
        ...tickets,
        customer: customers,
        assignedTechnicianName: sql`u.fullName`,
      })
      .from(tickets)
      .innerJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(users, eq(tickets.assignedTechnician, users.id))
      .where(eq(tickets.serviceStatus, status))
      .orderBy(desc(tickets.createdAt));
    return rows as TicketWithCustomer[];
  }

  async getNextTicketSequence(date: string): Promise<number> {
    const [row] = await db
      .select()
      .from(ticket_sequences)
      .where(eq(ticket_sequences.date, date));
    let nextSequence = 1;
    if (row) {
      const currentSeq = row.sequence ? parseInt(row.sequence, 10) : 0;
      nextSequence = currentSeq + 1;

      await db
        .update(ticket_sequences)
        .set({ sequence: nextSequence.toString() }) // still string in DB
        .where(eq(ticket_sequences.date, date));
      console.log('Updated ticket sequence:', nextSequence);
    } else {
      await db
        .insert(ticket_sequences)
        .values({ date, sequence: nextSequence.toString() });
    }

    return nextSequence;
  }
}

export const storage = new PgStorage();
