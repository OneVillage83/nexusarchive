import process from "node:process";

import { google } from "googleapis";

import "./lib/load-env";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getRedirectUri() {
  return (
    process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI?.trim() ||
    "http://127.0.0.1:8787/oauth2callback"
  );
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    getRequiredEnv("GOOGLE_DRIVE_OAUTH_CLIENT_ID"),
    getRequiredEnv("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET"),
    getRedirectUri(),
  );
}

function getCodeFromArgs(args: string[]) {
  const match = args.find((arg) => arg.startsWith("--code="));
  return match ? match.slice("--code=".length).trim() : null;
}

async function printAuthUrl() {
  const oauth2Client = createOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_SCOPE],
  });

  console.log("Open this URL in your browser and approve Drive access:");
  console.log(authUrl);
  console.log("");
  console.log(
    `After Google redirects you to ${getRedirectUri()}, copy the full "code" value and run:`,
  );
  console.log('npm run google-drive:oauth -- --code="PASTE_CODE_HERE"');
}

async function exchangeCode(code: string) {
  const oauth2Client = createOAuthClient();
  const tokenResponse = await oauth2Client.getToken(code);
  const refreshToken = tokenResponse.tokens.refresh_token ?? null;

  console.log(
    JSON.stringify(
      {
        refreshToken,
        accessToken: tokenResponse.tokens.access_token ?? null,
        expiryDate: tokenResponse.tokens.expiry_date ?? null,
      },
      null,
      2,
    ),
  );

  if (!refreshToken) {
    console.log("");
    console.log(
      "Google did not return a refresh token. Try again with a fresh consent prompt or revoke the app and re-authorize.",
    );
    return;
  }

  console.log("");
  console.log("Add this to your environment:");
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`);
}

async function main() {
  const args = process.argv.slice(2);
  const code = getCodeFromArgs(args);

  if (code) {
    await exchangeCode(code);
    return;
  }

  await printAuthUrl();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
