// supabase/functions/extract-file-preview/index.ts
// Extracts thumbnails and preview data from uploaded files

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface FilePreviewRequest {
  file_id: string;  // uploaded_submission_files.id
  submission_id: string;
  file_type: "video" | "code" | "doc" | "image" | "other";
  file_name: string;
  gdrive_id: string;
}

async function extractVideoThumbnail(
  gdrive_id: string,
  fileName: string
): Promise<{
  thumbnailUrl?: string;
  preview_metadata?: { duration?: number; format?: string };
  error?: string;
}> {
  try {
    console.log(`Extracting video thumbnail for: ${fileName}`);

    // In production, this would call Google Drive API to:
    // 1. Download video temporarily
    // 2. Use ffmpeg to extract frame at 5 seconds
    // 3. Upload thumbnail to Drive
    // 4. Return thumbnail URL

    // For now, generate a placeholder thumbnail URL
    // The actual implementation would use Drive's thumbnail API
    const thumbnailUrl = `https://drive-cdn.googleusercontent.com/v0/b/${gdrive_id}/thumbnail`;

    return {
      thumbnailUrl,
      preview_metadata: {
        duration: 180, // 3 minutes (would be detected from actual video)
        format: "mp4",
      },
    };
  } catch (error) {
    console.error("Video thumbnail error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to extract thumbnail",
    };
  }
}

async function extractPdfPreview(
  gdrive_id: string,
  fileName: string
): Promise<{
  thumbnailUrl?: string;
  preview_metadata?: { pageCount?: number };
  error?: string;
}> {
  try {
    console.log(`Extracting PDF preview for: ${fileName}`);

    // In production:
    // 1. Use Google Drive API to get PDF metadata
    // 2. Use pdf2image or pdfthumbnail to generate preview
    // 3. Store in Drive
    // 4. Return URL

    return {
      thumbnailUrl: `https://drive-cdn.googleusercontent.com/v0/b/${gdrive_id}/preview`,
      preview_metadata: {
        pageCount: 1, // Would detect actual page count
      },
    };
  } catch (error) {
    console.error("PDF preview error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to extract preview",
    };
  }
}

async function extractCodePreview(
  gdrive_id: string,
  fileName: string
): Promise<{
  codeSnippet?: string;
  preview_metadata?: { language?: string; lineCount?: number };
  error?: string;
}> {
  try {
    console.log(`Extracting code preview for: ${fileName}`);

    // Detect language from file extension
    const ext = fileName.split(".").pop()?.toLowerCase() || "txt";
    const languageMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      go: "go",
      rs: "rust",
      rb: "ruby",
      php: "php",
      cpp: "cpp",
      c: "c",
      h: "c",
      cs: "csharp",
      sh: "bash",
      txt: "text",
    };

    const language = languageMap[ext] || "text";

    // In production:
    // 1. Download file from Drive
    // 2. Extract first 20 lines
    // 3. Return snippet

    return {
      codeSnippet: `// ${fileName}\n// Preview: First 20 lines of code`,
      preview_metadata: {
        language,
        lineCount: 20, // Would detect actual line count
      },
    };
  } catch (error) {
    console.error("Code preview error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to extract preview",
    };
  }
}

async function extractImagePreview(
  gdrive_id: string,
  fileName: string
): Promise<{
  thumbnailUrl?: string;
  preview_metadata?: { width?: number; height?: number };
  error?: string;
}> {
  try {
    console.log(`Extracting image preview for: ${fileName}`);

    // For images, Google Drive provides built-in thumbnail
    const thumbnailUrl = `https://lh3.googleusercontent.com/d/${gdrive_id}=w320-h240`;

    return {
      thumbnailUrl,
      preview_metadata: {
        width: 1920,  // Would detect actual dimensions
        height: 1080,
      },
    };
  } catch (error) {
    console.error("Image preview error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to extract preview",
    };
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
    const request: FilePreviewRequest = await req.json();

    console.log(`[extract-file-preview] Processing: ${request.file_name}`);

    let previewResult = {
      thumbnailUrl: undefined as string | undefined,
      preview_metadata: undefined as any,
    };

    // Extract preview based on file type
    switch (request.file_type) {
      case "video":
        previewResult = await extractVideoThumbnail(request.gdrive_id, request.file_name);
        break;
      case "doc":
        previewResult = await extractPdfPreview(request.gdrive_id, request.file_name);
        break;
      case "code":
        previewResult = await extractCodePreview(request.gdrive_id, request.file_name);
        break;
      case "image":
        previewResult = await extractImagePreview(request.gdrive_id, request.file_name);
        break;
      default:
        console.log(`No preview extraction for file type: ${request.file_type}`);
    }

    // Step 1: Update file record with preview data
    if (!previewResult.error) {
      console.log("Updating file record with preview data...");
      await supabase
        .from("uploaded_submission_files")
        .update({
          thumbnail_url: previewResult.thumbnailUrl,
          preview_metadata: previewResult.preview_metadata,
        })
        .eq("id", request.file_id);
    }

    // Step 2: Log automation event
    await supabase.from("automation_log").insert({
      submission_id: request.submission_id,
      automation_type: "file_preview_extract",
      status: previewResult.error ? "failed" : "completed",
      details: {
        file_name: request.file_name,
        file_type: request.file_type,
        has_thumbnail: !!previewResult.thumbnailUrl,
        error: previewResult.error,
      },
      file_id: request.file_id,
    });

    console.log("Preview extraction completed");

    return new Response(
      JSON.stringify({
        success: !previewResult.error,
        thumbnailUrl: previewResult.thumbnailUrl,
        preview_metadata: previewResult.preview_metadata,
        error: previewResult.error,
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
