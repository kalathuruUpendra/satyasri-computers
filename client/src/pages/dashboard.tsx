import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import StatsCards from "@/components/stats-cards";
import OrdersTable from "@/components/orders-table";
import TicketForm from "@/components/ticket-form";
import OrderDetailsModal from "@/components/order-details-modal";
import MessageModal from "@/components/message-modal";
import { type TicketWithCustomer } from "@shared/schema";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messageTicket, setMessageTicket] = useState<TicketWithCustomer | null>(null);
  const [messageType, setMessageType] = useState<'whatsapp' | 'sms'>('whatsapp');

  const user = AuthService.getUser();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (user && location === '/dashboard') {
      if (user.role === 'technician') {
        setLocation('/tech-dashboard');
      }
    }
  }, [user, location, setLocation]);

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    enabled: !!user,
  });

  const { data: tickets = [] } = useQuery<TicketWithCustomer[]>({
    queryKey: ['/api/tickets'],
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  const handleShowDetails = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const handleSendMessage = (ticket: TicketWithCustomer, type: 'whatsapp' | 'sms' = 'whatsapp') => {
    setMessageTicket(ticket);
    setMessageType(type);
  };

  const getPageTitle = () => {
    const pageTitles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tech-dashboard': 'Technician Dashboard',
      '/add-ticket': 'Create New Ticket',
      '/orders': 'All Orders',
      '/completed-orders': 'Completed Orders',
      '/customers': 'Customers',
      '/reports': 'Reports',
      '/assigned-orders': 'Assigned Orders',
      '/service-notes': 'Service Notes',
    };
    return pageTitles[location] || 'Dashboard';
  };

  const renderContent = () => {
    switch (location) {
      case '/add-ticket':
        return user.role === 'frontdesk' ? <TicketForm /> : null;
      
      case '/orders':
        return user.role === 'frontdesk' ? (
          <OrdersTable
            tickets={tickets}
            onShowDetails={handleShowDetails}
            onSendMessage={handleSendMessage}
            userRole={user.role}
          />
        ) : null;
      
      case '/completed-orders':
        const completedTickets = tickets.filter(t => t.serviceStatus === 'Completed' || t.serviceStatus === 'Delivered');
        return user.role === 'frontdesk' ? (
          <OrdersTable
            tickets={completedTickets}
            onShowDetails={handleShowDetails}
            onSendMessage={handleSendMessage}
            userRole={user.role}
          />
        ) : null;
      
      case '/assigned-orders':
        return user.role === 'technician' ? (
          <OrdersTable
            tickets={tickets}
            onShowDetails={handleShowDetails}
            onSendMessage={handleSendMessage}
            userRole={user.role}
          />
        ) : null;
      
      case '/tech-dashboard':
        return user.role === 'technician' ? (
          <div className="space-y-6">
            <StatsCards stats={stats || {}} userRole={user.role} />
            <OrdersTable
              tickets={tickets.slice(0, 5)}
              onShowDetails={handleShowDetails}
              onSendMessage={handleSendMessage}
              userRole={user.role}
              showActions={false}
            />
          </div>
        ) : null;
      
      case '/customers':
      case '/reports':
      case '/service-notes':
        return (
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">{getPageTitle()}</h3>
            <p className="text-muted-foreground">This section will be implemented in a future update.</p>
          </div>
        );
      
      default:
        // Dashboard home
        return (
          <div className="space-y-6">
            <StatsCards stats={stats || {}} userRole={user.role} />
            
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
              </div>
              <div className="p-6">
                <OrdersTable
                  tickets={tickets.slice(0, 5)}
                  onShowDetails={handleShowDetails}
                  onSendMessage={handleSendMessage}
                  userRole={user.role}
                  showActions={false}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        userRole={user.role} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="button-mobile-menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">
              {getPageTitle()}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full" data-testid="user-role">
                {user.role === 'frontdesk' ? 'Front Desk Staff' : 'Technician'}
              </span>
              <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">{user.fullName.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 fade-in">
          {renderContent()}
        </main>
      </div>

      {/* Modals */}
      <OrderDetailsModal
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId}
        onSendMessage={handleSendMessage}
      />

      <MessageModal
        isOpen={!!messageTicket}
        onClose={() => setMessageTicket(null)}
        ticket={messageTicket}
        initialType={messageType}
      />
    </div>
  );
}
