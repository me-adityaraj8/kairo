const FALLBACK = "http://localhost:3000";

function normalize(raw: string | undefined): string | null {
  if (!raw) return null;

  // Tolerate a value pasted as "KEY=value", quoted, or with stray whitespace.
  let value = raw.trim().replace(/^[A-Z_]+=/, "").replace(/^["']|["']$/g, "").trim();
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export const siteUrl =
  normalize(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalize(process.env.NEXTAUTH_URL) ??
  normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalize(process.env.VERCEL_URL) ??
  FALLBACK;
