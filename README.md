# PT XYZ Mobile Web

Frontend application for the PT XYZ machine maintenance management system, built with **Ionic + Angular 18**. Runs as a web app and can be built as a native Android/iOS app via Capacitor.

## Requirements

Make sure the following are installed on your machine before proceeding:

- **Node.js** v18 or higher (https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **Git**

> The backend API (`champiro-api`) must be running before you can use this app. Set it up first.

---

## Setup Steps

### 1. Clone the repository

```bash
git clone <repository-url>
cd champiro-mobileweb
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required due to Angular 18 peer dependency version constraints.

### 3. Configure the API URL

Open `src/environments/environment.ts` and set `apiUrl` to point to your running backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'   // change this to your API server address
};
```

> If the API is running on a different machine on the same network, replace `localhost` with that machine's local IP address (e.g. `http://192.168.1.10:8000/api`).

### 4. Start the development server

```bash
npm start
```

The app will be available at: **http://localhost:4200**

---

## Login

Use one of the accounts seeded by the API (password is `password` for all):

| Role       | Username       |
|------------|----------------|
| Management | Management     |
| Technician | Technician0001 |
| Foreman    | Foreman0001    |
| Tailor     | Tailor0001     |

---

## Build for Production (Web)

```bash
npm run build
```

Output is placed in the `www/` directory.

---

## Build for Android

> Requires Android Studio and Android SDK to be installed.

```bash
npm run build
npx cap sync android
npx cap open android
```

Then build and run via Android Studio.

## Build for iOS

> Requires Xcode and macOS.

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Then build and run via Xcode.


