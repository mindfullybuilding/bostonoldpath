import fs from "node:fs/promises";
import path from "node:path";
await fs.rm("dist/client", { recursive: true, force: true });
await fs.mkdir("dist/client", { recursive: true });
await fs.cp("public", "dist/client", {
  recursive: true,
  filter: (source) =>
    !path.basename(source).startsWith(".") &&
    path.basename(source) !== "GBCOM Website Working Group.pdf",
});
console.log("Built first-party HTML website in dist/client.");
