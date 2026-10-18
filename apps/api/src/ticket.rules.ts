export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;
export const ROLES = ['customer', 'agent', 'admin'] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Role = (typeof ROLES)[number];

const TRANSITIONS: Record<Status, Status[]> = {
  open: ['in_progress', 'closed'],
  in_progress: ['resolved', 'open'],
  resolved: ['closed', 'open'],
  closed: ['open'],
};

export const allowedTransitions = (from: Status): Status[] => TRANSITIONS[from];

export const canTransition = (from: Status, to: Status): boolean => TRANSITIONS[from].includes(to);

export const isStaff = (role: Role): boolean => role !== 'customer';

export const canViewTicket = (user: { id: number; role: Role }, ticket: { createdBy: number }): boolean =>
  isStaff(user.role) || ticket.createdBy === user.id;
