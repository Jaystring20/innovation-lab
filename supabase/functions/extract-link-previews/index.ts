import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function extractYouTubePreview(url: string) {
  try {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const videoId = videoIdMatch?.[1];
    if (!videoId) return { type: "youtube", error: "Invalid URL" };
    const oembedUrl = "https://www.youtube.com/oembed?url=https://youtube.com/watch?v=" + videoId + "&format=json";
    const response = await fetch(oembedUrl);
    const data = await response.json();
    return {
      type: "youtube",
      videoId: videoId,
      title: data.title || "YouTube Video",
      author: data.author_name || "Unknown Channel",
      thumbnailUrl: "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg",
      duration: "Video",
      valid: true,
    };
  } catch (error) {
    return { type: "youtube", error: error instanceof Error ? error.message : "Error fetching preview" };
  }
}

async function extractGitHubPreview(url: string) {
  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (!match) return { type: "github", error: "Invalid GitHub URL" };
    const owner = match[1];
    const repo = match[2];
    const apiUrl = "https://api.github.com/repos/" + owner + "/" + repo;
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "STEAM-Foundry-Lab" },
    });
    if (!response.ok) return { type: "github", error: "Repository not found" };
    const data = await response.json();
    return {
      type: "github",
      owner: owner,
      repo: repo,
      url: url,
      title: data.name || repo,
      description: data.description || "No description",
      stars: data.stargazers_count || 0,
      language: data.language || "Unknown",
      updated: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "Unknown",
      valid: true,
    };
  } catch (error) {
    return { type: "github", error: error instanceof Error ? error.message : "Error fetching preview" };
  }
}

async function extractGoogleDrivePreview(url: string) {
  try {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const fileId = fileIdMatch?.[1];
    if (!fileId) return { type: "gdrive", error: "Invalid Google Drive URL" };
    const response = await fetch(url, { method: "HEAD" });
    return { type: "gdrive", fileId: fileId, url: url, accessible: response.ok, title: "Google Drive File", description: url, valid: response.ok };
  } catch (error) {
    return { type: "gdrive", error: error instanceof Error ? error.message : "Error checking file" };
  }
}

async function extractOpenGraphPreview(url: string) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; STEAM-Foundry-Lab)" } });
    if (!response.ok) return { type: "custom", error: "URL not accessible" };
    const html = await response.text();
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
    const descriptionMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
    const siteMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/);
    return { type: "custom", url: url, title: titleMatch?.[1] || new URL(url).hostname, description: descriptionMatch?.[1] || "External link", image: imageMatch?.[1], site: siteMatch?.[1] || new URL(url).hostname, valid: true };
  } catch (error) {
    return { type: "custom", error: error instanceof Error ? error.message : "Error fetching preview" };
  }
}

async function extractPreview(url: string) {
  if (!url) return { error: "No URL provided" };
  const urlObj = new URL(url);
  const hostname = urlObj.hostname || "";
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return await extractYouTubePreview(url);
  else if (hostname.includes("github.com")) return await extractGitHubPreview(url);
  else if (hostname.includes("drive.google.com")) return await extractGoogleDrivePreview(url);
  else return await extractOpenGraphPreview(url);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" } });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const body = await req.json();
    const submission_id = body.submission_id;
    console.log("Processing submission: " + submission_id);
    const subResult = await supabase.from("submissions").select("id, payload").eq("id", submission_id).single();
    const submission = subResult.data;
    if (!submission) throw new Error("Submission not found");
    const payload = submission.payload;
    const previewMetadata = {};
    if (payload.video_url) {
      console.log("Extracting video preview...");
      previewMetadata.video = await extractPreview(payload.video_url);
    }
    if (payload.doc_url) {
      console.log("Extracting doc preview...");
      previewMetadata.doc = await extractPreview(payload.doc_url);
    }
    if (payload.repo_url) {
      console.log("Extracting repo preview...");
      previewMetadata.repo = await extractPreview(payload.repo_url);
    }
    await supabase.from("submissions").update({ preview_metadata: previewMetadata, preview_generated_at: new Date().toISOString() }).eq("id", submission_id);
    const fileTypes = [
      { key: "video_url", type: "video", sourceType: "youtube" },
      { key: "doc_url", type: "doc", sourceType: "gdrive" },
      { key: "repo_url", type: "repo", sourceType: "github" },
    ];
    for (const fileType of fileTypes) {
      const url = payload[fileType.key];
      if (url) {
        await supabase.from("submission_files").insert({
          submission_id: submission_id,
          file_type: fileType.type,
          source_type: fileType.sourceType,
          source_url: url,
          metadata: previewMetadata[fileType.key],
          preview_image_url: previewMetadata[fileType.key]?.thumbnailUrl || previewMetadata[fileType.key]?.image,
          link_status: previewMetadata[fileType.key]?.error ? "invalid" : "valid",
          link_checked_at: new Date().toISOString(),
        });
      }
    }
    console.log("Previews extracted successfully");
    await supabase.from("automation_log").insert({ submission_id: submission_id, automation_type: "preview_extract", status: "completed", details: previewMetadata });
    return new Response(JSON.stringify({ success: true, previews: previewMetadata }), { headers: { "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Error: " + error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});
