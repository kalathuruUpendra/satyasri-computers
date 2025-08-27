import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateTicketStatusSchema, type UpdateTicketStatus, type TicketWithCustomer } from "@shared/schema";
import { AuthService } from "@/lib/auth";

interface StatusUpdateFormProps {
  ticket: TicketWithCustomer;
  onClose: () => void;
}

export default function StatusUpdateForm({ ticket, onClose }: StatusUpdateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = AuthService.getUser();

  const form = useForm<UpdateTicketStatus>({
    resolver: zodResolver(updateTicketStatusSchema),
    defaultValues: {
      serviceStatus: ticket.serviceStatus as any,
      priority: ticket.priority as any,
      paymentStatus: ticket.paymentStatus as any,
      finalCost: ticket.finalCost || "",
      serviceNote: "",
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: UpdateTicketStatus) => {
      const response = await apiRequest('PATCH', `/api/tickets/${ticket.ticketId}/status`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticket.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onClose();
    },
    onError: (error) => {
      console.error('Status update error:', error);
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateTicketStatus) => {
    updateStatusMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update Status - {ticket.ticketId}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Service Status - Technicians can update */}
          {user?.role === 'technician' && (
            <div>
              <Label>Service Status</Label>
              <Select 
                defaultValue={ticket.serviceStatus}
                onValueChange={(value) => form.setValue("serviceStatus", value as any)}
              >
                <SelectTrigger data-testid="select-service-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Waiting for Parts">Waiting for Parts</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Select 
              defaultValue={ticket.priority}
              onValueChange={(value) => form.setValue("priority", value as any)}
            >
              <SelectTrigger data-testid="select-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status - Both roles can update */}
          <div>
            <Label>Payment Status</Label>
            <Select 
              defaultValue={ticket.paymentStatus}
              onValueChange={(value) => form.setValue("paymentStatus", value as any)}
            >
              <SelectTrigger data-testid="select-payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Advance Paid">Advance Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Final Cost */}
          <div>
            <Label htmlFor="finalCost">Final Cost</Label>
            <Input
              id="finalCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="₹"
              {...form.register("finalCost")}
              data-testid="input-final-cost"
            />
          </div>

          {/* Service Note - Technicians only */}
          {user?.role === 'technician' && (
            <div>
              <Label htmlFor="serviceNote">Service Note</Label>
              <Textarea
                id="serviceNote"
                rows={3}
                placeholder="Add a note about the service..."
                {...form.register("serviceNote")}
                data-testid="textarea-service-note"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-update"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateStatusMutation.isPending}
              data-testid="button-save-update"
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}