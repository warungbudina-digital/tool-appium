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
    },
  ],
  logLevel: "info",
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },
};
