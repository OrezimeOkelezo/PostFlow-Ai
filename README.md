# POSTFLOW AI

**Create. Schedule. Publish.**

POSTFLOW AI is a social media content workspace for individuals, creators and businesses. The first product phase focuses on Facebook Pages and eligible Instagram professional accounts.

## Foundation

- React + TypeScript + Vite
- Responsive application shell
- Appwrite Web SDK authentication integration
- Environment-based Appwrite project configuration
- GitHub Pages base path configured for `/PostFlow-Ai/`

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Set `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT_ID`
4. Run `npm run dev`
5. Create a production build with `npm run build`

## Appwrite setup

1. Open the dedicated POSTFLOW AI project in Appwrite Console.
2. Add a **Web** platform with hostname `localhost` for local development.
3. Add the GitHub Pages hostname `orezimeokelezo.github.io` for the deployed site.
4. Copy the project's regional API endpoint and project ID into the local `.env` file.

## GitHub Pages

Vite is configured with the repository base path `/PostFlow-Ai/`. Configure GitHub Pages to deploy the repository's built `dist` directory through GitHub Actions.

## Security

- Never commit API keys, OAuth client secrets, social access tokens or private credentials.
- Every `VITE_*` environment variable is public and bundled into browser code.
- Privileged Appwrite operations must run in Appwrite Functions using server-side environment variables.
- Configure restrictive Appwrite table/row permissions and validate access on the server.
- Social publishing must only occur after a user explicitly connects and authorizes an eligible account.

## Product roadmap

1. Authentication and workspace onboarding
2. Appwrite database schema and file storage
3. AI Content Studio
4. Meta account authorization and platform review
5. Server-side scheduling and publishing
6. Notifications, analytics and administration

**Current status:** application foundation. Social account connection and automatic publishing are not yet active.