import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import supabaseClient from "@supabaseClient";

const env = Deno.env;
const supabase = supabaseClient({ createSupabaseClient, env });
const API_KEY = Deno.env.get("GEMINI_API_KEY");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",  // Allow all origins
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  const data = await fetchTweetsInBatches();
  const tweetTexts = data.map((tweet) => tweet.text);

  const { data: existingTopics } = await supabase
      .from("Topics")
      .select("*");

  const prompt = `
    You are given a dataset of 2500 tweets. Extract the top 10 actionable topics each with a category and a description
    that are suitable for betting, predictions, or polls. 

    Examples:
    - "Will Sonoma Crypto Launch a New Token?" (Prediction)
    - "Will Sonic.game Reach 1 Million Active Users by [Date]?" (Prediction)
    - "Will Sonic SVM (Sonic Virtual Machine) Be Adopted by a Major Blockchain Project?" (Event Speculation)
    - "Will Sonoma Crypto's Market Cap Exceed $100M by [Date]?" (Prediction)

    Focus on Sonoma Crypto (a crypto-related project), Sonic.game (a gaming platform), and Sonic SVM (a virtual machine or blockchain technology). 
    Return a JSON array with "topic" and "category" (e.g., Prediction, Poll, Event).
    Also mention top 2 contributors based on to each topic and derive their name from the contributor's username.

    Here are some tweets:
    ${tweetTexts.join("\n")}

    Avoid topics that are already in the database:
    ${existingTopics?.map((topic: any) => topic.topic).join("\n")}
    `;

  const topicsResponse = await callGeminiAPI(prompt);
  const topicRegexString = topicsResponse.replace('```', '').replace('json', '').replace('```', '');
  const topics = JSON.parse(topicRegexString);

  await supabase
    .from("Topics")
    .insert(topics);
    
  return new Response(JSON.stringify({ message: "Success", topics: topics }), {
    status: 200,
    headers,
  });
})

async function fetchTweetsInBatches(batchSize = 1000) {
  let allTweets: Array<{
    id: string;
    text: string;
    userId: string;
    createdAt: string;
    embedding: number[];
  }> = [];
  let from = 0;
  let to = batchSize - 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("Tweets")
      .select("*")
      .range(from, to);

    if (error) {
      console.error("Error fetching batch:", error);
      break;
    }

    allTweets = [...allTweets, ...data];
    
    // If less than batchSize, no more rows left
    hasMore = data.length === batchSize;
    from += batchSize;
    to += batchSize;
  }

  const { data: users, error: fetchUsersError } = await supabase
    .from("TwitterUsers")
    .select("*");
  
  console.log(fetchUsersError);

  const tweetsWithContributors = allTweets.map((tweet) => {
    const user = users.find((user: any) => user.userId === tweet.userId);
    return {
      ...tweet,
      contributor: user?.username,
    };
  });

  console.log(`Fetched ${allTweets.length} tweets`);
  return tweetsWithContributors;
}

// Function to call Gemini API
async function callGeminiAPI(prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
}