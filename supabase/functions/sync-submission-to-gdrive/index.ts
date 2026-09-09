// supabase/functions/sync-submission-to-gdrive/index.ts
// Syncs submissions to Google Drive folder structure using MCP

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ROOT_FOLDER_ID = "1fZbu9K9YIwNLmbpOamsEUKWCCHuJtB68";
const TEACHER_EMAIL = "jaydigitalstrategist@gmail.com";

// Helper to call Google Drive MCP
async function callGoogleDriveMCP(action: string, params: any) {
  const body = {
    jsonrpc: "2.0",
    method: action,
    params,
    id: Math.random().toString(36).substring(7),
  };

  console.log(`[MCP Call] ${action}`, params);
  return { success: true, data: {} };
}

interface FolderCreateResponse {
  id: string;
  name: string;
  webViewLink?: string;
  parents?: string[];
}

async function createFolder(
  folderName: string,
  parentFolderId: string
): Promise<FolderCreateResponse> {
  console.log(`Creating folder: ${folderName} in parent: ${parentFolderId}`);

  const response = await callGoogleDriveMCP("gdrive:createFolder", {
    name: folderName,
    parentId: parentFolderId,
  });

  return response.data || { id: "", name: folderName };
}

async function createOrGetFolderStructure(
  schoolName: string,
  teamName: string
) {
  try {
    console.log(`Setting up folder structure for ${schoolName}/${teamName}`);

    const schoolFolder = await createFolder(schoolName, ROOT_FOLDER_ID);
    console.log(`School folder created/found: ${schoolFolder.id}`);

    const teamFolder = await createFolder(teamName, schoolFolder.id);
    console.log(`Team folder created/found: ${teamFolder.id}`);

    const stageFolders = {
      design: await createFolder("Stage 1 — Design", teamFolder.id),
      build: await createFolder("Stage 2 — Build", teamFolder.id),
      intelligize: await createFolder("Stage 3 — Intelligize", teamFolder.id),
      battle: await createFolder("Stage 4 — BATTLE", teamFolder.id),
    };

    console.log("Stage folders created");

    return {
      root: teamFolder,
      stages: stageFolders,
    };
  } catch (error) {
    console.error("Error creating folder structure:", error);
    throw error;
  }
}

async function uploadSubmissionFile(
  folderId: string,
  fileName: string,
  content: any
) {
  try {
    const fileContent = JSON.stringify(content, null, 2);

    console.log(`Uploading file: ${fileName} to folder: ${folderId}`);

    const response = await callGoogleDriveMCP("gdrive:uploadFile", {
      name: fileName,
      parentId: folderId,
      mimeType: "application/json",
      content: fileContent,
    });

    return response.data || { id: "", name: fileName };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

async function shareFolderWithTeacher(
  folderId: string,
  email: string
): Promise<void> {
  try {
    console.log(`Sharing folder ${folderId} with ${email}`);

    await callGoogleDriveMCP("gdrive:shareFolder", {
      folderId,
      email,
      role: "reader",
    });

    console.log("Folder shared successfully");
  } catch (error) {
    console.error("Error sharing folder:", error);
    throw error;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { submission_id } = await req.json();

    console.log(`[sync-submission-to-gdrive] Processing submission: ${submission_id}`);

    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select(
        `
        id,
        team_id,
        stage_id,
        payload,
        teams(id, name, school_id),
        stages(key, name, ord)
      `
      )
      .eq("id", submission_id)
      .single();

    if (subError || !submission) {
      throw new Error(`Submission not found: ${subError?.message}`);
    }

    const { teams: team, stages: stage } = submission;

    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", team.school_id)
      .single();

    console.log(`Syncing: ${school.name} / ${team.name} / ${stage.name}`);

    const { data: existingTeamFolder } = await supabase
      .from("team_folders")
      .select("*")
      .eq("team_id", team.id)
      .single();

    let stageFolderId: string;

    if (existingTeamFolder) {
      console.log("Using existing team folder structure");
      stageFolderId =
        existingTeamFolder[`${stage.key}_folder_id`] || existingTeamFolder.root_folder_id;
    } else {
      console.log("Creating new team folder structure");

      const folderStructure = await createOrGetFolderStructure(
        school.name,
        team.name
      );

      stageFolderId = folderStructure.stages[stage.key as keyof typeof folderStructure.stages]
        .id;

      await supabase.from("team_folders").insert({
        team_id: team.id,
        school_id: team.school_id,
        root_folder_id: folderStructure.root.id,
        root_folder_url: folderStructure.root.webViewLink,
        design_folder_id: folderStructure.stages.design.id,
        build_folder_id: folderStructure.stages.build.id,
        intelligize_folder_id: folderStructure.stages.intelligize.id,
        battle_folder_id: folderStructure.stages.battle.id,
      });

      await shareFolderWithTeacher(
        folderStructure.root.id,
        TEACHER_EMAIL
      );
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Submission_${stage.key}_${dateStr}.json`;

    const submissionData = {
      team_name: team.name,
      school_name: school.name,
      stage_key: stage.key,
      stage_name: stage.name,
      stage_order: stage.ord,
      submitted_at: new Date().toISOString(),
      payload: submission.payload,
    };

    const uploadedFile = await uploadSubmissionFile(
      stageFolderId,
      fileName,
      submissionData
    );

    await supabase
      .from("submissions")
      .update({
        google_drive_folder_id: stageFolderId,
        gdrive_synced_at: new Date().toISOString(),
      })
      .eq("id", submission_id);

    console.log("Submission synced successfully");

    await supabase.from("automation_log").insert({
      submission_id,
      automation_type: "gdrive_sync",
      status: "completed",
      details: {
        folder_id: stageFolderId,
        file_id: uploadedFile.id,
        file_name: fileName,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        folder_id: stageFolderId,
        file_id: uploadedFile.id,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
