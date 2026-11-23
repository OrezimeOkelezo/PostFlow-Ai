# POSTFLOW AI

**Create. Schedule. Publish.**

POSTFLOW AI is a social media content workspace for individuals, creators and businesses. The first target platforms are Facebook Pages and eligible Instagram professional accounts.

## Current working foundation

- React 19 + TypeScript + Vite
- Responsive authentication and dashboard shell
- Appwrite email/password authentication
- Appwrite TablesDB-backed content drafts
- Private Appwrite Storage bucket for post images
- Content Studio with editable captions, hashtags, platform selection and post previews
- Save drafts and save scheduled-post records
- Filter, list and delete saved content
- GitHub Pages deployment workflow

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Set `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT_ID`
4. Run `npm run dev`
5. Create a production build with `npm run build`

## Appwrite project configuration

The project uses the dedicated POSTFLOW AI Appwrite project.

- Database ID: `postflow-main`
- Content table ID: `content_posts`
- Media bucket ID: `post-media`

The content table has row-level security. The app grants each saved row to its owner. The media bucket has file-level security and accepts JPG, JPEG, PNG and WEBP files up to 10 MB.

Add Web platforms for `localhost` and `orezimeokelezo.github.io` in Appwrite Console. Use the regional endpoint and project ID in local environment variables. These are public client settings, not API secrets.

## Important feature boundaries

- The Content Studio's “Prepare a starter draft” action creates editable starter copy. It is **not** a live AI model call.
- Saving a scheduled post stores its intended date and time. It does **not** publish automatically yet.
- Image uploads are stored privately in Appwrite Storage and linked to the saved post.
- Facebook and Instagram connection, OAuth token handling, automatic publishing, AI image generation, analytics and trend feeds are not enabled until their provider credentials, server-side functions and platform approvals are configured.

## Next production integrations

1. Configure a server-side AI provider in Appwrite Functions. Never place provider keys in `VITE_*` variables or browser code.
2. Register a Meta developer app, configure OAuth redirect URLs and request the permissions required for Facebook Pages and Instagram professional accounts.
3. Complete Meta review and any required business / platform verification before enabling multi-customer publishing.
4. Deploy a durable server-side scheduler that processes due posts, handles retries safely and records publication outcomes.
5. Add account disconnect, token expiry handling, privacy policy, data deletion and operational monitoring.

## Security

- Never commit API keys, OAuth client secrets or social access tokens.
- Every `VITE_*` environment variable is public and bundled into browser code.
- Privileged Appwrite operations must run in Appwrite Functions with server-side environment variables.
- Keep Appwrite row and file permissions restrictive.
- Social publishing must only occur after explicit account authorization and platform approval.

**Status:** The authentication foundation and Appwrite-backed Content Studio are implemented. This is not yet a production auto-publishing service.
