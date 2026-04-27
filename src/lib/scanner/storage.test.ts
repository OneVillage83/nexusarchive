import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";

import {
  getScannerArchiveRoot,
  getScannerStorageBackend,
  resolveScannerStoragePath,
} from "./storage";

function restoreEnv(name: string, previous: string | undefined) {
  if (previous == null) {
    delete process.env[name];
  } else {
    process.env[name] = previous;
  }
}

test("getScannerArchiveRoot falls back to the repo data directory", () => {
  const previous = process.env.CARD_ARCHIVE_DIR;
  delete process.env.CARD_ARCHIVE_DIR;

  try {
    assert.equal(
      getScannerArchiveRoot(),
      path.join(process.cwd(), "data", "scanner"),
    );
  } finally {
    restoreEnv("CARD_ARCHIVE_DIR", previous);
  }
});

test("getScannerArchiveRoot nests scanner artifacts under CARD_ARCHIVE_DIR", () => {
  const previous = process.env.CARD_ARCHIVE_DIR;
  process.env.CARD_ARCHIVE_DIR = path.join(process.cwd(), "custom-archive");

  try {
    assert.equal(
      getScannerArchiveRoot(),
      path.resolve(process.cwd(), "custom-archive", "scanner"),
    );
  } finally {
    restoreEnv("CARD_ARCHIVE_DIR", previous);
  }
});

test("resolveScannerStoragePath rejects parent-directory escapes", () => {
  assert.throws(
    () => resolveScannerStoragePath("../escape.png"),
    /Invalid scanner storage key|escaped root/i,
  );
});

test("getScannerStorageBackend uses filesystem unless Blob is configured", () => {
  const previous = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;

  try {
    assert.equal(getScannerStorageBackend(), "filesystem");
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token";
    assert.equal(getScannerStorageBackend(), "blob");
  } finally {
    restoreEnv("BLOB_READ_WRITE_TOKEN", previous);
  }
});
