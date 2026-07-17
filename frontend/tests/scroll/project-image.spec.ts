import { expect, test } from "@playwright/test";

import { prisma } from "../../lib/db";
import { gotoReady } from "./helpers";

const TEST_IMAGE = "/adaline-scenes/footer/footer-dock.webp";

test("a project image saved in the database renders on the public card", async ({ page }) => {
  const project = await prisma.project.findFirst({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  expect(project).not.toBeNull();
  if (!project) return;

  const originalImageUrl = project.imageUrl;
  const originalImageAlt = project.imageAlt;

  try {
    await prisma.project.update({
      where: { id: project.id },
      data: { imageUrl: TEST_IMAGE, imageAlt: "Database-managed project preview" },
    });

    await gotoReady(page);

    const card = page.locator(".project-card-flat").filter({ hasText: project.title });
    const image = card.locator(".article-image-photo");
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute("src", TEST_IMAGE);
    await expect(image).toHaveAttribute("alt", "Database-managed project preview");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
  } finally {
    await prisma.project.update({
      where: { id: project.id },
      data: { imageUrl: originalImageUrl, imageAlt: originalImageAlt },
    });
  }
});
