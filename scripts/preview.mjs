import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { getEvents } from "../lib/events.mjs";
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};
http
  .createServer(async (req, res) => {
    try {
      if (req.url.split("?")[0] === "/api/events") {
        try {
          const data = await getEvents();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Calendar unavailable" }));
        }
        return;
      }
      const name = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (
        name.split("/").some((part) => part.startsWith(".")) ||
        name.endsWith("GBCOM Website Working Group.pdf")
      )
        throw new Error("Private reference");
      const file = path.resolve("public", name === "/" ? "home.html" : "." + name);
      if (!file.startsWith(path.resolve("public") + path.sep)) throw new Error("Path");
      const data = await fs.readFile(file);
      res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () => console.log("MCGB preview http://127.0.0.1:4173"));
