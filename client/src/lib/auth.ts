import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static TOKEN_KEY = 'satyasri_auth_token';
  private static USER_KEY = 'satyasri_user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setAuth(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
  }

  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static async login(username: string, password: string, role: string): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', {
      username,
      password,
      role
    });

    const authData = await response.json();
    this.setAuth(authData);
    return authData;
  }

  static async verifyToken(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch('/api/auth/verify', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      this.clearAuth();
      throw new Error('Token verification failed');
    }

    const { user } = await response.json();
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    return user;
  }

  static logout(): void {
    this.clearAuth();
    window.location.href = '/';
  }
}
