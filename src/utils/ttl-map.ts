export class TtlMap<K, V> {
  private store = new Map<K, { value: V; expires: number }>();

  constructor(private ttlMs: number) {}

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

  /** Release all references. Call before discarding an instance. */
  destroy() {
    this.store.clear();
  }
}
