import { Account, Client } from "appwrite";

// These two values are public Appwrite client configuration, not secrets.
// Environment variables may override them for another deployment.
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT?.trim() || "https://nyc.cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID?.trim() || "6b020f72000d66a17d23";

export const appwriteConfigured = Boolean(
  endpoint &&
  projectId &&
  !endpoint.includes("<REGION>") &&
  projectId !== "your_appwrite_project_id"
);

export const client = new Client();

if (appwriteConfigured) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);

export function appwriteConfigurationHint() {
  return "The Appwrite project settings are not configured. Add the regional endpoint and project ID to your local .env file.";
}
