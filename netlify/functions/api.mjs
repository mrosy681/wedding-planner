import { getStore } from "@netlify/blobs";

// Helper: parse body safely
async function parseBody(req) {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// Valid store names (each is a "table")
const VALID_STORES = ["guests", "vendors", "expenses", "gifts", "hotels", "categories"];

export default async (req, context) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.replace("/api/", "").split("/");
  const storeName = pathParts[0];
  const recordId = pathParts[1] || null;

  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (!VALID_STORES.includes(storeName)) {
    return new Response(JSON.stringify({ error: "Invalid store" }), { status: 400, headers });
  }

  const store = getStore({ name: `wedding-${storeName}`, consistency: "strong" });

  try {
    // LIST all records
    if (req.method === "GET" && !recordId) {
      const { blobs } = await store.list();
      const records = await Promise.all(
        blobs.map(async (b) => {
          const val = await store.get(b.key, { type: "json" });
          return val;
        })
      );
      return new Response(JSON.stringify(records.filter(Boolean)), { status: 200, headers });
    }

    // GET single record
    if (req.method === "GET" && recordId) {
      const record = await store.get(recordId, { type: "json" });
      if (!record) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
      return new Response(JSON.stringify(record), { status: 200, headers });
    }

    // CREATE record
    if (req.method === "POST") {
      const body = await parseBody(req);
      const id = body.id || `${storeName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const record = { ...body, id, createdAt: new Date().toISOString() };
      await store.setJSON(id, record);
      return new Response(JSON.stringify(record), { status: 201, headers });
    }

    // UPDATE record
    if (req.method === "PUT" && recordId) {
      const body = await parseBody(req);
      const existing = await store.get(recordId, { type: "json" });
      const record = { ...(existing || {}), ...body, id: recordId, updatedAt: new Date().toISOString() };
      await store.setJSON(recordId, record);
      return new Response(JSON.stringify(record), { status: 200, headers });
    }

    // DELETE record
    if (req.method === "DELETE" && recordId) {
      await store.delete(recordId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = {
  path: "/api/*",
};
