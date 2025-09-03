import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTicketSchema, updateTicketStatusSchema, loginSchema, insertCustomerSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "satyasri-computers-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check role
function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

function generateTicketId(date: Date, sequence: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const sequenceStr = String(sequence).padStart(4, '0');
  return `SATY-${dateStr}-${sequenceStr}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, role } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For demo purposes, we'll do simple password comparison
      // In production, use bcrypt.compare()
      if (user.password !== password || user.role !== role) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          phone: user.phone
        },
        token
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/verify", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          phone: user.phone
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Customer routes
  app.get("/api/customers", authenticateToken, requireRole(['frontdesk']), async (req: AuthenticatedRequest, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", authenticateToken, requireRole(['frontdesk']), async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      let tickets;
      
      if (req.user.role === 'technician') {
        tickets = await storage.getTicketsByTechnician(req.user.userId);
      } else {
        const status = req.query.status as string;
        if (status) {
          tickets = await storage.getTicketsByStatus(status);
        } else {
          tickets = await storage.getAllTickets();
        }
      }
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:ticketId", authenticateToken, async (req, res) => {
    try {
      const ticket = await storage.getTicketByTicketId(req.params.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const customer = await storage.getCustomer(ticket.customerId);
      let assignedTechnicianName: string | undefined;
      
      if (ticket.assignedTechnician) {
        const technician = await storage.getUser(ticket.assignedTechnician);
        assignedTechnicianName = technician?.fullName;
      }

      res.json({
        ...ticket,
        customer,
        assignedTechnicianName
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket details" });
    }
  });

  app.post("/api/tickets", authenticateToken, requireRole(['frontdesk']), async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      
      // Find or create customer
      let customer = await storage.getCustomerByPhone(ticketData.customerPhone);
      if (!customer) {
        customer = await storage.createCustomer({
          name: ticketData.customerName,
          phone: ticketData.customerPhone,
          email: ticketData.customerEmail,
          address: ticketData.customerAddress
        });
      }

      // Generate ticket ID
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const sequence = await storage.getNextTicketSequence(dateStr);
      const ticketId = generateTicketId(today, sequence);

      // Create ticket
      const { customerName, customerPhone, customerEmail, customerAddress, ...ticketFields } = ticketData;
      const ticket = await storage.createTicket({
        ...ticketFields,
        ticketId,
        customerId: customer.id
      } as any);

      res.status(201).json({ ...ticket, customer });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(400).json({ message: "Invalid ticket data" });
    }
  });

  app.patch("/api/tickets/:ticketId/status", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updateData = updateTicketStatusSchema.parse(req.body);
      
      const updatedTicket = await storage.updateTicketStatus(
        req.params.ticketId,
        { ...updateData, technicianId: req.user.userId }
      );

      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const customer = await storage.getCustomer(updatedTicket.customerId);
      res.json({ ...updatedTicket, customer });
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Stats routes
  app.get("/api/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const allTickets = await storage.getAllTickets();
      
      const stats = {
        totalTickets: allTickets.length,
        pendingTickets: allTickets.filter(t => t.serviceStatus === 'Pending').length,
        inProgressTickets: allTickets.filter(t => t.serviceStatus === 'In Progress').length,
        completedTickets: allTickets.filter(t => t.serviceStatus === 'Completed').length,
        deliveredTickets: allTickets.filter(t => t.serviceStatus === 'Delivered').length,
        totalCustomers: (await storage.getAllCustomers()).length,
        todayCompleted: allTickets.filter(t => {
          const today = new Date().toISOString().slice(0, 10);
          return t.completedAt && t.completedAt.toISOString().slice(0, 10) === today;
        }).length,
        monthlyRevenue: allTickets
          .filter(t => t.finalCost && t.serviceStatus === 'Delivered')
          .reduce((sum, t) => sum + parseFloat(t.finalCost || '0'), 0)
      };

      // Role-specific stats
      if (req.user.role === 'technician') {
        const myTickets = allTickets.filter(t => t.assignedTechnician === req.user.userId);
        (stats as any).assignedToMe = myTickets.length;
        (stats as any).myInProgress = myTickets.filter(t => t.serviceStatus === 'In Progress').length;
        (stats as any).myCompletedToday = myTickets.filter(t => {
          const today = new Date().toISOString().slice(0, 10);
          return t.completedAt && t.completedAt.toISOString().slice(0, 10) === today;
        }).length;
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

    // Reports routes
  app.get("/api/reports", authenticateToken, requireRole(['frontdesk']), async (req: AuthenticatedRequest, res) => {
    try {
      const allTickets = await storage.getAllTickets();
      const allCustomers = await storage.getAllCustomers();
      // Calculate date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const today = new Date().toISOString().slice(0, 10);
      // Ticket status breakdown
      const statusBreakdown = {
        pending: allTickets.filter(t => t.serviceStatus === 'Pending').length,
        inProgress: allTickets.filter(t => t.serviceStatus === 'In Progress').length,
        waitingForParts: allTickets.filter(t => t.serviceStatus === 'Waiting for Parts').length,
        testing: allTickets.filter(t => t.serviceStatus === 'Testing').length,
        completed: allTickets.filter(t => t.serviceStatus === 'Completed').length,
        delivered: allTickets.filter(t => t.serviceStatus === 'Delivered').length,
      };
      // Revenue calculations
      const thisMonthRevenue = allTickets
        .filter(t => t.finalCost && t.serviceStatus === 'Delivered' && 
                new Date(t.completedAt || t.createdAt) >= startOfMonth)
        .reduce((sum, t) => sum + parseFloat(t.finalCost || '0'), 0);
      const thisWeekRevenue = allTickets
        .filter(t => t.finalCost && t.serviceStatus === 'Delivered' && 
                new Date(t.completedAt || t.createdAt) >= startOfWeek)
        .reduce((sum, t) => sum + parseFloat(t.finalCost || '0'), 0);
      const todayRevenue = allTickets
        .filter(t => t.finalCost && t.serviceStatus === 'Delivered' && 
                (t.completedAt?.toISOString().slice(0, 10) === today))
        .reduce((sum, t) => sum + parseFloat(t.finalCost || '0'), 0);
      // Top issues
      const issueCategories = allTickets.reduce((acc: any, ticket) => {
        acc[ticket.issueCategory] = (acc[ticket.issueCategory] || 0) + 1;
        return acc;
      }, {});
      // Performance metrics
      const avgResolutionTime = allTickets
        .filter(t => t.completedAt)
        .reduce((sum, t) => {
          const start = new Date(t.createdAt).getTime();
          const end = new Date(t.completedAt!).getTime();
          return sum + (end - start);
        }, 0) / allTickets.filter(t => t.completedAt).length || 0;
      const reports = {
        summary: {
          totalTickets: allTickets.length,
          totalCustomers: allCustomers.length,
          totalRevenue: allTickets
            .filter(t => t.finalCost && t.serviceStatus === 'Delivered')
            .reduce((sum, t) => sum + parseFloat(t.finalCost || '0'), 0),
          avgResolutionDays: Math.round(avgResolutionTime / (1000 * 60 * 60 * 24))
        },
        revenue: {
          today: todayRevenue,
          thisWeek: thisWeekRevenue,
          thisMonth: thisMonthRevenue
        },
        statusBreakdown,
        topIssues: Object.entries(issueCategories)
          .sort(([,a]: any, [,b]: any) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count })),
        recentTickets: allTickets.slice(0, 10)
      };
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });
  // Auth logout route
  app.post("/api/auth/logout", authenticateToken, (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: "Logged out successfully" });
  });


  // Communication routes
  app.post("/api/communication/send", authenticateToken, requireRole(['frontdesk']), async (req, res) => {
    try {
      const { ticketId, messageType, message } = req.body;
      
      const ticket = await storage.getTicketByTicketId(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const customer = await storage.getCustomer(ticket.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // TODO: Implement actual SMS/WhatsApp sending
      // For now, just log the message
      console.log(`Sending ${messageType} to ${customer.phone}: ${message}`);
      
      res.json({ 
        success: true, 
        message: `${messageType.toUpperCase()} sent successfully to ${customer.name}` 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
