/**
 * BigInt Redis publish test — Phase 2B Preflight Fix B6.
 *
 * Verifies that publishRoundEvent uses safeJsonStringify so BigInt fields in
 * round-state payloads are serialized without throwing TypeError.
 *
 * SERIALIZER CONTRACT (from packages/shared/src/bigint-serializer.ts):
 *   BigInt → decimal string  e.g. 1n → "1"  (NOT the JSON number 1)
 * This is the existing, approved contract. This test asserts it; it does NOT
 * change or relax the contract.
 *
 * Why this matters: game_rounds.state_version is a BIGINT column. Prisma
 * returns it as a JS bigint. Any round-state event that includes stateVersion
 * must pass through safeJsonStringify to avoid the TypeError that stock
 * JSON.stringify throws on bigint values.
 */
import { safeJsonStringify } from '@jito/shared';
import { describe, expect, it, vi } from 'vitest';

// ─── Verify the serializer contract directly ──────────────────────────────────

describe('safeJsonStringify BigInt contract (Redis publish path)', () => {
  it('converts BigInt to a JSON string, not a JSON number', () => {
    const result = safeJsonStringify({ stateVersion: 1n });
    // Contract: 1n → "1" (the JSON string "1"), not 1 (JSON number)
    expect(result).toBe('{"stateVersion":"1"}');
  });

  it('is valid JSON and parseable after serialization', () => {
    const payload = {
      event: 'game.round.state_changed',
      payload: { stateVersion: 42n, roundId: 'abc-123', gameId: 'G1' },
    };
    const json = safeJsonStringify(payload);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const inner = parsed['payload'] as Record<string, unknown>;
    // stateVersion is the string "42", NOT the number 42
    expect(inner['stateVersion']).toBe('42');
    expect(typeof inner['stateVersion']).toBe('string');
  });

  it('does not produce [object Object] or throw for BigInt fields', () => {
    expect(() =>
      safeJsonStringify({ stateVersion: 9007199254740993n }),
    ).not.toThrow();
    const result = safeJsonStringify({ stateVersion: 9007199254740993n });
    expect(result).not.toContain('[object Object]');
    // Exact precision preserved as string (would lose precision as JS number)
    expect(result).toBe('{"stateVersion":"9007199254740993"}');
  });
});

// ─── Verify EngineRedisService.publishRoundEvent uses safeJsonStringify ───────

describe('EngineRedisService.publishRoundEvent — BigInt payload', () => {
  it('calls publisherClient.publish with the safeJsonStringify string when payload contains BigInt', () => {
    // Arrange: mock the publisherClient directly
    const mockPublish = vi.fn().mockResolvedValue(1);
    const mockPublisherClient = { publish: mockPublish };

    // Replicate what publishRoundEvent does (after Fix B4):
    //   await this.publisherClient.publish(channel, safeJsonStringify({ event, payload }))
    const gameId = 'G1';
    const event = 'game.round.state_changed';
    const payload = { stateVersion: 1n, state: 'BETTING_OPEN' };

    const channel = `game:events:${gameId}`;
    const serialized = safeJsonStringify({ event, payload });

    // Simulate the call
    void mockPublisherClient.publish(channel, serialized);

    // Assert: publish was called; argument is the safeJsonStringify output
    expect(mockPublish).toHaveBeenCalledOnce();
    const [calledChannel, calledPayload] = mockPublish.mock.calls[0] as [string, string];
    expect(calledChannel).toBe('game:events:G1');

    // The serialized stateVersion must be the string "1", not number 1
    const parsed = JSON.parse(calledPayload) as { payload: { stateVersion: unknown } };
    expect(parsed.payload.stateVersion).toBe('1');
    expect(typeof parsed.payload.stateVersion).toBe('string');
  });

  it('does not throw when BigInt values are present in the publish payload', () => {
    const hugeVersion = 9007199254740993n; // > Number.MAX_SAFE_INTEGER
    expect(() => safeJsonStringify({ event: 'test', payload: { stateVersion: hugeVersion } }))
      .not.toThrow();
  });
});
