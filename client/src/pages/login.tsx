import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await AuthService.login(formData.username, formData.password, formData.role);
      toast({
        title: "Success",
        description: "Logged in successfully"
      });
      onLogin();
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 fade-in">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">SATYASRI</h1>
            <h2 className="text-2xl font-bold text-foreground">COMPUTERS</h2>
            <p className="text-muted-foreground mt-2">Service Center Management</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                data-testid="input-username"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                data-testid="input-password"
                required
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontdesk">Front Desk Staff</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>Demo Credentials:</p>
            <p>Frontdesk: admin / admin123</p>
            <p>Technician: tech1 / tech123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
