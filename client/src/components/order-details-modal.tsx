import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/lib/auth";
import { getStatusColor, formatDate } from "@/lib/ticket-utils";
import { type TicketWithCustomer } from "@shared/schema";
import { MessageSquare, Smartphone } from "lucide-react";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  onSendMessage: (ticket: TicketWithCustomer, type: 'whatsapp' | 'sms') => void;
}

export default function OrderDetailsModal({ 
  isOpen, 
  onClose, 
  ticketId, 
  onSendMessage 
}: OrderDetailsModalProps) {
  const { data: ticket, isLoading } = useQuery<TicketWithCustomer>({
    queryKey: ['/api/tickets', ticketId],
    enabled: isOpen && !!ticketId,
  });

  const user = AuthService.getUser();
  const canSendMessage = user?.role === 'frontdesk' && ticket?.serviceStatus === 'Completed';

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="loading-spinner"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!ticket) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>Ticket not found.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            Order Details - {ticket.ticketId}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Customer Information</h4>
            <div className="space-y-2">
              <p><span className="text-muted-foreground">Name:</span> <span data-testid="customer-name">{ticket.customer.name}</span></p>
              <p><span className="text-muted-foreground">Phone:</span> <span data-testid="customer-phone">{ticket.customer.phone}</span></p>
              {ticket.customer.email && (
                <p><span className="text-muted-foreground">Email:</span> <span data-testid="customer-email">{ticket.customer.email}</span></p>
              )}
              {ticket.customer.address && (
                <p><span className="text-muted-foreground">Address:</span> <span data-testid="customer-address">{ticket.customer.address}</span></p>
              )}
            </div>
          </div>
          
          {/* Device Information */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Device Information</h4>
            <div className="space-y-2">
              <p><span className="text-muted-foreground">Type:</span> <span data-testid="device-type">{ticket.deviceType}</span></p>
              {ticket.deviceModel && (
                <p><span className="text-muted-foreground">Brand/Model:</span> <span data-testid="device-model">{ticket.deviceModel}</span></p>
              )}
              {ticket.serialNumber && (
                <p><span className="text-muted-foreground">Serial Number:</span> <span data-testid="device-serial">{ticket.serialNumber}</span></p>
              )}
              <p><span className="text-muted-foreground">Issue Category:</span> <span data-testid="issue-category">{ticket.issueCategory}</span></p>
              <p><span className="text-muted-foreground">Priority:</span> 
                <Badge className={`ml-2 ${getStatusColor(ticket.priority)}`} variant="secondary" data-testid="priority-badge">
                  {ticket.priority}
                </Badge>
              </p>
            </div>
          </div>
        </div>
        
        {/* Service Information */}
        <div className="mt-6">
          <h4 className="font-medium text-foreground mb-4">Service Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p><span className="text-muted-foreground">Service Status:</span> 
                <Badge className={`ml-2 ${getStatusColor(ticket.serviceStatus)}`} variant="secondary" data-testid="service-status-badge">
                  {ticket.serviceStatus}
                </Badge>
              </p>
              <p><span className="text-muted-foreground">Payment Status:</span> 
                <Badge className={`ml-2 ${getStatusColor(ticket.paymentStatus)}`} variant="secondary" data-testid="payment-status-badge">
                  {ticket.paymentStatus}
                </Badge>
              </p>
              <p><span className="text-muted-foreground">Created:</span> <span data-testid="created-date">{formatDate(ticket.createdAt!)}</span></p>
              {ticket.completedAt && (
                <p><span className="text-muted-foreground">Completed:</span> <span data-testid="completed-date">{formatDate(ticket.completedAt)}</span></p>
              )}
            </div>
            
            <div className="space-y-2">
              {ticket.estimatedCost && (
                <p><span className="text-muted-foreground">Estimated Cost:</span> <span data-testid="estimated-cost">₹{ticket.estimatedCost}</span></p>
              )}
              {ticket.finalCost && (
                <p><span className="text-muted-foreground">Final Cost:</span> <span data-testid="final-cost">₹{ticket.finalCost}</span></p>
              )}
              {ticket.assignedTechnicianName && (
                <p><span className="text-muted-foreground">Assigned Technician:</span> <span data-testid="assigned-technician">{ticket.assignedTechnicianName}</span></p>
              )}
            </div>
          </div>
        </div>
        
        {/* Problem Description */}
        <div className="mt-6">
          <h4 className="font-medium text-foreground mb-2">Problem Description</h4>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded" data-testid="problem-description">
            {ticket.problemDescription}
          </p>
        </div>
        
        {/* Service Notes */}
        {ticket.serviceNotes && ticket.serviceNotes.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-foreground mb-4">Service Notes</h4>
            <div className="space-y-3">
              {ticket.serviceNotes.map((note) => (
                <div key={note.id} className="bg-muted p-3 rounded" data-testid={`service-note-${note.id}`}>
                  <p className="text-sm">{note.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(note.timestamp).toLocaleString()} 
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        {canSendMessage && (
          <div className="mt-6 flex space-x-4">
            <Button
              onClick={() => onSendMessage(ticket, 'whatsapp')}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-send-whatsapp"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Send WhatsApp
            </Button>
            <Button
              onClick={() => onSendMessage(ticket, 'sms')}
              variant="outline"
              data-testid="button-send-sms"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Send SMS
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
