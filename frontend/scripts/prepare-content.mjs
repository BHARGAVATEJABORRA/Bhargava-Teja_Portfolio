import { writeFile } from "node:fs/promises";

// The CMS snapshot is intentionally ignored. A clean clone uses static defaults.
try {
  await writeFile(new URL("../content/portfolio-overrides.json", import.meta.url), "{}\n", { flag: "wx" });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
