import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Edit, Eye } from "lucide-react";
import { getStatusColor, formatShortDate } from "@/lib/ticket-utils";
import { type TicketWithCustomer } from "@shared/schema";

interface OrdersTableProps {
  tickets: TicketWithCustomer[];
  onShowDetails: (ticketId: string) => void;
  onSendMessage: (ticket: TicketWithCustomer) => void;
  userRole: string;
  showActions?: boolean;
}

export default function OrdersTable({ 
  tickets, 
  onShowDetails, 
  onSendMessage, 
  userRole,
  showActions = true 
}: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.problemDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.serviceStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {userRole === 'technician' ? 'My Assigned Orders' : 'All Orders'}
          </CardTitle>
          <div className="flex space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-orders"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="table-responsive overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ticket ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Issue</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                {showActions && (
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-sm font-medium text-primary cursor-pointer"
                      onClick={() => onShowDetails(ticket.ticketId)}
                      data-testid={`ticket-link-${ticket.ticketId}`}>
                    {ticket.ticketId}
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground">{ticket.customer.name}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{ticket.deviceType}</td>
                  <td className="py-3 px-4 text-sm text-foreground max-w-48 truncate" title={ticket.problemDescription}>
                    {ticket.problemDescription}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(ticket.serviceStatus)} variant="secondary">
                      {ticket.serviceStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(ticket.paymentStatus)} variant="secondary">
                      {ticket.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatShortDate(ticket.createdAt!)}
                  </td>
                  {showActions && (
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onShowDetails(ticket.ticketId)}
                          data-testid={`button-view-${ticket.ticketId}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {userRole === 'frontdesk' && ticket.serviceStatus === 'Completed' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => onSendMessage(ticket)}
                            data-testid={`button-message-${ticket.ticketId}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Cards */}
        <div className="cards-responsive space-y-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-2">
                <h4 
                  className="font-medium text-primary cursor-pointer"
                  onClick={() => onShowDetails(ticket.ticketId)}
                  data-testid={`ticket-card-${ticket.ticketId}`}
                >
                  {ticket.ticketId}
                </h4>
                <div className="flex flex-col space-y-1">
                  <Badge className={getStatusColor(ticket.serviceStatus)} variant="secondary">
                    {ticket.serviceStatus}
                  </Badge>
                  <Badge className={getStatusColor(ticket.paymentStatus)} variant="secondary">
                    {ticket.paymentStatus}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-foreground mb-1">{ticket.customer.name} - {ticket.deviceType}</p>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{ticket.problemDescription}</p>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{formatShortDate(ticket.createdAt!)}</p>
                {showActions && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onShowDetails(ticket.ticketId)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {userRole === 'frontdesk' && ticket.serviceStatus === 'Completed' && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onSendMessage(ticket)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No orders found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
