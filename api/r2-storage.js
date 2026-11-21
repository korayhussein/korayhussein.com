// Real-time Cloudflare R2 storage usage endpoint
// Queries bucket metrics using AWS SDK v3 ListObjectsV2Command
// Returns total storage used, percentage of 10 GB free tier, remaining free storage,
// and per-gallery byte breakdown.

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

let cachedResult = null;
let cachedTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

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

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const isFresh = req.query && (req.query.fresh === "1" || req.query.fresh === "true");
  const now = Date.now();

  if (!isFresh && cachedResult && (now - cachedTimestamp < CACHE_TTL_MS)) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cachedResult);
  }

  try {
    const s3 = getS3Client();
    const bucketName = process.env.R2_BUCKET_NAME || "korayhussein-proofs";
    const FREE_TIER_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

    let totalBytes = 0;
    let totalObjects = 0;
    const folderBreakdownBytes = {};
    let continuationToken = undefined;

    do {
      const listRes = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      );

      const objects = listRes.Contents || [];
      for (const obj of objects) {
        totalObjects++;
        const size = obj.Size || 0;
        totalBytes += size;

        const folder = (obj.Key || "").split("/")[0] || "root";
        folderBreakdownBytes[folder] = (folderBreakdownBytes[folder] || 0) + size;
      }

      continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
    } while (continuationToken);

    const totalMB = +(totalBytes / (1024 * 1024)).toFixed(1);
    const totalGB = +(totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const freeTierGB = 10;
    const percentUsed = +Math.min(100, (totalBytes / FREE_TIER_BYTES) * 100).toFixed(1);
    const remainingBytes = Math.max(0, FREE_TIER_BYTES - totalBytes);
    const remainingGB = +(remainingBytes / (1024 * 1024 * 1024)).toFixed(2);
    const isOverLimit = totalBytes > FREE_TIER_BYTES;
    const overageBytes = Math.max(0, totalBytes - FREE_TIER_BYTES);
    const overageGB = +(overageBytes / (1024 * 1024 * 1024)).toFixed(2);
    const estimatedMonthlyOverageCost = isOverLimit ? +(overageGB * 0.015).toFixed(2) : 0;

    const folderBreakdownMB = {};
    for (const [folder, bytes] of Object.entries(folderBreakdownBytes)) {
      folderBreakdownMB[folder] = +(bytes / (1024 * 1024)).toFixed(1);
    }

    const payload = {
      ok: true,
      totalBytes,
      totalObjects,
      totalMB,
      totalGB,
      freeTierGB,
      percentUsed,
      remainingGB,
      isOverLimit,
      overageGB,
      estimatedMonthlyOverageCost,
      folderBreakdownBytes,
      folderBreakdownMB,
      updatedAt: now,
    };

    cachedResult = payload;
    cachedTimestamp = now;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Cache", "MISS");
    return res.status(200).json(payload);
  } catch (err) {
    console.error("R2 storage check error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to retrieve storage metrics",
    });
  }
}
