import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type TicketWithCustomer } from "@shared/schema";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketWithCustomer | null;
  initialType?: 'whatsapp' | 'sms';
}

export default function MessageModal({ 
  isOpen, 
  onClose, 
  ticket, 
  initialType = 'whatsapp' 
}: MessageModalProps) {
  const [messageType, setMessageType] = useState(initialType);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { ticketId: string; messageType: string; message: string }) => {
      const response = await apiRequest('POST', '/api/communication/send', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      onClose();
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpen = (open: boolean) => {
    if (open && ticket) {
      const defaultMessage = `Dear ${ticket.customer.name}, your ${ticket.deviceType}'s service is completed and out for delivery. Please collect it from Satyasri Computers.`;
      setMessage(defaultMessage);
      setMessageType(initialType);
    } else {
      onClose();
    }
  };

  const handleSendMessage = () => {
    if (!ticket || !message.trim()) return;

    sendMessageMutation.mutate({
      ticketId: ticket.ticketId,
      messageType,
      message: message.trim()
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="message-modal-title">Send Notification</DialogTitle>
        </DialogHeader>
        
        {ticket && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                To: {ticket.customer.name} ({ticket.customer.phone})
              </p>
              <p className="text-sm text-muted-foreground">
                Device: {ticket.deviceType}
              </p>
            </div>
            
            <div>
              <Label htmlFor="messageType">Message Type</Label>
              <Select value={messageType} onValueChange={(value: 'whatsapp' | 'sms') => setMessageType(value)}>
                <SelectTrigger data-testid="select-message-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                data-testid="textarea-message"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={() => onClose()}
                data-testid="button-cancel-message"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !message.trim()}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? "Sending..." : `Send ${messageType.toUpperCase()}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
