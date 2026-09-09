import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function checkLinkValidity(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    return response.ok;
  } catch {
    try {
      const response = await fetch(url, { redirect: "follow" });
      return response.ok;
    } catch {
      return false;
    }
  }
}

function analyzeContent(payload: any) {
  const text = [payload.video_url, payload.doc_url, payload.repo_url, payload.notes].filter(Boolean).join(" ");
  const words = text.split(/\s+/).filter((w: string) => w.length > 0);
  const wordCount = words.length;
  const notes = payload.notes || "";
  const hasStructuredNotes = /[\n•\-*]|[0-9]+\./.test(notes);
  const linkCount = [payload.video_url, payload.doc_url, payload.repo_url].filter(Boolean).length;
  return { wordCount, hasStructuredNotes, linkCount };
}

function calculateQualityScore(analysis: any, linkValidity: any): number {
  let score = 50;
  if (analysis.wordCount >= 100 && analysis.wordCount <= 500) score += 15;
  else if (analysis.wordCount >= 50) score += 8;
  if (analysis.linkCount >= 2) score += 15;
  else if (analysis.linkCount === 1) score += 8;
  const validLinks = Object.values(linkValidity).filter((v: any) => v).length;
  const totalLinks = Object.values(linkValidity).length;
  if (totalLinks > 0) {
    const validityPercentage = (validLinks / totalLinks) * 100;
    if (validityPercentage === 100) score += 15;
    else if (validityPercentage >= 66) score += 8;
  }
  if (analysis.hasStructuredNotes) score += 10;
  return Math.min(100, score);
}

function generateSummary(payload: any, maxWords: number = 50): string {
  const text = payload.notes || "";
  if (!text) return "No submission notes provided.";
  const words = text.split(/\s+/);
  const summary = words.slice(0, maxWords).join(" ");
  return summary.length < text.length ? summary + "..." : summary;
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
    console.log("Checking link validity...");
    const linkValidity = {};
    const brokenLinks = [];
    if (payload.video_url) {
      const isValid = await checkLinkValidity(payload.video_url);
      linkValidity.video_url = isValid;
      if (!isValid) brokenLinks.push(payload.video_url);
    }
    if (payload.doc_url) {
      const isValid = await checkLinkValidity(payload.doc_url);
      linkValidity.doc_url = isValid;
      if (!isValid) brokenLinks.push(payload.doc_url);
    }
    if (payload.repo_url) {
      const isValid = await checkLinkValidity(payload.repo_url);
      linkValidity.repo_url = isValid;
      if (!isValid) brokenLinks.push(payload.repo_url);
    }
    console.log("Analyzing content...");
    const contentAnalysis = analyzeContent(payload);
    console.log("Calculating quality score...");
    const qualityScore = calculateQualityScore(contentAnalysis, linkValidity);
    const autoSummary = generateSummary(payload);
    const analysisResult = {
      link_validity: linkValidity,
      broken_links: brokenLinks,
      word_count: contentAnalysis.wordCount,
      link_count: contentAnalysis.linkCount,
      structured_notes: contentAnalysis.hasStructuredNotes,
      quality_score: qualityScore,
      auto_summary: autoSummary,
      analyzed_at: new Date().toISOString(),
    };
    console.log("Saving analysis results...");
    await supabase.from("submissions").update({ analysis_metadata: analysisResult, analysis_run_at: new Date().toISOString() }).eq("id", submission_id);
    await supabase.from("assessment_results").insert({ submission_id: submission_id, assessment_type: "auto_analysis", status: "completed", result: analysisResult, completed_at: new Date().toISOString() });
    const fileUpdates = [];
    if (payload.video_url) fileUpdates.push({ source_url: payload.video_url, link_status: linkValidity.video_url ? "valid" : "invalid" });
    if (payload.doc_url) fileUpdates.push({ source_url: payload.doc_url, link_status: linkValidity.doc_url ? "valid" : "invalid" });
    if (payload.repo_url) fileUpdates.push({ source_url: payload.repo_url, link_status: linkValidity.repo_url ? "valid" : "invalid" });
    for (const update of fileUpdates) {
      await supabase.from("submission_files").update({ link_status: update.link_status, link_checked_at: new Date().toISOString() }).eq("submission_id", submission_id).eq("source_url", update.source_url);
    }
    console.log("Analysis completed successfully");
    await supabase.from("automation_log").insert({ submission_id: submission_id, automation_type: "analysis", status: "completed", details: { quality_score: qualityScore, broken_links_count: brokenLinks.length } });
    return new Response(JSON.stringify({ success: true, analysis: analysisResult }), { headers: { "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Error: " + error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});
