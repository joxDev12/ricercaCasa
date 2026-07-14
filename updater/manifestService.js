const IMAGE_RE = /^ghcr\.io\/joxdev12\/ricercacasa-(backend|frontend|updater)@sha256:[0-9a-f]{64}$/;
const VERSION_RE = /^\d+\.\d+\.\d+$/;

function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1) throw new Error("Manifest schemaVersion non valido");
  for (const key of ["platformVersion", "updaterVersion", "minimumUpdaterVersion"]) {
    if (!VERSION_RE.test(manifest[key] || "")) throw new Error(`Manifest ${key} non valido`);
  }
  for (const key of ["backend", "frontend", "updater"]) {
    const image = manifest.images?.[key];
    if (!image || !IMAGE_RE.test(image.reference) || !VERSION_RE.test(image.version || "")) throw new Error(`Manifest immagine ${key} non valida`);
  }
  for (const key of ["compose", "releaseEnv"]) {
    const asset = manifest.assets?.[key];
    if (!asset || !/^[0-9a-f]{64}$/.test(asset.sha256 || "")) throw new Error(`Manifest checksum ${key} non valido`);
  }
  if (manifest.database?.migrationMode !== "forward-only") throw new Error("Manifest migrationMode non valido");
  return manifest;
}

module.exports = { validateManifest };
