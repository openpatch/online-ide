import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import JSZip from "jszip";
import { extractRelease } from "./fetch-cdn-release.mjs";

function archive(element = "onlineide") {
  const zip = new JSZip();
  const name = element === "onlineide" ? "online-ide" : "sql-ide";
  zip.file(`${name}-embedded.js`, "export const ready = true;");
  zip.file(`${name}-embedded.css`, "body {}");
  zip.file("assets/worker.js", "self.onmessage = () => {};");
  zip.file("assets/runtime.wasm", Buffer.from([0, 97, 115, 109]));
  zip.file("assets/worker.js.map", "source map");
  zip.file("embedded_java.html", "example");
  return zip;
}

async function fixture(t, zip) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "cdn-archive-"));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    platform: "UNIX",
  });
  return {
    bytes,
    digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    directory: path.join(temporary, "runtime"),
  };
}

test("extracts both IDE entry points, workers and WASM under include, excluding examples and maps", async (t) => {
  for (const element of ["onlineide", "sqlide"]) {
    const f = await fixture(t, archive(element));
    await extractRelease({ ...f, element });
    assert.equal(
      await fs.readFile(
        path.join(f.directory, "include/assets/worker.js"),
        "utf8",
      ),
      "self.onmessage = () => {};",
    );
    assert.deepEqual(
      await fs.readFile(path.join(f.directory, "include/assets/runtime.wasm")),
      Buffer.from([0, 97, 115, 109]),
    );
    await assert.rejects(
      fs.access(path.join(f.directory, "include/assets/worker.js.map")),
    );
    await assert.rejects(
      fs.access(path.join(f.directory, "include/embedded_java.html")),
    );
  }
});

test("rejects a checksum mismatch before extraction", async (t) => {
  const f = await fixture(t, archive());
  await assert.rejects(
    extractRelease({
      ...f,
      digest: `sha256:${"0".repeat(64)}`,
      element: "onlineide",
    }),
    /checksum/,
  );
  await assert.rejects(fs.access(f.directory));
});

test("rejects traversal, absolute paths and symlinks before extracting any files", async (t) => {
  for (const name of ["../outside.js", "/outside.js", "assets\\outside.js"]) {
    const zip = archive();
    zip.file(name, "unsafe");
    const f = await fixture(t, zip);
    await assert.rejects(
      extractRelease({ ...f, element: "onlineide" }),
      /Unsafe/,
    );
    await assert.rejects(fs.access(f.directory));
  }
  const zip = archive();
  zip.file("link", "../outside", { unixPermissions: 0o120777 });
  const f = await fixture(t, zip);
  await assert.rejects(
    extractRelease({ ...f, element: "onlineide" }),
    /Unsafe/,
  );
});

test("rejects an archive without its embedded entry point", async (t) => {
  const zip = archive();
  zip.remove("online-ide-embedded.js");
  const f = await fixture(t, zip);
  await assert.rejects(
    extractRelease({ ...f, element: "onlineide" }),
    /Missing embedded js/,
  );
});
