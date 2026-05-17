# BinHub

A secure, self-hosted Over-The-Air (OTA) distribution platform for mobile applications (APK, AAB, and IPA). Designed for development teams to easily distribute builds to QA testers and stakeholders.

## Features

- **Admin Dashboard:**
  - **Application Management:** Add and manage multiple Android and iOS applications.
  - **Automated Metadata Extraction:** Automatically extracts app name, package ID, version, and build number from uploaded APK/IPA files.
  - **Icon Extraction:** Automatically parses and sets the app icon from the binary.
  - **Version Control:** Manage multiple builds with changelogs and download tracking.
  - **Distribution Groups:** Organize users into groups for bulk access management.
  - **Restricted Access:** Granular control over which users or groups can see specific applications.
- **Public Sharing:**
  - **Secure Links:** Generate shareable, tokenized links for specific versions.
  - **Password Protection:** Optional password protection for public download links.
  - **Public Landing Page:** Professional landing page for external testers with one-click install support.
- **User (QA) Dashboard:**
  - **Modern Interface:** Minimalist design with Dark Mode support and responsive layout.
  - **QR Code Installation:** Scan a QR code to quickly install builds on mobile devices.
  - **One-Click Installation:**
    - **Android:** Direct APK download.
    - **iOS:** Wireless installation using the `itms-services` protocol.
- **Enterprise Ready:**
  - **CI/CD Integration:** Automated build uploads via a secure API with API keys.
  - **Webhook Support:** Outgoing webhooks for Slack, Discord, or custom services.
  - **Telegram Integration:** Native, richly-formatted notifications for Telegram groups.
  - **Storage Retention:** Automatically clean up old builds to save disk space.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database:** SQLite (`better-sqlite3`) with Drizzle ORM
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Theme:** `next-themes` (Dark/Light/System)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd BinHub
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Run the application:**

    ```bash
    npm run dev
    ```

    The app will be available at `http://localhost:3000`.

## Docker Deployment

### Run with Docker Compose (Recommended)

To run the application with full persistence:

```bash
docker-compose up -d
```

### Run with Docker CLI

Ensure you map the volumes for the database and uploads directory:

```bash
docker run -d \
  --name binhub \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  sophoun/binhub:latest
```

### Initial Setup

On the first run, the system initializes a default administrator account:

- **Username:** `admin`
- **Password:** `admin123`

**Note:** Please change this password immediately in the Admin Dashboard or create a new admin user.

## CI/CD & SDK Integration Guide

### 1. Automated Uploads via API

Automate build delivery from your CI/CD pipeline (GitHub Actions, GitLab CI, etc.).

**Endpoint:** `POST /api/external/upload`
**Header:** `X-API-Key: YOUR_API_KEY`

#### Request Parameters (FormData)

| Field | Type | Description |
| :--- | :--- | :--- |
| `file` | File | The `.apk` or `.ipa` binary file. |
| `appId` | String | The ID of the application (found in the Admin Dashboard "ID" column). |
| `changelog` | String | Release notes for this version. |

#### GitHub Actions Example

```yaml
- name: Upload to BinHub
  run: |
    curl -X POST https://your-binhub-url.com/api/external/upload \
      -H "X-API-Key: ${{ secrets.BINHUB_API_KEY }}" \
      -F "file=@app-release.apk" \
      -F "appId=1" \
      -F "changelog=CI Build: ${{ github.event.head_commit.message }}"
```

### 2. In-App Update API (SDK)

Allow your mobile apps to check for new versions automatically on startup.

**Endpoint:** `GET /api/external/check-update`
**Header:** `X-API-Key: YOUR_API_KEY`

#### Query Parameters

| Parameter | Description |
| :--- | :--- |
| `appId` | (Preferred) The unique ID of the app (from Admin Dashboard). |
| `packageName` | The bundle identifier or package name (fallback if `appId` not provided). |
| `platform` | (Optional) `android` or `ios`. Required if using `packageName`. |

#### Response Format

```json
{
  "success": true,
  "app": { "id": 1, "name": "QA Runner", "package_name": "com.company.app", "platform": "android" },
  "latest_version": {
    "version_number": "1.2.0",
    "build_number": "104",
    "changelog": "Bug fixes",
    "install_url": "itms-services://...",
    "download_url": "https://..."
  }
}
```

## Notifications Setup

### Telegram Integration

1. Create a bot via [@BotFather](https://t.me/botfather).
2. Add the bot to your group and get your `chat_id`.
3. In BinHub **Settings**, add a new **Outgoing Webhook**:
   `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>`
4. BinHub will automatically detect the Telegram URL and send richly formatted Markdown messages.

### Custom Webhooks

For Slack or custom integrations, BinHub sends a standard JSON payload:

```json
{
  "event": "new_version",
  "data": {
    "app_name": "QA App",
    "version": "1.0.0",
    "platform": "android",
    "changelog": "Notes here..."
  }
}
```

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for development teams.
