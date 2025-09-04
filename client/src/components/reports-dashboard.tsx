import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, Wrench, BarChart3, Activity, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";

interface ReportsData {
  summary: {
    totalTickets: number;
    totalCustomers: number;
    totalRevenue: number;
    avgResolutionDays: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  statusBreakdown: {
    pending: number;
    inProgress: number;
    waitingForParts: number;
    testing: number;
    completed: number;
    delivered: number;
  };
  topIssues: Array<{ category: string; count: number }>;
  recentTickets: any[];
}

export default function ReportsDashboard() {
  const { data: reports, isLoading } = useQuery<ReportsData>({
    queryKey: ['/api/reports'],
  });
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  const downloadCustomersExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(customers.map((customer: any) => ({
      'Customer Name': customer.name,
      'Phone': customer.phone,
      'Email': customer.email || '',
      'Address': customer.address || '',
      'Joined Date': new Date(customer.createdAt).toLocaleDateString(),
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, `customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadOrdersExcel = () => {
    if (!reports?.recentTickets) return;
    
    const worksheet = XLSX.utils.json_to_sheet(reports.recentTickets.map((ticket: any) => ({
      'Ticket ID': ticket.ticketId,
      'Customer Name': ticket.customer?.name || '',
      'Phone': ticket.customer?.phone || '',
      'Device Type': ticket.deviceType,
      'Device Model': ticket.deviceModel || '',
      'Issue Category': ticket.issueCategory,
      'Problem Description': ticket.problemDescription,
      'Status': ticket.serviceStatus,
      'Priority': ticket.priority,
      'Payment Status': ticket.paymentStatus,
      'Estimated Cost': ticket.estimatedCost || '',
      'Final Cost': ticket.finalCost || '',
      'Advance Amount': ticket.advanceAmount || '0',
      'Assigned Technician': ticket.assignedTechnicianName || '',
      'Created Date': new Date(ticket.createdAt).toLocaleDateString(),
      'Completed Date': ticket.completedAt ? new Date(ticket.completedAt).toLocaleDateString() : '',
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary animate-pulse rounded"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-secondary animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Failed to load reports data
        </CardContent>
      </Card>
    );
  }

  const totalStatusCount = Object.values(reports.statusBreakdown).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Download Section */}
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={downloadCustomersExcel}
          className="flex items-center gap-2"
          data-testid="button-download-customers"
        >
          <Download className="h-4 w-4" />
          Download Customers Excel
        </Button>
        <Button 
          onClick={downloadOrdersExcel}
          variant="outline"
          className="flex items-center gap-2"
          disabled={!reports?.recentTickets?.length}
          data-testid="button-download-orders"
        >
          <Download className="h-4 w-4" />
          Download Orders Excel
        </Button>
      </div>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-tickets">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tickets">
              {reports.summary.totalTickets}
            </div>
            <p className="text-xs text-muted-foreground">All time tickets</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-customers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-customers">
              {reports.summary.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ₹{reports.summary.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-resolution">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-resolution">
              {reports.summary.avgResolutionDays}
            </div>
            <p className="text-xs text-muted-foreground">Days to complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-revenue-breakdown">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Today</span>
              <span className="font-medium" data-testid="text-revenue-today">₹{reports.revenue.today.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This Week</span>
              <span className="font-medium" data-testid="text-revenue-week">₹{reports.revenue.thisWeek.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="font-medium" data-testid="text-revenue-month">₹{reports.revenue.thisMonth.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-service-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Service Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(reports.statusBreakdown).map(([status, count]) => {
              const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
              const statusLabels: Record<string, string> = {
                pending: "Pending",
                inProgress: "In Progress", 
                waitingForParts: "Waiting for Parts",
                testing: "Testing",
                completed: "Completed",
                delivered: "Delivered"
              };
              
              const statusColors: Record<string, string> = {
                pending: "bg-yellow-500",
                inProgress: "bg-blue-500",
                waitingForParts: "bg-orange-500", 
                testing: "bg-purple-500",
                completed: "bg-green-500",
                delivered: "bg-emerald-500"
              };

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{statusLabels[status]}</span>
                    <span className="font-medium" data-testid={`text-status-${status}`}>{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card data-testid="card-top-issues">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.topIssues.map((issue, index) => (
                <div key={issue.category} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                    <span className="text-sm" data-testid={`text-issue-${index}`}>{issue.category}</span>
                  </div>
                  <span className="font-medium text-sm" data-testid={`text-issue-count-${index}`}>
                    {issue.count} tickets
                  </span>
                </div>
              ))}
              {reports.topIssues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No issues reported yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.recentTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex justify-between items-center border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-ticket-${ticket.id}`}>
                      {ticket.ticketId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.customer?.name} - {ticket.deviceType}
                    </p>
                  </div>
                  <Badge 
                    variant={ticket.serviceStatus === 'Completed' ? 'default' : 'secondary'}
                    data-testid={`badge-status-${ticket.id}`}
                  >
                    {ticket.serviceStatus}
                  </Badge>
                </div>
              ))}
              {reports.recentTickets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}