import type { GroupMetadata, WASocket } from "baileys";
import { TtlMap } from "@/utils/ttl-map";

const cache = new TtlMap<string, GroupMetadata>(5 * 60 * 1000);

export async function getCachedGroupMetadata(sock: WASocket, jid: string): Promise<GroupMetadata> {
  const cached = cache.get(jid);
  if (cached) return cached;
  const metadata = await sock.groupMetadata(jid);
  cache.set(jid, metadata);
  return metadata;
}

export function invalidateGroupMetadata(jid: string) {
  cache.delete(jid);
}
