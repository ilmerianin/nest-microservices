import { withRetry } from './retry.util';

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries with exponential backoff and succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue('ok');
    const onRetry = jest.fn();

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100, onRetry });

    await jest.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('ok');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('throws after max attempts exhausted', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('persistent'));

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 50 });
    const expectation = expect(promise).rejects.toThrow('persistent');

    await jest.advanceTimersByTimeAsync(50);
    await jest.advanceTimersByTimeAsync(100);
    await expectation;

    expect(fn).toHaveBeenCalledTimes(3);
  });
});
