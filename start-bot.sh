#!/bin/bash
cd /root/seaavey-bot
# Tunggu socket ready, baru kirim nomor
{ sleep 15; echo "6285857280172"; } | bun run src/index.ts 2>&1
