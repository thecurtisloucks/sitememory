import path from "node:path";
import { expect, test } from "@playwright/test";

const beforeImage = path.resolve("demo/images/desk-before.jpg");
const afterImage = path.resolve("demo/images/desk-after.jpg");

test("primary room memory workflow works from upload through assistant", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New room" }).first().click();
  await page.getByLabel("Room name").fill("E2E Office");
  await page
    .getByLabel(/Description/)
    .fill("Automated primary demonstration flow");
  await page.getByRole("button", { name: "Create room" }).click();
  await page.getByRole("link", { name: /E2E Office/ }).click();

  await page.getByLabel("Object type to track").fill("desk lamp");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "Save tracking list" }).click();
  await expect(page.getByText(/Tracking list saved/)).toBeVisible();

  await page.locator('input[type="file"]').nth(1).setInputFiles(beforeImage);
  await expect(page).toHaveURL(/\/scans\//);
  await page.getByRole("button", { name: "Analyze with AI" }).click();
  await expect(
    page.getByRole("button", { name: "headphones", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "coffee mug", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to room" }).click();

  await page.locator('input[type="file"]').nth(1).setInputFiles(afterImage);
  await page.getByRole("button", { name: "Analyze with AI" }).click();
  await expect(
    page.getByRole("button", { name: "notebook", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to room" }).click();

  await page.getByRole("button", { name: "Compare scans" }).click();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "What changed?" }),
  ).toBeVisible();
  await expect(page.getByText("UNCHANGED").first()).toBeVisible();
  await page.getByRole("link", { name: "Back to room" }).click();

  await page.getByRole("button", { name: "Ask SiteMemory" }).click();
  await page
    .getByLabel("Question for SiteMemory")
    .fill("Where did I last see my headphones?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page.getByText("Supporting visual evidence")).toBeVisible();
  await expect(page.getByText("MOCK")).toBeVisible();
});

test("multiple rooms remain usable at a mobile viewport", async ({
  page,
  request,
}) => {
  const createdIds: string[] = [];
  for (const name of ["Mobile Office", "Mobile Workshop"]) {
    const response = await request.post("http://127.0.0.1:3101/api/rooms", {
      data: { name },
    });
    createdIds.push((await response.json()).data.id);
  }
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByText("Mobile Office")).toBeVisible();
    await expect(page.getByText("Mobile Workshop")).toBeVisible();
    const width = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(width.body).toBeLessThanOrEqual(width.viewport);
    await page.getByRole("link", { name: /Mobile Office/ }).click();
    await expect(
      page.getByRole("button", { name: "Ask SiteMemory" }),
    ).toBeVisible();
    await expect(page.getByText("Take photo")).toBeVisible();
  } finally {
    await Promise.all(
      createdIds.map((id) =>
        request.delete(`http://127.0.0.1:3101/api/rooms/${id}`),
      ),
    );
  }
});
