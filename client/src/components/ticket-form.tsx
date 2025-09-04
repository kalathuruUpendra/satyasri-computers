import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTicketSchema, type InsertTicket } from "@shared/schema";
import { useLocation } from "wouter";

export default function TicketForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      deviceType: "",
      deviceModel: "",
      serialNumber: "",
      purchaseDate: "",
      issueCategory: "",
      priority: "Medium",
      problemDescription: "",
      estimatedCost: 500,
    },
    mode: "onChange",
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: InsertTicket) => {
      const response = await apiRequest('POST', '/api/tickets', data);
      return response.json();
    },
    onSuccess: (ticket) => {
      toast({
        title: "Success",
        description: `Ticket created successfully! ID: ${ticket.ticketId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      form.reset();
      setLocation('/dashboard');
    },
    onError: (error) => {
      console.error('Ticket creation error:', error);
      toast({
        title: "Error",
        description: `Failed to create ticket: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Initialize select field values
  useEffect(() => {
    form.setValue("priority", "Medium");
  }, [form]);

  const onSubmit = (data: InsertTicket) => {
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);
    createTicketMutation.mutate(data);
  };

  const fillTestData = () => {
    form.setValue("customerName", "John Doe");
    form.setValue("customerPhone", "9876543210");
    form.setValue("customerEmail", "john@example.com");
    form.setValue("customerAddress", "123 Main Street");
    form.setValue("deviceType", "Gaming Laptop");
    form.setValue("deviceModel", "Dell XPS 15");
    form.setValue("serialNumber", "DL123456");
    form.setValue("issueCategory", "Hardware");
    form.setValue("problemDescription", "Laptop not turning on, power button not responding");
    form.setValue("estimatedCost", 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Service Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Customer Information</h4>
              
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  {...form.register("customerName")}
                  data-testid="input-customer-name"
                />
                {form.formState.errors.customerName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.customerName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  {...form.register("customerPhone")}
                  data-testid="input-customer-phone"
                />
                {form.formState.errors.customerPhone && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.customerPhone.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  {...form.register("customerEmail")}
                  data-testid="input-customer-email"
                />
              </div>
              
              <div>
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  rows={3}
                  {...form.register("customerAddress")}
                  data-testid="textarea-customer-address"
                />
              </div>
            </div>
            
            {/* Device Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Device Information</h4>
              
              <div>
                <Label htmlFor="deviceType">Device Type *</Label>
                <Input
                  id="deviceType"
                  placeholder="e.g., Desktop PC, Laptop, Printer, etc."
                  {...form.register("deviceType")}
                  data-testid="input-device-type"
                />
                {form.formState.errors.deviceType && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.deviceType.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="deviceModel">Brand/Model</Label>
                <Input
                  id="deviceModel"
                  {...form.register("deviceModel")}
                  data-testid="input-device-model"
                />
              </div>
              
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  {...form.register("serialNumber")}
                  data-testid="input-serial-number"
                />
              </div>
              
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  {...form.register("purchaseDate")}
                  data-testid="input-purchase-date"
                />
              </div>
            </div>
          </div>
          
          {/* Service Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Service Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Issue Category *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("issueCategory", value)}
                >
                  <SelectTrigger data-testid="select-issue-category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hardware">Hardware Issue</SelectItem>
                    <SelectItem value="Software">Software Issue</SelectItem>
                    <SelectItem value="Network">Network Issue</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Upgrade">Upgrade</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.issueCategory && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.issueCategory.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label>Priority</Label>
                <Select 
                  defaultValue="Medium"
                  onValueChange={(value) => form.setValue("priority", value)}
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
            </div>
            
            <div>
              <Label htmlFor="problemDescription">Problem Description *</Label>
              <Textarea
                id="problemDescription"
                rows={4}
                placeholder="Describe the issue in detail..."
                {...form.register("problemDescription")}
                data-testid="textarea-problem-description"
              />
              {form.formState.errors.problemDescription && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.problemDescription.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="estimatedCost">Estimated Cost</Label>
              <Input
                id="estimatedCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="₹"
                {...form.register("estimatedCost")}
                data-testid="input-estimated-cost"
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={fillTestData}
              className="mr-2"
            >
              Fill Test Data
            </Button>
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              data-testid="button-create-ticket"
            >
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
