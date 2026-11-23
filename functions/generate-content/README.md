# POSTFLOW AI content generation function

This Appwrite Function generates an editable post draft. It never publishes content.

## Runtime
- Appwrite Node.js 22 runtime
- Entrypoint: `src/main.js`
- No server SDK dependency required; the function calls the AI provider over HTTPS.

## Required environment variables
- `OPENAI_API_KEY` (secret): server-side AI provider key.
- `OPENAI_MODEL` (optional): defaults to `gpt-4o-mini`.

Never expose these values in the frontend, a `VITE_*` variable, GitHub source, or chat.

## Invocation
Invoke while the user is signed into Appwrite. The function requires Appwrite's `x-appwrite-user-jwt` request header. Request JSON:
```json
{
  "idea": "Introduce our new service and explain who it helps",
  "brandName": "Example brand",
  "brandDescription": "The brand description",
  "tone": "Friendly and helpful",
  "platform": "instagram"
}
```

Returns JSON with `title`, `caption`, and `hashtags`. The user must review and save the result.

## Deploy
Create an Appwrite Function in the POSTFLOW AI project using Node.js 22, set the entrypoint to `src/main.js`, upload this directory as the function source, and add the environment variables above as secret/server-side variables. Add the resulting function ID to the frontend's public `VITE_APPWRITE_AI_FUNCTION_ID` setting.

This source is committed to GitHub but is not deployed until the Appwrite Function is created and its deployment is built successfully.
