This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Mobile App Shell

NexusArchive now includes a Capacitor-based native shell for internal mobile
beta builds.

### Mobile environment

Set these values before syncing or opening the native projects:

```bash
NEXT_PUBLIC_SITE_URL=https://nexusarchive.lol
CAPACITOR_SERVER_URL=https://nexusarchive.lol
CAPACITOR_ALLOWED_HOSTS=nexusarchive.lol
CAPACITOR_APP_ID=lol.nexusarchive
CAPACITOR_APP_NAME=NexusArchive
```

`CAPACITOR_SERVER_URL` is the hosted site that the native shell loads at
runtime. If it is missing, Capacitor falls back to the local `mobile-shell/`
placeholder page.

### Mobile commands

```bash
npm run mobile:add:android
npm run mobile:add:ios
npm run mobile:sync
npm run mobile:build:android:release
npm run mobile:open:android
npm run mobile:open:ios
```

### Mobile assets

Use the source images in `resources/` for the native launcher icon and splash
art when refreshing platform assets.

### Packaging notes

Android release builds in this repo use Java 21 because Capacitor 7 generates
native Gradle settings with `JavaVersion.VERSION_21`.

The full packaging notes, including keystore setup and Mac steps for iPhone,
live in [docs/mobile-packaging.md](docs/mobile-packaging.md).

## Scanner Storage

Scanner uploads use Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured.
Without that token, local development falls back to `data/scanner/` or the
configured `CARD_ARCHIVE_DIR`. Production Vercel deployments should always have
Blob configured so scan images survive across serverless executions.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
