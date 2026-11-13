import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Cloudflare R2 environment variables");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function sanitizeKeyPart(part) {
  return String(part || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");
}

export default async function handler(req, res) {
  if (res && typeof res.status === "function") {
    return handleNodeRequest(req, res);
  }
  return handleWebRequest(req);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req) {
  return handleWebRequest(req);
}

async function handleNodeRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON" });
      }
    }

    const result = await processPresign(body);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Presign error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

async function handleWebRequest(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const result = await processPresign(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Presign error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function processPresign(body) {
  const { shootId, files, filename, tone, contentType } = body || {};

  if (!shootId) {
    throw new Error("shootId is required");
  }

  const cleanShootId = sanitizeKeyPart(shootId);
  const bucketName = process.env.R2_BUCKET_NAME || "korayhussein-proofs";
  const publicBaseUrl = (process.env.R2_PUBLIC_URL || "https://pub-c64c2ecfb504495cb6e4b8d1dde437c0.r2.dev").replace(/\/+$/, "");

  const s3 = getS3Client();

  // If batch mode
  if (Array.isArray(files) && files.length > 0) {
    const items = await Promise.all(
      files.map(async (fileItem) => {
        const itemFilename = sanitizeKeyPart(fileItem.filename || fileItem.name || "image.jpg");
        const itemTone = sanitizeKeyPart(fileItem.tone || "colour");
        const itemType = fileItem.contentType || "image/jpeg";
        const key = `${cleanShootId}/${itemTone}/${itemFilename}`;

        const uploadUrl = await getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: itemType,
          }),
          { expiresIn: 3600 }
        );

        return {
          filename: fileItem.filename || fileItem.name,
          cleanFilename: itemFilename,
          tone: fileItem.tone || "colour",
          key,
          uploadUrl,
          publicUrl: `${publicBaseUrl}/${key}`,
        };
      })
    );

    return { success: true, items, publicBaseUrl };
  }

  // Single file mode
  const cleanFilename = sanitizeKeyPart(filename || "image.jpg");
  const cleanTone = sanitizeKeyPart(tone || "colour");
  const key = `${cleanShootId}/${cleanTone}/${cleanFilename}`;
  const cType = contentType || "image/jpeg";

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: cType,
    }),
    { expiresIn: 3600 }
  );

  return {
    success: true,
    key,
    uploadUrl,
    publicUrl: `${publicBaseUrl}/${key}`,
  };
}
