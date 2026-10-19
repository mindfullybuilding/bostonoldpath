import { getEvents } from "../lib/events.mjs";
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const data = await getEvents();
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    return res.status(200).json(data);
  } catch {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({
      error:
        "The community calendar is temporarily unavailable. Please retry or use the calendar subscription link.",
    });
  }
}
