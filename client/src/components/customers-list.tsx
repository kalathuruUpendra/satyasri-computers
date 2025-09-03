import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, Mail, MapPin, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type Customer } from "@shared/schema";

export default function CustomersList() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-secondary animate-pulse rounded"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-secondary animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Customers ({customers.length})</h3>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-customers"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {customers.length === 0 ? "No customers found" : "No customers match your search"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow" data-testid={`card-customer-${customer.id}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  {customer.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span data-testid={`text-phone-${customer.id}`}>{customer.phone}</span>
                </div>
                
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span data-testid={`text-email-${customer.id}`}>{customer.email}</span>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs" data-testid={`text-address-${customer.id}`}>{customer.address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span data-testid={`text-created-${customer.id}`}>
                    Joined {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <Badge variant="outline" className="w-fit" data-testid={`badge-customer-${customer.id}`}>
                  Customer
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}