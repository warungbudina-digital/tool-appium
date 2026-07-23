# tool-appium

Setup Appium + WebdriverIO untuk automasi Android (menggantikan pendekatan
manual `adb shell` + screenshot yang dipakai sebelumnya).

## Requirement

- Node.js `^20.19.0 || ^22.12.0 || >=24.0.0` (dipasang di sini lewat `nvm`)
- Android SDK (`ANDROID_HOME`) + JDK 9+ (`JAVA_HOME`) untuk menjalankan driver UiAutomator2
- Device Android dengan USB debugging aktif (atau tersambung lewat `adb connect <ip>:<port>` seperti setup WireGuard yang sudah ada)

## Instalasi

\`\`\`bash
npm install
\`\`\`

Driver UiAutomator2 sudah termasuk di \`devDependencies\` (\`appium-uiautomator2-driver\`).
Kalau perlu install ulang manual:

\`\`\`bash
npx appium driver install uiautomator2
\`\`\`

## Konfigurasi

Salin \`.env.example\` ke \`.env\` dan sesuaikan:

\`\`\`bash
cp .env.example .env
\`\`\`

Isi \`ANDROID_UDID\` dengan device id dari \`adb devices\` (mis. \`10.66.66.2:44767\`
untuk device yang tersambung lewat tunnel WireGuard).

## Menjalankan

Jalankan Appium server di satu terminal:

\`\`\`bash
npm run appium
\`\`\`

Jalankan test di terminal lain:

\`\`\`bash
npm test
\`\`\`

## Struktur

- \`wdio.conf.js\` - konfigurasi WebdriverIO (runner, capabilities, framework)
- \`tests/\` - test spec (Mocha, format BDD)
- \`.env.example\` - template variabel environment per device/app target

## Referensi

Dokumentasi resmi: https://appium.io/docs/en/latest/
