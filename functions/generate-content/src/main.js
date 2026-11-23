export default async ({ req, res, log, error }) => {
  try {
    const jwt = req.headers["x-appwrite-user-jwt"];
    if (!jwt) return res.json({ error: "Sign in again to use AI generation." }, 401);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.json({ error: "AI generation is not configured yet. Ask the workspace administrator to add the server-side AI provider key." }, 503);

    const body = req.bodyJson || {};
    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    const brandName = typeof body.brandName === "string" ? body.brandName.trim().slice(0, 120) : "";
    const description = typeof body.brandDescription === "string" ? body.brandDescription.trim().slice(0, 1200) : "";
    const tone = typeof body.tone === "string" ? body.tone.trim().slice(0, 80) : "Friendly and helpful";
    const platform = ["facebook", "instagram"].includes(body.platform) ? body.platform : "instagram";

    if (idea.length < 8 || idea.length > 1500) {
      return res.json({ error: "Describe your post idea in 8 to 1,500 characters." }, 400);
    }

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are POSTFLOW AI, a social content writing assistant. Produce truthful, useful, original social media copy. Do not invent product facts, prices, reviews, claims, discounts or results. Return valid JSON with title, caption, hashtags (array of strings). Keep hashtags relevant and do not include unsupported claims."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Create one polished social media post draft. Do not publish it.",
              platform,
              idea,
              brandName,
              brandDescription: description,
              writingTone: tone,
              requirements: [
                "Write a clear opening hook.",
                "Keep the caption readable and platform-appropriate.",
                "Use a helpful call to action only when natural.",
                "Return 3 to 8 relevant hashtags.",
                "Do not claim this post is trending or guaranteed to perform."
              ]
            })
          }
        ]
      })
    });

    const payload = await completion.json();
    if (!completion.ok) {
      error("AI provider request failed: " + JSON.stringify(payload).slice(0, 1000));
      return res.json({ error: "The AI provider could not generate this post. Please try again later." }, 502);
    }

    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) return res.json({ error: "The AI provider returned an empty response." }, 502);

    let draft;
    try { draft = JSON.parse(raw); }
    catch { return res.json({ error: "The AI provider returned an unreadable draft. Please try again." }, 502); }

    const title = typeof draft.title === "string" ? draft.title.slice(0, 180) : "New social post";
    const caption = typeof draft.caption === "string" ? draft.caption.slice(0, 5000) : "";
    const hashtags = Array.isArray(draft.hashtags)
      ? draft.hashtags.filter(tag => typeof tag === "string").slice(0, 8).map(tag => tag.startsWith("#") ? tag : "#" + tag.replace(/^#+/, ""))
      : [];

    if (!caption) return res.json({ error: "The AI provider returned an empty caption." }, 502);
    log("Generated a content draft for an authenticated user.");
    return res.json({ title, caption, hashtags });
  } catch (err) {
    error(err);
    return res.json({ error: "Unexpected generation error. Please try again." }, 500);
  }
};
