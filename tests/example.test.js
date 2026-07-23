describe("Android device smoke test", () => {
  it("should open Settings and navigate to Apps", async () => {
    const appsItem = await $("//*[@text=\"Apps\"]");
    await appsItem.waitForDisplayed({ timeout: 10000 });
    await appsItem.click();
    await browser.pause(1000);
  });
});
