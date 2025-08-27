import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Users, IndianRupee, Wrench, Cog } from "lucide-react";

interface StatsCardsProps {
  stats: any;
  userRole: string;
}

export default function StatsCards({ stats, userRole }: StatsCardsProps) {
  if (userRole === 'technician') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Orders</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-assigned-orders">
                  {stats.assignedToMe || 0}
                </p>
              </div>
              <div className="bg-accent/10 p-3 rounded-full">
                <Wrench className="text-accent h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-in-progress">
                  {stats.myInProgress || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Cog className="text-blue-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-completed-today">
                  {stats.myCompletedToday || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="text-green-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ongoing Orders</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-ongoing-orders">
                {(stats.pendingTickets || 0) + (stats.inProgressTickets || 0)}
              </p>
            </div>
            <div className="bg-accent/10 p-3 rounded-full">
              <Clock className="text-accent h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-completed-today">
                {stats.todayCompleted || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600 h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-total-customers">
                {stats.totalCustomers || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600 h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue (Month)</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-monthly-revenue">
                ₹{(stats.monthlyRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <IndianRupee className="text-green-600 h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
