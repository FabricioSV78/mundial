import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

function mimeTypeForExtension(extension: string) {
  switch (extension.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

async function resolveLogoAsset() {
  const imageDir = path.join(process.cwd(), "imagenesMundial");
  const files = await readdir(imageDir);
  const preferred = files.find((file) => /^logo(\b|[._ -])/i.test(file)) ?? files.find((file) => /^logo\./i.test(file));
  const fallback = files.find((file) => /copa del mundo mejorada/i.test(file)) ?? files[0];
  const selected = preferred ?? fallback;

  if (!selected) {
    throw new Error("NO_BRAND_IMAGE");
  }

  const filePath = path.join(imageDir, selected);
  const bytes = await readFile(filePath);
  const extension = path.extname(selected);

  return {
    bytes,
    mimeType: mimeTypeForExtension(extension),
  };
}

export default async function Icon() {
  const asset = await resolveLogoAsset();

  return new Response(asset.bytes, {
    headers: {
      "content-type": asset.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
