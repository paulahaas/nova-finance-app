import { describe, it, expect } from 'vitest';

const { isValidSubscription } = await import('../pushService.js');

describe('isValidSubscription', () => {
  const good = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'x', auth: 'y' } };

  it('accepts a browser push subscription', () => {
    expect(isValidSubscription(good)).toBe(true);
  });

  it('rejects anything that is not an https endpoint with keys', () => {
    expect(isValidSubscription(null)).toBe(false);
    expect(isValidSubscription({ ...good, endpoint: 'http://insecure.example/x' })).toBe(false);
    expect(isValidSubscription({ ...good, keys: { p256dh: 'x' } })).toBe(false);
    expect(isValidSubscription({ endpoint: good.endpoint })).toBe(false);
  });
});
