export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'people' | 'superadmin';
  department: string;
}

export interface MonthlyAllocation {
  userId: string;
  month: string;
  pointsRemaining: number;
  pointsReceived: number;
}

export interface PointAssignment {
  id: string;
  fromUserId: string;
  toUserId: string;
  points: number;
  category: string;
  message?: string;
  timestamp: number;
  month: string;
}

export type Category = 
  | 'Trabajo en equipo'
  | 'Innovación'
  | 'Liderazgo'
  | 'Colaboración'
  | 'Compromiso'
  | 'Excelencia'
  | 'Actitud positiva'
  | 'Comunicación efectiva';

export interface CategoryConfig {
  name: string;
  enabled: boolean;
}

export interface LoginContent {
  title: string;
  subtitle: string;
  description: string;
  helpEmail: string;
}

export interface OnboardingStep {
  title: string;
  description: string;
  details: string;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  notifyEmployee: boolean; // Notificar al colaborador cuando recibe puntos
  notifyPeople: boolean; // Notificar al equipo de People
  peopleEmails: string[]; // Lista de emails del equipo de People
  smtpProvider: 'gmail' | 'outlook' | 'sendgrid' | 'custom';
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

export interface SystemConfig {
  categories: CategoryConfig[];
  loginContent: LoginContent;
  onboardingSteps: OnboardingStep[];
  emailNotifications: EmailNotificationConfig;
}