import { supabase } from "@/integrations/supabase/client";

/** Portfolio bucket is private; we serve images through short-lived signed links. */
export async function signPortfolioPaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from("portfolio").createSignedUrls(paths, 60 * 60);
  const out: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}

export async function uploadPortfolioImage(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded");
  if (file.size > 10 * 1024 * 1024) throw new Error("Images must be under 10MB");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("portfolio").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}
