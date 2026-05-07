"use client";

import { useState, useCallback } from "react";

export function useForgeUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, providerId = "muapi") => {
    setUploading(true);
    setError(null);
    setUploadedUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider_id", providerId);

      const res = await fetch("/api/forge/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      setUploadedUrl(url);
      return url as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload error";
      setError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setUploadedUrl(null);
    setError(null);
  }, []);

  return { upload, uploading, uploadedUrl, error, clear };
}
