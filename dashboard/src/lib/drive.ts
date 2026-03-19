import { getDrive } from "./google-auth";
import { Readable } from "stream";

const DRIVE_ROOT_ID = process.env.DRIVE_ROOT_ID!;

/** Create a folder in Drive, returns the folder ID */
export async function createFolder(name: string, parentId: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return res.data.id!;
}

/** Upload a PDF buffer to Drive, returns { id, webViewLink } */
export async function uploadPDF(
  name: string,
  pdfBuffer: Buffer,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/pdf",
      parents: [folderId],
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(pdfBuffer),
    },
    fields: "id,webViewLink",
  });
  return { id: res.data.id!, webViewLink: res.data.webViewLink! };
}

/** Find a folder by name inside a parent (returns ID or null) */
async function findFolder(name: string, parentId: string): Promise<string | null> {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    pageSize: 1,
  });
  return res.data.files?.[0]?.id ?? null;
}

/** Ensure a folder exists (create if not), returns ID */
async function ensureFolder(name: string, parentId: string): Promise<string> {
  const existing = await findFolder(name, parentId);
  if (existing) return existing;
  return createFolder(name, parentId);
}

interface SessionFolders {
  root: string;
  admin: string;
  pedagogie: string;
  emargement: string;
  evaluation: string;
  satisfaction: string;
  certificats: string;
}

/** Create the full folder hierarchy for a session (idempotent) */
export async function ensureSessionFolders(
  session: Record<string, string>,
  formation: Record<string, string>,
  formateur: Record<string, string>
): Promise<SessionFolders> {
  const year = (session.date_debut ?? "").substring(0, 4) || new Date().getFullYear().toString();
  const formationName = (formation.intitule ?? "Formation").substring(0, 50);
  const formateurName = `${formateur.prenom ?? ""} ${formateur.nom ?? ""}`.trim() || "Formateur";
  const dateDebut = (session.date_debut ?? "").substring(0, 10).replace(/-/g, "");
  const sessionFolderName = `Session_${dateDebut}_${formateurName}`;

  const yearFolder = await ensureFolder(year, DRIVE_ROOT_ID);
  const formationFolder = await ensureFolder(formationName, yearFolder);
  const sessionFolder = await ensureFolder(sessionFolderName, formationFolder);

  const subfolders = [
    "00_Admin",
    "01_Pedagogie",
    "02_Emargement",
    "03_Evaluation",
    "04_Satisfaction",
    "05_Certificats",
  ] as const;

  const ids = await Promise.all(subfolders.map((name) => ensureFolder(name, sessionFolder)));

  return {
    root: sessionFolder,
    admin: ids[0],
    pedagogie: ids[1],
    emargement: ids[2],
    evaluation: ids[3],
    satisfaction: ids[4],
    certificats: ids[5],
  };
}
