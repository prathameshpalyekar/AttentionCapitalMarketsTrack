import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import supabaseClient from "@supabaseClient";

const env = Deno.env;
const supabase = supabaseClient({ createSupabaseClient, env });

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

  const { name, username } = await req.json();

  const { data } = await supabase
    .from("Users")
    .select("*")
    .eq("username", username)
    .single();

  if (!data) {
    const { data: newUser, error: newUserError } = await supabase
      .from("Users")
      .insert({ name, username })
      .select("*")
      .single();

    return new Response(JSON.stringify({ message: "Success", user: newUser }), {
      status: 200,
      headers,
    });
  }

  return new Response(JSON.stringify({ message: "Success", user: data }), {
    status: 200,
    headers,
  });
});
