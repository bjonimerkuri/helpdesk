export type Role = 'customer' | 'agent' | 'admin';
export type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface Agent {
  id: number;
  email: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  createdBy: number;
  creatorEmail: string;
  assigneeId: number | null;
  assigneeEmail: string | null;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  body: string;
  authorEmail: string;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  comments: TicketComment[];
  allowedStatuses: Status[];
}

export interface TicketPage {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TicketQuery {
  status: string;
  q: string;
  page: number;
}
