const APPS_LABEL = process.env.SETTINGS_APPS_LABEL || "Apps";

describe("Android device smoke test", () => {
  it("should open Settings and navigate to Apps", async () => {
    const appsItem = await $(
      `android=new UiScrollable(new UiSelector().scrollable(true))` +
        `.scrollIntoView(new UiSelector().text("${APPS_LABEL}"))`
    );
    await appsItem.waitForDisplayed({ timeout: 20000 });
    await appsItem.click();
    await browser.pause(2000);
  });
});
