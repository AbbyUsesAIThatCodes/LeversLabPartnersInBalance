import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".glb": "model/gltf-binary",
};
http
  .createServer(async (req, res) => {
    try {
      const relative = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      ).replace(/^\/LeverLab\//, "/");
      const p = path.resolve(
        root,
        "." + relative + (relative.endsWith("/") ? "index.html" : ""),
      );
      if (!p.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const data = await readFile(p);
      res.writeHead(200, {
        "Content-Type": types[path.extname(p)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(data);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
    console.log(
      `http://localhost:${process.env.PORT || 4173}/LeverLab/`,
    ),
  );
