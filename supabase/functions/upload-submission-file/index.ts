// supabase/functions/upload-submission-file/index.ts
//
// Prepares a direct-to-Google-Drive upload for a submission file.
//
// The file itself never passes through this function or through Supabase:
// the browser reads the file selected via <input type="file"> and PUTs its
// raw bytes straight to the resumable session URL this returns. Proxying a
// multi-hundred-MB video through an Edge Function as base64 JSON (the
// previous implementation) does not work — it exceeds request body limits
// and wastes ~33% bandwidth on base64 inflation for nothing.
//
// This function does NOT write to the database. The existing submission
// save flow (src/lib/lab.ts saveSubmission) already persists file records
// into submissions.payload.uploaded_files (jsonb) once the browser reports
// the finished Drive upload — there is no separate uploaded_submission_files
// table in this database.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  createResumableUploadSession,
  findOrCreateFolder,
  getDriveAccessToken,
  type OAuthCredentials,
} from "../_shared/google-drive.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface PrepareRequest {
  team_id: string;
  stage_id: string;
  file_name: string;
  mime_type: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: PrepareRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const { team_id, stage_id, file_name, mime_type } = body;
  if (!team_id || !stage_id || !file_name || !mime_type) {
    return json({ error: "team_id, stage_id, file_name, and mime_type are required." }, 400);
  }

  const rootFolderId = Deno.env.get("GOOGLE_DRIVE_ROOT_FOLDER_ID");
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_OAUTH_REFRESH_TOKEN");
  if (!rootFolderId || !clientId || !clientSecret || !refreshToken) {
    console.error("Google Drive OAuth secrets are not fully set.");
    return json({ error: "File upload is not configured on the server." }, 500);
  }
  const credentials: OAuthCredentials = { clientId, clientSecret, refreshToken };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const [{ data: team, error: teamError }, { data: stage, error: stageError }] = await Promise.all([
    supabase.from("teams").select("name, schools ( name )").eq("id", team_id).single(),
    supabase.from("stages").select("name").eq("id", stage_id).single(),
  ]);

  if (teamError || !team) {
    console.error("Team lookup error:", teamError);
    return json({ error: `Team not found.${teamError ? ` (${teamError.message})` : ""}` }, 404);
  }
  if (stageError || !stage) {
    console.error("Stage lookup error:", stageError);
    return json({ error: `Stage not found.${stageError ? ` (${stageError.message})` : ""}` }, 404);
  }

  const schoolName = (team as unknown as { schools: { name: string } | null }).schools?.name;
  const teamFolderName = schoolName ? `${team.name} — ${schoolName}` : team.name;

  try {
    const accessToken = await getDriveAccessToken(credentials);
    const teamFolderId = await findOrCreateFolder(accessToken, teamFolderName, rootFolderId);
    const stageFolderId = await findOrCreateFolder(accessToken, stage.name, teamFolderId);
    const uploadUrl = await createResumableUploadSession(accessToken, file_name, mime_type, stageFolderId);

    return json({ uploadUrl });
  } catch (error) {
    console.error("Drive upload preparation failed:", error);
    return json({ error: error instanceof Error ? error.message : "Could not prepare the upload." }, 502);
  }
});
