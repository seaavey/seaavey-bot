import type { GroupMetadata, WASocket } from "baileys";
import { TtlMap } from "@/utils/ttl-map";

const cache = new TtlMap<string, GroupMetadata>(5 * 60 * 1000);
const pending = new Map<string, Promise<GroupMetadata>>();

export async function getCachedGroupMetadata(sock: WASocket, jid: string): Promise<GroupMetadata> {
  const cached = cache.get(jid);
  if (cached) return cached;

  const existing = pending.get(jid);
  if (existing) return existing;

  const promise = sock
    .groupMetadata(jid)
    .then((metadata) => {
      cache.set(jid, metadata);
      return metadata;
    })
    .finally(() => {
      pending.delete(jid);
    });
  pending.set(jid, promise);
  return promise;
}

export function invalidateGroupMetadata(jid: string) {
  cache.delete(jid);
}
