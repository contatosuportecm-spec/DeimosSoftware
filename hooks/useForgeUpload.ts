"use client";

import { useState, useCallback } from "react";

export function useForgeUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadOne = useCallback(async (file: File, providerId = "muapi"): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider_id", providerId);

    const res = await fetch("/api/forge/upload", {
      method: "POST",
      body: formData,
    });

    const text = await res.text();

    if (!res.ok) {
      let msg = "Upload failed";
      try { msg = JSON.parse(text).error || msg; } catch { msg = text.slice(0, 200) || msg; }
      throw new Error(msg);
    }

    let data: { url?: string };
    try { data = JSON.parse(text); } catch { throw new Error(`Invalid response: ${text.slice(0, 100)}`); }
    return (data.url as string) || null;
  }, []);

  const upload = useCallback(async (file: File, providerId = "muapi") => {
    setUploading(true);
    setError(null);

    try {
      const url = await uploadOne(file, providerId);
      if (url) {
        setUploadedUrl(url);
        setUploadedUrls((prev) => [...prev, url]);
      }
      return url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload error";
      setError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, [uploadOne]);

  const clear = useCallback(() => {
    setUploadedUrl(null);
    setUploadedUrls([]);
    setError(null);
  }, []);

  const removeUrl = useCallback((urlToRemove: string) => {
    setUploadedUrls((prev) => {
      const next = prev.filter((u) => u !== urlToRemove);
      setUploadedUrl(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  }, []);

  const setUrl = useCallback((url: string) => {
    setUploadedUrl(url);
    setUploadedUrls((prev) => prev.includes(url) ? prev : [...prev, url]);
    setError(null);
  }, []);

  return { upload, uploading, uploadedUrl, uploadedUrls, error, clear, setUrl, removeUrl };
}
