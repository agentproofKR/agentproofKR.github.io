import { createServer } from "node:http";

const port = Number(process.env.MOCK_SURVEY_PORT ?? 8787);
const seenKeys = new Map();

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    writeJson(response, 204, null);
    return;
  }
  if (request.method !== "POST" || request.url !== "/survey-submit") {
    writeJson(response, 404, { ok: false, code: "NOT_FOUND" });
    return;
  }

  const body = await readBody(request);
  if (body.length > 80_000) {
    writeJson(response, 413, { ok: false, code: "PAYLOAD_TOO_LARGE" });
    return;
  }

  try {
    const payload = JSON.parse(body);
    if (payload.honeypot) {
      writeJson(response, 400, { ok: false, code: "HONEYPOT" });
      return;
    }
    if (payload.kind === "quick_diagnosis") {
      if (seenKeys.has(payload.idempotencyKey)) {
        writeJson(response, 200, {
          ok: true,
          status: "duplicate",
          sessionId: seenKeys.get(payload.idempotencyKey),
        });
        return;
      }

      seenKeys.set(payload.idempotencyKey, payload.sessionId);
      writeJson(response, 201, {
        ok: true,
        status: "quick_diagnosis_stored",
        sessionId: payload.sessionId,
      });
      return;
    }

    if (!payload.consents?.age14OrOlder || !payload.consents?.surveyProcessing) {
      writeJson(response, 400, { ok: false, code: "MISSING_REQUIRED_CONSENT" });
      return;
    }

    if (seenKeys.has(payload.idempotencyKey)) {
      writeJson(response, 200, {
        ok: true,
        status: "duplicate",
        sessionId: seenKeys.get(payload.idempotencyKey),
      });
      return;
    }

    seenKeys.set(payload.idempotencyKey, payload.sessionId);
    writeJson(response, 201, { ok: true, status: "stored", sessionId: payload.sessionId });
  } catch {
    writeJson(response, 400, { ok: false, code: "INVALID_JSON" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock AgentProof survey backend listening on http://127.0.0.1:${port}/survey-submit`);
});

function writeJson(response, status, body) {
  response.writeHead(status, {
    "access-control-allow-origin": "http://127.0.0.1:3000",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(body === null ? "" : JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}
