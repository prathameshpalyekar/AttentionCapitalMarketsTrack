import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import supabaseClient from "@supabaseClient";

const env = Deno.env;
const supabase = supabaseClient({ createSupabaseClient, env });

const API_KEY = Deno.env.get("GEMINI_API_KEY");
const API_URL = "https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=" + API_KEY;

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",  // Allow all origins
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  const payload = await req.json();

  const tweets = [];
  for (const tweet of payload.tweets) {
    const embedding = await getEmbeddingFromAPI(tweet.text);
    tweets.push({
      tweet_id: tweet.id,
      text: tweet.text,
      created_at: tweet.createdAt,
      embedding: embedding.values,
      userId: payload.userId,
    });
  }

  console.log(tweets);

  const { data, error } = await supabase
    .from("Tweets")
    .insert(tweets)

  console.log(data, error);

  return new Response(JSON.stringify({ message: "Success" }), {
    status: 200,
    headers,
  });
})



async function getEmbeddingFromAPI(text: string) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "embedding-001", // ✅ Ensure model name is correct
      content: { parts: [{ text }] }, // ✅ Fix request body format
    }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding; // This is the embedding vector
}