/**
 * Nightwave Linktree - worker.js
 * Secure Cloudflare Worker with AES-GCM Encryption for D1 Database
 */

export default {
  async fetch(request, env) {
    // Handle CORS for your frontend
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const data = await request.json();
      
      // 1. Prepare Encryption Key from Secret
      // You must run: wrangler secret put MASTER_KEY
      const encoder = new TextEncoder();
      const keyData = encoder.encode(env.MASTER_KEY);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      );

      // 2. Encrypt Sensitive Fields (Example: 'email' and 'message')
      // We'll encrypt whatever fields exist in the incoming JSON
      const encryptedData = {};
      for (const [key, value] of Object.entries(data)) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedValue = encoder.encode(String(value));
        
        const encryptedBuffer = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          cryptoKey,
          encodedValue
        );

        // Store IV + Ciphertext as a single base64 string
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);
        
        encryptedData[key] = btoa(String.fromCharCode(...combined));
      }

      // 3. Store in D1 Database
      // Note: This assumes a table named 'submissions' exists.
      // We will define the exact schema once the form is designed.
      const keys = Object.keys(encryptedData).join(", ");
      const placeholders = Object.keys(encryptedData).map(() => "?").join(", ");
      const values = Object.values(encryptedData);

      await env.DB.prepare(
        `INSERT INTO submissions (${keys}, created_at) VALUES (${placeholders}, CURRENT_TIMESTAMP)`
      ).bind(...values).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
