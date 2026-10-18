import { describe, expect, it } from 'vitest';
import { escapeLike } from './sql';

describe('escapeLike', () => {
  it('leaves ordinary text alone', () => {
    expect(escapeLike('password reset')).toBe('password reset');
  });

  it('escapes wildcard characters so they match literally', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('back\\slash')).toBe('back\\\\slash');
  });
});
