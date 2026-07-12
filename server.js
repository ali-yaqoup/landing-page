import express from "express";
import path from "path";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json());

// Cloudinary Configuration
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn("⚠️ Cloudinary environment variables are missing! Image upload will fall back to local base64 simulation.");
}

// Extract public_id from Cloudinary URL helper
function getPublicIdFromUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    let path = parts[1];
    
    // strip the version segment if it starts with 'v' followed by digits
    const versionMatch = path.match(/^v\d+\/(.+)$/);
    if (versionMatch) {
      path = versionMatch[1];
    }
    
    // strip file extension
    const dotIndex = path.lastIndexOf(".");
    if (dotIndex !== -1) {
      path = path.substring(0, dotIndex);
    }
    return path;
  } catch (e) {
    console.error("Failed to extract public_id from Cloudinary URL:", url, e);
    return null;
  }
}

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// API: Upload image to Cloudinary
app.post("/api/cloudinary/upload", upload.single("file"), async (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(400).json({
      error: "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment."
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "products"
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.write(req.file.buffer);
        stream.end();
      });
    };

    const result = await streamUpload(req);

    // Apply auto format and quality optimization on the secure URL
    const optimizedUrl = result.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");

    res.json({
      url: optimizedUrl,
      public_id: result.public_id,
      original_url: result.secure_url
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload image to Cloudinary." });
  }
});

// API: Delete image(s) from Cloudinary
app.post("/api/cloudinary/delete", async (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(400).json({ error: "Cloudinary is not configured." });
  }

  const { url, urls } = req.body;
  const urlsToDelete = urls || (url ? [url] : []);

  if (urlsToDelete.length === 0) {
    return res.status(400).json({ error: "No URLs provided for deletion." });
  }

  try {
    const results = [];
    for (const imgUrl of urlsToDelete) {
      const publicId = getPublicIdFromUrl(imgUrl);
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId);
        results.push({ url: imgUrl, publicId, result: result.result });
      } else {
        results.push({ url: imgUrl, error: "Not a valid Cloudinary URL" });
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    console.error("Cloudinary destroy error:", error);
    res.status(500).json({ error: "Failed to delete image from Cloudinary." });
  }
});

// Vite Middleware & Static Asset Serving Setup
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
