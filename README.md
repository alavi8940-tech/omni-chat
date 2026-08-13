# OmniChat

OmniChat is a mobile-first, local-first chat client for OpenAI-compatible APIs. One interface supports streaming text, image generation, text-to-speech, and video generation.

## Highlights

- Pure black UI with responsive mobile navigation
- English and Persian typography using Inter and Vazirmatn
- Automatic model classification for text, image, audio, and video
- Searchable and filterable model library
- Streaming Markdown with GitHub Flavored Markdown
- Request cancellation, timeout handling, retry, copy, download, and delete controls
- Automatic right-to-left direction for Persian and Arabic messages
- Configurable system prompt, temperature, voice, and image size
- LocalStorage persistence with JSON backup and restore
- Capacitor 6 Android packaging
- GitHub Actions builds for Web, GitHub Pages, and Android APK

## API compatibility

OmniChat calls these endpoints:

| Mode | Endpoint |
| --- | --- |
| Models | `GET /v1/models` |
| Text | `POST /v1/chat/completions` |
| Image | `POST /v1/images/generations` |
| Audio | `POST /v1/audio/speech` |
| Video | `POST /v1/video/generations` |

Authentication, when a key is provided:

```http
Authorization: Bearer YOUR_API_KEY
```

The provider must permit browser requests through CORS for the GitHub Pages build. Android WebView requests also depend on the provider's TLS and network policy.

Video APIs are less standardized than the other endpoints. OmniChat supports direct URL, base64, and binary video responses. When the initial response contains a job ID, it also polls `GET /v1/video/generations/{id}` for up to five minutes. Providers using a different status endpoint need a small adapter in `src/hooks/useApi.js`.

## GitHub setup and build

1. Push this directory to the root of a GitHub repository.
2. Open **Settings → Pages** and select **GitHub Actions** as the source.
3. Push to `main`.
4. Open the repository’s **Actions** tab and select the latest **Build OmniChat** run.

The workflow produces:

- `OmniChat-Web` artifact
- `OmniChat-APK` artifact containing `OmniChat-debug.apk`
- A GitHub Pages deployment from `main`

To publish the APK as a GitHub Release asset, create and push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The tagged workflow creates release notes and attaches `OmniChat-debug.apk`.

## Local development

Local installation is optional; GitHub Actions performs the official builds.

```bash
npm install
npm run dev
```

Production web build:

```bash
npm run build
```

Android project:

```bash
npm run build:android
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

Requirements for Android builds are Node.js 22 and Java 17.

## GitHub Pages base path

The default Vite base is `/repo-name/`, matching the requested configuration. In GitHub Actions, `VITE_BASE_PATH` automatically changes it to the actual repository name. Capacitor builds use the relative base `./`.

## Privacy and storage

There is no OmniChat backend, user account, or analytics service. Settings and chats are stored in browser LocalStorage. The API key is stored as plain local application data, so do not use OmniChat on an untrusted or shared device.

Large base64 media can exceed LocalStorage quotas. OmniChat shows a warning when persistence fails; download important generated media and export backups regularly.

## Important production note

The workflow creates a debug APK so it can build without signing secrets. For Play Store or public production distribution, configure an Android signing keystore in GitHub Secrets and add an `assembleRelease` signing step.
