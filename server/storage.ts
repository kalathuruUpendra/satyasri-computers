import { type User, type InsertUser, type Customer, type InsertCustomer, type Ticket, type InsertTicket, type TicketWithCustomer, type UpdateTicketStatus } from "@shared/schema";
import { randomUUID } from "crypto";

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
  createTicket(ticket: InsertTicket & { ticketId: string; customerId: string }): Promise<Ticket>;
  updateTicketStatus(ticketId: string, update: UpdateTicketStatus & { technicianId?: string }): Promise<Ticket | undefined>;
  getAllTickets(): Promise<TicketWithCustomer[]>;
  getTicketsByTechnician(technicianId: string): Promise<TicketWithCustomer[]>;
  getTicketsByStatus(status: string): Promise<TicketWithCustomer[]>;

  // Utility methods
  getNextTicketSequence(date: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private customers: Map<string, Customer>;
  private tickets: Map<string, Ticket>;
  private ticketSequences: Map<string, number>; // date -> sequence number

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.tickets = new Map();
    this.ticketSequences = new Map();

    // Initialize default users
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    const defaultUsers = [
      {
        username: "admin",
        password: "admin123",
        role: "frontdesk" as const,
        fullName: "Admin User",
        email: "admin@satyasricomputers.com",
        phone: "+91 9876543210"
      },
      {
        username: "tech1",
        password: "tech123",
        role: "technician" as const,
        fullName: "Rajesh Kumar",
        email: "tech1@satyasricomputers.com",
        phone: "+91 9876543211"
      }
    ];

    for (const userData of defaultUsers) {
      await this.createUser(userData);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      email: insertUser.email || null,
      phone: insertUser.phone || null
    };
    this.users.set(id, user);
    return user;
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.phone === phone,
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: new Date(),
      email: insertCustomer.email || null,
      address: insertCustomer.address || null
    };
    this.customers.set(id, customer);
    return customer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).sort(
      (a, b) => b.createdAt!.getTime() - a.createdAt!.getTime()
    );
  }

  // Ticket methods
  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(
      (ticket) => ticket.ticketId === ticketId,
    );
  }

  async createTicket(ticketData: InsertTicket & { ticketId: string; customerId: string }): Promise<Ticket> {
    const id = randomUUID();
    const ticket: Ticket = {
      ...ticketData,
      id,
      serviceNotes: [],
      createdAt: new Date(),
      completedAt: null,
      deviceModel: ticketData.deviceModel || null,
      serialNumber: ticketData.serialNumber || null,
      purchaseDate: ticketData.purchaseDate || null,
      estimatedCost: ticketData.estimatedCost || null,
      finalCost: ticketData.finalCost || null,
      assignedTechnician: ticketData.assignedTechnician || null,
      priority: ticketData.priority || "Medium",
      serviceStatus: ticketData.serviceStatus || "Pending",
      paymentStatus: ticketData.paymentStatus || "Pending"
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicketStatus(ticketId: string, update: UpdateTicketStatus & { technicianId?: string }): Promise<Ticket | undefined> {
    const ticket = await this.getTicketByTicketId(ticketId);
    if (!ticket) return undefined;

    const updatedTicket: Ticket = {
      ...ticket,
      serviceStatus: update.serviceStatus,
      priority: update.priority || ticket.priority,
      paymentStatus: update.paymentStatus || ticket.paymentStatus,
      finalCost: update.finalCost || ticket.finalCost,
      assignedTechnician: update.technicianId || ticket.assignedTechnician,
      completedAt: update.serviceStatus === "Completed" ? new Date() : ticket.completedAt
    };

    // Add service note if provided
    if (update.serviceNote && update.technicianId) {
      const serviceNotes = ticket.serviceNotes || [];
      serviceNotes.push({
        id: randomUUID(),
        note: update.serviceNote,
        technicianId: update.technicianId,
        timestamp: new Date().toISOString(),
        photos: update.photos || []
      });
      updatedTicket.serviceNotes = serviceNotes;
    }

    this.tickets.set(ticket.id, updatedTicket);
    return updatedTicket;
  }

  async getAllTickets(): Promise<TicketWithCustomer[]> {
    const tickets = Array.from(this.tickets.values()).sort(
      (a, b) => b.createdAt!.getTime() - a.createdAt!.getTime()
    );

    const ticketsWithCustomers: TicketWithCustomer[] = [];
    for (const ticket of tickets) {
      const customer = await this.getCustomer(ticket.customerId);
      if (customer) {
        let assignedTechnicianName: string | undefined;
        if (ticket.assignedTechnician) {
          const technician = await this.getUser(ticket.assignedTechnician);
          assignedTechnicianName = technician?.fullName;
        }

        ticketsWithCustomers.push({
          ...ticket,
          customer,
          assignedTechnicianName
        });
      }
    }

    return ticketsWithCustomers;
  }

  async getTicketsByTechnician(technicianId: string): Promise<TicketWithCustomer[]> {
    const allTickets = await this.getAllTickets();
    return allTickets.filter(ticket => ticket.assignedTechnician === technicianId);
  }

  async getTicketsByStatus(status: string): Promise<TicketWithCustomer[]> {
    const allTickets = await this.getAllTickets();
    return allTickets.filter(ticket => ticket.serviceStatus === status);
  }

  async getNextTicketSequence(date: string): Promise<number> {
    const currentSequence = this.ticketSequences.get(date) || 0;
    const nextSequence = currentSequence + 1;
    this.ticketSequences.set(date, nextSequence);
    return nextSequence;
  }
}

export const storage = new MemStorage();
