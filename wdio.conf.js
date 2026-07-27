export const config = {
  runner: "local",
  hostname: process.env.APPIUM_HOST || "localhost",
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  specs: ["./tests/**/*.js"],
  maxInstances: 1,
  capabilities: [
    {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
      "appium:deviceName": process.env.ANDROID_DEVICE || "Android",
      "appium:udid": process.env.ANDROID_UDID,
      "appium:appPackage": process.env.APP_PACKAGE,
      "appium:appActivity": process.env.APP_ACTIVITY,
      "appium:noReset": true,
      // Tanpa ini test tidak deterministik: noReset membuat Appium
      // melanjutkan Settings di layar terakhir, jadi run yang sebelumnya
      // sukses mengklik "Manajemen aplikasi" meninggalkan aplikasi di
      // sub-halaman dan run berikutnya gagal menemukan item itu di daftar.
      // forceAppLaunch memaksa restart activity tanpa menghapus data.
      // Bisa dimatikan (FORCE_APP_LAUNCH=false) saat perlu menempel ke
      // aplikasi yang sudah terbuka di layar tertentu.
      "appium:forceAppLaunch": process.env.FORCE_APP_LAUNCH !== "false",
      // Server UiAutomator2 berukuran 18MB dan dikirim ke perangkat lewat
      // tunnel WireGuard, jadi default 20 detik milik Appium terlalu ketat.
      // Terukur dari VPS: ~4 detik. Kelonggaran di bawah untuk berjaga saat
      // perangkat berpindah ke jaringan seluler yang lebih lambat.
      "appium:androidInstallTimeout": 120000,
      "appium:uiautomator2ServerInstallTimeout": 120000,
      "appium:adbExecTimeout": 60000,
    },
  ],
  logLevel: "info",
  waitforTimeout: 10000,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 180000,
  },
};
