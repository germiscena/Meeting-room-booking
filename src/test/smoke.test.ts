import { describe, it, expect } from 'vitest';

describe('Infrastructure Smoke Test', () => {
  it('runs tests and asserts successfully', () => {
    expect(1 + 1).toBe(2);
  });

  it('can query MSW mocked health endpoint', async () => {
    const res = await fetch('/api/health');
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ status: 'ok' });
  });
});
