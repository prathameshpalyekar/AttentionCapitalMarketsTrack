import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Scraper, SearchMode } from "npm:agent-twitter-client";

console.log("Hello from Functions!", Scraper, SearchMode);

Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Tweets Fetched" }),
    { headers: { "Content-Type": "application/json" } },
  )
});