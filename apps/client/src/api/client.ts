import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  withCredentials: true
});

export type Role = 'ADMIN' | 'USER';
export type User = { id: string; name: string; email: string; role: Role; avatarUrl?: string };
export type Ticket = {
  id: string;
  publicId: string;
  failureDescription: string;
  deviceSpecs?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  reportedAt: string;
  resolvedAt?: string;
  creator: User;
  leader?: User;
  device?: Device;
};
export type Device = {
  id: string;
  equipment: string;
  serialNumber: string;
  state: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  loanStatus: 'ACTIVE' | 'RETURNED';
  description?: string;
  assignedUser?: User;
};
