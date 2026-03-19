import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

let _authClient: OAuth2Client | null = null;

export function getAuthClient() {
  if (_authClient) return _authClient;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  _authClient = client;
  return client;
}

export function getSheets() {
  return google.sheets({ version: "v4", auth: getAuthClient() });
}

export function getDrive() {
  return google.drive({ version: "v3", auth: getAuthClient() });
}
