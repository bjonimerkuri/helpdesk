import { Priority, Role, Status } from './models';

export const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Customer',
  agent: 'Agent',
  admin: 'Admin',
};
