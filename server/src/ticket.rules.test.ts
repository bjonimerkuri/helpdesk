import { describe, expect, it } from 'vitest';
import { allowedTransitions, canTransition, canViewTicket, isStaff } from './ticket.rules';

describe('ticket status transitions', () => {
  it('allows the normal flow', () => {
    expect(canTransition('open', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'resolved')).toBe(true);
    expect(canTransition('resolved', 'closed')).toBe(true);
  });

  it('allows reopening', () => {
    expect(canTransition('closed', 'open')).toBe(true);
    expect(canTransition('resolved', 'open')).toBe(true);
  });

  it('blocks skipping steps', () => {
    expect(canTransition('open', 'resolved')).toBe(false);
    expect(canTransition('closed', 'resolved')).toBe(false);
  });

  it('does not allow a transition to the same status', () => {
    expect(canTransition('open', 'open')).toBe(false);
  });

  it('lists the allowed next statuses', () => {
    expect(allowedTransitions('open')).toEqual(['in_progress', 'closed']);
  });
});

describe('roles and visibility', () => {
  it('treats agents and admins as staff', () => {
    expect(isStaff('agent')).toBe(true);
    expect(isStaff('admin')).toBe(true);
    expect(isStaff('customer')).toBe(false);
  });

  it('lets customers see only their own tickets', () => {
    expect(canViewTicket({ id: 1, role: 'customer' }, { createdBy: 1 })).toBe(true);
    expect(canViewTicket({ id: 1, role: 'customer' }, { createdBy: 2 })).toBe(false);
  });

  it('lets staff see every ticket', () => {
    expect(canViewTicket({ id: 9, role: 'agent' }, { createdBy: 2 })).toBe(true);
  });
});
