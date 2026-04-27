import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promises as fs } from "node:fs";
import { gzipSync } from "node:zlib";

import type { FinanceExternalSourceRef } from "@/lib/finance/source-mappings";

import {
  buildFinanceSourceMappingBackupManifest,
  restoreFinanceSourceMappingsFromFile,
} from "./source-mapping-backup";

function createSourceRef(): FinanceExternalSourceRef {
  return {
    id: "ref-ain",
    game: "one-piece",
    internalCardId: "OP-ST05-002",
    cardCatalogId: "OP-ST05-002",
    source: "google-shopping",
    versionKey: "online-only",
    externalProductId: "4172129135583325756",
    externalUrl: "https://shopping.example/ain",
    matchedTitle: "Ain",
    searchQuery: "Ain OP-ST05-002 one piece card game",
    metadata: { versionLabel: "Online-Only" },
    lastDiscoveredAt: "2026-04-20T12:00:00.000Z",
    lastVerifiedAt: "2026-04-20T12:00:00.000Z",
    lastScrapedAt: "2026-04-20T12:00:00.000Z",
    createdAt: "2026-04-20T12:00:00.000Z",
    updatedAt: "2026-04-20T12:00:00.000Z",
  };
}

test("restoreFinanceSourceMappingsFromFile hydrates the manifest and warms redis-ready refs", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "finance-source-mapping-"));
  const filePath = path.join(tempDir, "finance-source-mappings.json.gz");
  const manifest = buildFinanceSourceMappingBackupManifest([createSourceRef()]);
  await fs.writeFile(filePath, gzipSync(JSON.stringify(manifest, null, 2)));

  const upsertCalls: string[] = [];
  const warmed: FinanceExternalSourceRef[][] = [];

  const restored = await restoreFinanceSourceMappingsFromFile(
    filePath,
    undefined,
    {
      upsertSourceRef: (async (input) => {
        upsertCalls.push(input.externalProductId);
        return createSourceRef();
      }) as never,
      warmSourceRefs: (async (records) => {
        warmed.push(records);
      }) as never,
    },
  );

  assert.equal(restored.length, 1);
  assert.deepEqual(upsertCalls, ["4172129135583325756"]);
  assert.equal(warmed.length, 1);
  assert.equal(warmed[0]?.length, 1);
});
