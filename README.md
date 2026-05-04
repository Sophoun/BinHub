# BinHub

A secure, self-hosted Over-The-Air (OTA) distribution platform for mobile applications (APK and iPA). Designed for QA teams to easily access and install builds directly on their devices.

## Features

- **Admin Dashboard:**
  - **Application Management:** Add multiple Android and iOS applications.
  - **Version Control:** Upload new APK or IPA builds with version numbers, build numbers, and changelogs.
  - **User Management:** Create accounts for QA testers.
  - **Restricted Access:** Assign specific applications to specific users so they only see what they need to test.
- **User (QA) Dashboard:**
  - **Clean Interface:** A minimalist shadcn-inspired grid view of available applications.
  - **One-Click Installation:** 
    - **Android:** Direct APK download.
    - **iOS:** Wireless "Install" using the `itms-services` protocol (auto-generated manifests).
- **Secure & Lightweight:**
  - **Authentication:** JWT-based secure sessions.
  - **Database:** Powered by SQLite for zero-config data storage.
  - **Local Storage:** Files are stored locally on the server filesystem.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database:** SQLite (`better-sqlite3`)
- **Styling:** Tailwind CSS 4 (shadcn/ui aesthetic)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd open_ota
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

### Initial Setup

On the first run, accessing the login page will automatically initialize a default administrator account:

- **Username:** `admin`
- **Password:** `admin123`

**Important:** It is highly recommended to change this password or create a new admin user and delete the default one after your first login.

## Usage Guide

### For Administrators

1.  **Login** using the admin credentials.
2.  Navigate to the **Apps** tab and click "Add App" to register a new application.
3.  Click "New Version" on an app card to upload an APK or IPA file.
4.  Navigate to the **Users** tab to create accounts for your QA team.
5.  Click "Assign Apps" next to a user to grant them access to specific applications.

### For QA Users

1.  **Login** with your assigned credentials.
2.  View the list of applications assigned to you.
3.  Click **Download** (Android) or **Install** (iOS) to get the latest build.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for QA teams.
