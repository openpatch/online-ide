# Embedded releases on Cloudflare R2

Publishing a GitHub release builds and attaches `dist-embedded.zip`, then uploads
that attached ZIP to the R2 bucket `cdn` under `onlineide/<release-tag>/include/`.
The release workflow downloads the attached archive and verifies GitHub's SHA-256
digest, keeping the CDN identical to the downloadable release. It excludes HTML
examples and source maps. An existing attached ZIP is retained on reruns.

Configure organization Actions secret `CLOUDFLARE_R2_CDN` with a Cloudflare API
token permitted to read/write R2 objects and configure the bucket's CORS policy.
Set `CLOUDFLARE_ACCOUNT_ID` as an organization Actions variable or secret. Make
both available to this repository. Wrangler uses the API token directly; S3
credentials are unnecessary.

Uploads set correct MIME types and immutable year-long caching. They preserve
older versions, reject different content at an existing key and safely resume
interrupted uploads. `manifest.json` is written last. The public CDN is checked
for every file's checksum, MIME type, caching and CORS before the job succeeds.
The CORS policy permits public GET/HEAD requests from any origin.

To seed an existing release or retry it, use **Actions → Release Embedded Build →
Run workflow**, entering its published tag in `cdn_release_tag`, or:

```sh
gh workflow run release-embedded.yml --repo openpatch/online-ide -f cdn_release_tag=v2.2.1-hyperbook.28
```

Leave that input empty to run the existing build/artifact validation without
publishing. Use this immutable base URL in Hyperbook:

```json
{
  "elements": {
    "onlineide": {
      "cdn": "https://cdn.openpatch.org/onlineide/v2.2.1-hyperbook.28/"
    }
  }
}
```

The actual entry point is `include/online-ide-embedded.js`; preserve the rest of
the `include/` directory for relative workers, chunks, fonts and graphics.
New releases publish themselves. Consumers adopt new versions by updating their
pinned tag. This process does not depend on the Hyperbook Markdown package.

Run `npm run test:cdn` to test extraction, checksums, immutable publication,
resumable uploads and browser-facing verification locally.
