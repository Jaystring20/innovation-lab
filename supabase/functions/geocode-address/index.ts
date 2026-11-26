import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Turns a typed address into latitude/longitude using the Google Geocoding API.
 *
 * Used when pricing a kit delivery with GIG Logistics: the price call needs the
 * school's coordinates, and a wrong pin means a wrong price and a failed
 * delivery. The response says how precise the match is, so callers can refuse
 * a rough match instead of quoting on it.
 *
 * Organizer-only. verify_jwt is off so the CORS preflight and a clean 401 are
 * handled here; the caller's JWT is still verified and the role checked against
 * public.profiles. The Google key is read from the GOOGLE_GEOCODING_API_KEY
 * secret and is never returned to the caller.
 *
 * Request:  POST { "address": "..." }
 * Response: { latitude, longitude, formatted_address, location_type, precise, partial_match }
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// ROOFTOP and RANGE_INTERPOLATED are street-level matches. GEOMETRIC_CENTER and
// APPROXIMATE are a whole road or area, which is too rough for a delivery.
const PRECISE_TYPES = new Set(["ROOFTOP", "RANGE_INTERPOLATED"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Sign in as an organizer to geocode addresses." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const googleKey = Deno.env.get("GOOGLE_GEOCODING_API_KEY");
  if (!googleKey) return json({ error: "Geocoding is not configured." }, 500);

  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Invalid session." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profile?.role !== "organizer" && profile?.role !== "super_admin") {
    return json({ error: "Only organizers can geocode addresses." }, 403);
  }

  let address: string;
  try {
    const body = await req.json();
    address = String(body.address ?? "").trim();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (address.length < 5 || address.length > 300) {
    return json({ error: "Enter a full address (5 to 300 characters)." }, 400);
  }

  const params = new URLSearchParams({
    address,
    components: "country:NG", // GIG serves Nigeria; keeps matches inside the country
    key: googleKey,
  });

  let data: any;
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    data = await res.json();
  } catch {
    return json({ error: "Could not reach the geocoding service. Try again." }, 502);
  }

  if (data.status === "ZERO_RESULTS") {
    return json({ error: "No match found. Check the address, or enter the coordinates by hand." }, 404);
  }
  if (data.status !== "OK" || !data.results?.length) {
    // Do not pass Google's error message through: it can echo the key's project details.
    return json({ error: "Geocoding failed. Try again or enter the coordinates by hand." }, 502);
  }

  const best = data.results[0];
  const locationType: string = best.geometry?.location_type ?? "UNKNOWN";

  return json({
    latitude: best.geometry.location.lat,
    longitude: best.geometry.location.lng,
    formatted_address: best.formatted_address,
    location_type: locationType,
    precise: PRECISE_TYPES.has(locationType) && !best.partial_match,
    partial_match: Boolean(best.partial_match),
  });
});
