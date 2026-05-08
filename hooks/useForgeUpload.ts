"use client";

import { useState, useCallback } from "react";

export function useForgeUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadOne = useCallback(async (file: File): Promise<string | null> => {
    // 1. Get signed upload URL from our API (tiny request, ~200 bytes)
    const res = await fetch("/api/forge/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name || "paste.png",
        contentType: file.type || "image/png",
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      let msg = "Failed to get upload URL";
      try { msg = JSON.parse(text).error || msg; } catch { msg = text.slice(0, 200) || msg; }
      throw new Error(msg);
    }

    let data: { signedUrl: string; token: string; path: string; publicUrl: string; contentType: string };
    try { data = JSON.parse(text); } catch { throw new Error(`Invalid response: ${text.slice(0, 100)}`); }

    // 2. Upload directly to Supabase Storage (bypasses Vercel entirely)
    const uploadRes = await fetch(data.signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": data.contentType,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      throw new Error(`Upload failed (${uploadRes.status}): ${errText.slice(0, 200)}`);
    }

    // 3. Return the public URL
    return data.publicUrl;
  }, []);

  const upload = useCallback(async (file: File, _providerId = "muapi") => {
    setUploading(true);
    setError(null);

    try {
      const url = await uploadOne(file);
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
