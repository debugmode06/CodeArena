import http from "node:http";

const PORT = Number(process.env.CITRON_PORT || process.env.PORT || 2358);
const HOST = process.env.CITRON_HOST || "0.0.0.0";

const decodeBase64 = (str) => {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return str;
  }
};

const encodeBase64 = (str) => {
  if (typeof str !== "string") str = String(str ?? "");
  return Buffer.from(str, "utf-8").toString("base64");
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Judge-Token");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoints
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/about")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ready", name: "pomelo-mock-citron", version: "1.0.0" }));
    return;
  }

  // Submission handler
  if (req.method === "POST" && url.pathname === "/submissions") {
    let bodyText = "";
    req.on("data", (chunk) => {
      bodyText += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(bodyText || "{}");
        const submissions = payload.submissions || [];
        const isBase64 = url.searchParams.get("base64_encoded") === "true";

        console.log(`[Mock Citron] Received submission batch with ${submissions.length} test cases`);

        const testcases = submissions.map((sub, index) => {
          const expectedOutput = isBase64 ? decodeBase64(sub.expected_output) : sub.expected_output;
          // In mock mode, we produce the expected output to simulate passing tests
          const stdout = isBase64 ? encodeBase64(expectedOutput || "OK\n") : (expectedOutput || "OK\n");

          return {
            index,
            status: {
              id: 3,
              description: "Accepted",
            },
            stdout,
            stderr: "",
            cpu_time_ms: 15,
            wall_time_ms: 25,
            memory_kb: 1024,
          };
        });

        const responseData = {
          compile: {
            output: "",
            skipped: true,
            success: true,
          },
          testcases,
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(responseData));
      } catch (err) {
        console.error("[Mock Citron] Error processing submission:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\x1b[33mℹ Port ${PORT} already in use. Assuming Citron/mock is already running.\x1b[0m`);
    process.exit(0);
  } else {
    console.error("[Mock Citron] Server error:", err);
    process.exit(1);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\x1b[32m✔ Mock Citron running on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}\x1b[0m`);
  console.log(`  (Simulates code execution & passes test cases in local development without Docker)`);
});
