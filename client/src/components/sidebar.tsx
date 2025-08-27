import { Link, useLocation } from "wouter";
import { Home, Plus, List, CheckCircle, Users, BarChart3, Wrench, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/lib/auth";

interface SidebarProps {
  userRole: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ userRole, isOpen, onToggle }: SidebarProps) {
  const [location] = useLocation();

  const frontdeskNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/add-ticket", label: "Add Application", icon: Plus },
    { href: "/orders", label: "All Orders", icon: List },
    { href: "/completed-orders", label: "Completed Orders", icon: CheckCircle },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const technicianNavItems = [
    { href: "/tech-dashboard", label: "Dashboard", icon: Home },
    { href: "/assigned-orders", label: "Assigned Orders", icon: Wrench },
    { href: "/service-notes", label: "Service Notes", icon: FileText },
  ];

  const navItems = userRole === 'frontdesk' ? frontdeskNavItems : technicianNavItems;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-center h-16 bg-sidebar-primary">
          <h1 className="text-xl font-bold text-sidebar-primary-foreground">Satyasri</h1>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                    }`}
                    onClick={handleLinkClick}
                    data-testid={`nav-${item.href.slice(1)}`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
          
          <div className="mt-8 pt-8 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={AuthService.logout}
              data-testid="button-logout"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
