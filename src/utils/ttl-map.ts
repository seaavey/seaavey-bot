export class TtlMap<K, V> {
  private store = new Map<K, { value: V; expires: number }>();
  private interval: Timer;

  constructor(
    private ttlMs: number,
    cleanupIntervalMs = 60_000,
  ) {
    this.interval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  set(key: K, value: V, customTtl?: number) {
    this.store.set(key, { value, expires: Date.now() + (customTtl ?? this.ttlMs) });
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K) {
    this.store.delete(key);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expires) this.store.delete(key);
    }
  }

  destroy() {
    clearInterval(this.interval);
    this.store.clear();
  }
}
