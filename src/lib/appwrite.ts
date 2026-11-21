import { Account, Client } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT?.trim();
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID?.trim();

export const appwriteConfigured = Boolean(
  endpoint &&
  projectId &&
  !endpoint.includes("<REGION>") &&
  projectId !== "your_appwrite_project_id"
);

export const client = new Client();

if (appwriteConfigured && endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);

export function appwriteConfigurationHint() {
  return "Add your Appwrite regional endpoint and project ID to a local .env file, then add localhost and orezimeokelezo.github.io as Web platforms in Appwrite.";
}
