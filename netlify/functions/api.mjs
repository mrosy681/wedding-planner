import { getStore } from "@netlify/blobs";

async function parseBody(req) {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

const VALID_STORES = ["guests", "vendors", "expenses", "gifts", "hotels", "categories"];

export default async (req, context) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.replace("/api/", "").split("/");
  const storeName = pathParts[0];
  const recordId  = pathParts[1] || null;
  const subAction = pathParts[2] || null; // e.g. "docs"
  const docId     = pathParts[3] || null;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // ── Document routes: /api/{store}/{recordId}/docs[/{docId}] ──────────────
  if (VALID_STORES.includes(storeName) && recordId && subAction === "docs") {
    const docStore = getStore({ name: `wedding-docs`, consistency: "strong" });

    // List docs for a record
    if (req.method === "GET" && !docId) {
      const { blobs } = await docStore.list({ prefix: `${storeName}:${recordId}:` });
      const docs = await Promise.all(
        blobs.map(async (b) => {
          const meta = await docStore.get(b.key, { type: "json" });
          // Return metadata only (no file data) for list
          if (meta) {
            const { data, ...rest } = meta;
            return rest;
          }
          return null;
        })
      );
      return new Response(JSON.stringify(docs.filter(Boolean)), { status: 200, headers });
    }

    // Upload a doc (POST) — body: { name, mimeType, data (base64), size }
    if (req.method === "POST") {
      const body = await parseBody(req);
      const id   = `${storeName}:${recordId}:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const doc  = { ...body, id, linkedTo: { store: storeName, recordId }, createdAt: new Date().toISOString() };
      await docStore.setJSON(id, doc);
      const { data, ...meta } = doc;
      return new Response(JSON.stringify(meta), { status: 201, headers });
    }

    // Download a doc (GET with docId) — returns full record including base64 data
    if (req.method === "GET" && docId) {
      const doc = await docStore.get(docId, { type: "json" });
      if (!doc) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
      return new Response(JSON.stringify(doc), { status: 200, headers });
    }

    // Delete a doc
    if (req.method === "DELETE" && docId) {
      await docStore.delete(docId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }
  }

  // ── General document library: /api/docs[/{docId}[/download]] ────────────
  if (storeName === "docs") {
    const docStore = getStore({ name: `wedding-docs`, consistency: "strong" });

    if (req.method === "GET" && !recordId) {
      const { blobs } = await docStore.list({ prefix: "general:" });
      const docs = await Promise.all(
        blobs.map(async (b) => {
          const meta = await docStore.get(b.key, { type: "json" });
          if (meta) { const { data, ...rest } = meta; return rest; }
          return null;
        })
      );
      return new Response(JSON.stringify(docs.filter(Boolean)), { status: 200, headers });
    }

    if (req.method === "POST") {
      const body = await parseBody(req);
      const id   = `general:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const doc  = { ...body, id, createdAt: new Date().toISOString() };
      await docStore.setJSON(id, doc);
      const { data, ...meta } = doc;
      return new Response(JSON.stringify(meta), { status: 201, headers });
    }

    if (req.method === "GET" && recordId) {
      const doc = await docStore.get(recordId, { type: "json" });
      if (!doc) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
      return new Response(JSON.stringify(doc), { status: 200, headers });
    }

    if (req.method === "DELETE" && recordId) {
      await docStore.delete(recordId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  // ── Standard CRUD routes ─────────────────────────────────────────────────
  if (!VALID_STORES.includes(storeName)) {
    return new Response(JSON.stringify({ error: "Invalid store" }), { status: 400, headers });
  }

  const store = getStore({ name: `wedding-${storeName}`, consistency: "strong" });

  try {
    if (req.method === "GET" && !recordId) {
      const { blobs } = await store.list();
      const records = await Promise.all(blobs.map(async (b) => store.get(b.key, { type: "json" })));
      return new Response(JSON.stringify(records.filter(Boolean)), { status: 200, headers });
    }

    if (req.method === "GET" && recordId) {
      const record = await store.get(recordId, { type: "json" });
      if (!record) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
      return new Response(JSON.stringify(record), { status: 200, headers });
    }

    if (req.method === "POST") {
      const body = await parseBody(req);
      const id   = body.id || `${storeName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const record = { ...body, id, createdAt: new Date().toISOString() };
      await store.setJSON(id, record);
      return new Response(JSON.stringify(record), { status: 201, headers });
    }

    if (req.method === "PUT" && recordId) {
      const body = await parseBody(req);
      const existing = await store.get(recordId, { type: "json" });
      const record = { ...(existing || {}), ...body, id: recordId, updatedAt: new Date().toISOString() };
      await store.setJSON(recordId, record);
      return new Response(JSON.stringify(record), { status: 200, headers });
    }

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

export const config = { path: "/api/*" };
