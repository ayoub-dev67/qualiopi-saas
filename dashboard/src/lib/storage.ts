import { createAdminClient } from "./supabase";

const BUCKET = "documents";

export async function uploadPDF(
  orgId: string,
  sessionRef: string,
  type: string,
  fileName: string,
  pdfBuffer: Buffer
): Promise<{ path: string; url: string }> {
  const admin = createAdminClient();
  const path = `${orgId}/${sessionRef}/${type}/${fileName}`;

  const { error } = await admin.storage.from(BUCKET).upload(path, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`Storage upload error: ${error.message}`);

  const { data: urlData } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
  const url = urlData?.signedUrl ?? "";

  return { path, url };
}

export async function getDocumentURL(path: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? "";
}

export async function deleteDocument(path: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Storage delete error: ${error.message}`);
}
