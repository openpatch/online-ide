import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { releasePrefix } from "./publish-cdn.mjs";

export async function extractRelease({ bytes, digest, directory, element }) {
  if (
    !/^sha256:[a-f0-9]{64}$/.test(digest) ||
    `sha256:${createHash("sha256").update(bytes).digest("hex")}` !== digest
  ) {
    throw new Error("GitHub release archive checksum mismatch");
  }
  const zip = await JSZip.loadAsync(bytes);
  // Check every filename before extracting; JSZip exposes names it sanitizes.
  const files = Object.values(zip.files).filter((entry) => !entry.dir);
  for (const entry of files) {
    const original = entry.unsafeOriginalName || entry.name;
    if (
      original !== entry.name ||
      original.startsWith("/") ||
      original.includes("\\") ||
      original.includes("\0") ||
      original
        .split("/")
        .some((part) => !part || part === "." || part === "..") ||
      (entry.unixPermissions & 0o170000) === 0o120000
    ) {
      throw new Error(`Unsafe release archive entry: ${original}`);
    }
  }
  const basename = element === "onlineide" ? "online-ide" : "sql-ide";
  for (const extension of ["js", "css"]) {
    if (!zip.file(`${basename}-embedded.${extension}`))
      throw new Error(`Missing embedded ${extension} entry point`);
  }
  await fs.rm(directory, { recursive: true, force: true });
  for (const entry of files) {
    if (/\.(map|html)$/i.test(entry.name)) continue;
    const destination = path.join(directory, "include", entry.name);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, await entry.async("nodebuffer"));
  }
}

export async function fetchRelease({
  element,
  version,
  repository = process.env.GITHUB_REPOSITORY,
  directory = ".cache/cdn-release",
  fetchImpl = fetch,
}) {
  releasePrefix(element, version);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository))
    throw new Error("Invalid GitHub repository");
  const release = JSON.parse(
    execFileSync(
      "gh",
      ["api", `repos/${repository}/releases/tags/${version}`],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
        },
      },
    ),
  );
  if (release.draft)
    throw new Error("Cannot publish a draft release to the CDN");
  const asset = release.assets.find(
    (asset) => asset.name === "dist-embedded.zip",
  );
  if (!asset) throw new Error(`No dist-embedded.zip attached to ${version}`);
  const response = await fetchImpl(asset.browser_download_url, {
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok)
    throw new Error(`Cannot download release archive: HTTP ${response.status}`);
  await extractRelease({
    bytes: Buffer.from(await response.arrayBuffer()),
    digest: asset.digest,
    directory,
    element,
  });
  console.log(
    `Verified and extracted ${repository}@${version} into ${directory}`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [element, version] = process.argv.slice(2);
  await fetchRelease({ element, version });
}
