import { Router, type Request, type Response } from "express";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { tokenStore } from "./auth";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const objectStorage = new ObjectStorageService();
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type AccessResult =
  | { ok: true; user: typeof usersTable.$inferSelect }
  | { ok: false; status: 401 | 403; error: string };

async function getAdminOrStaff(req: Request): Promise<AccessResult> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const userId = tokenStore.get(authorization.slice(7));
  if (!userId) {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return { ok: true, user };
}

router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const access = await getAdminOrStaff(req);
  if (!access.ok) {
    return res.status(access.status).json({ error: access.error });
  }

  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing or invalid upload details" });
  }

  const { name, size, contentType } = parsed.data;
  if (!contentType.startsWith("image/")) {
    return res.status(400).json({ error: "Only image files are allowed" });
  }
  if (size > MAX_IMAGE_SIZE) {
    return res.status(400).json({ error: "Image must be 10 MB or smaller" });
  }

  try {
    const uploadURL = await objectStorage.getObjectEntityUploadURL(contentType);
    const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);

    return res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to generate vehicle image upload URL");
    return res.status(500).json({ error: "Failed to prepare image upload" });
  }
});

router.get("/storage/objects/*objectPath", async (req: Request, res: Response) => {
  try {
    const rawPath = req.params.objectPath;
    const objectPath = `/objects/${Array.isArray(rawPath) ? rawPath.join("/") : rawPath}`;
    const file = await objectStorage.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || inferImageContentType(file.name);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (metadata.size) {
      res.setHeader("Content-Length", String(metadata.size));
    }

    file.createReadStream().on("error", (error) => {
      req.log.error({ err: error }, "Failed to stream vehicle image");
      if (!res.headersSent) res.status(500);
      res.end();
    }).pipe(res);
    return;
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: "Image not found" });
    }

    req.log.error({ err: error }, "Failed to serve vehicle image");
    return res.status(500).json({ error: "Failed to serve image" });
  }
});

function inferImageContentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

export default router;