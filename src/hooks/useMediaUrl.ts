import { useState, useEffect } from "react";

const heicCache = new Map<string, string>();

export function isHeicUrl(url: string) {
  return /\.(heic|heif)$/i.test(url) || /^data:image\/heic/i.test(url) || /^data:image\/heif/i.test(url);
}

export function isMov(url: string) {
  return /\.mov$/i.test(url);
}

export function isVideo(url: string, mediaType?: string) {
  return (
    mediaType === "video" ||
    /\.(mp4|mov|webm|ogg|avi|mkv|m4v)$/i.test(url)
  );
}

export function useMediaUrl(rawUrl: string | undefined) {
  const [url, setUrl]         = useState<string>(rawUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!rawUrl) return;

    // Cloudinary optimization for remote HEIC files
    if (rawUrl.includes("cloudinary.com") && isHeicUrl(rawUrl)) {
      // Insert f_auto to let Cloudinary handle the conversion
      const optimizedUrl = rawUrl.replace("/upload/", "/upload/f_auto,q_auto/");
      setUrl(optimizedUrl);
      return;
    }

    // Not HEIC — use as-is
    if (!isHeicUrl(rawUrl)) {
      setUrl(rawUrl);
      return;
    }

    // Already cached
    if (heicCache.has(rawUrl)) {
      setUrl(heicCache.get(rawUrl)!);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const convert = async () => {
      try {
        // Dynamic import keeps heic2any out of the main bundle
        const heic2any = (await import("heic2any")).default;
        const res  = await fetch(rawUrl);
        const blob = await res.blob();
        const out  = await heic2any({ blob, toType: "image/jpeg", quality: 0.85 });
        const outBlob    = Array.isArray(out) ? out[0] : out;
        const objectUrl  = URL.createObjectURL(outBlob);
        heicCache.set(rawUrl, objectUrl);
        if (!cancelled) { setUrl(objectUrl); setLoading(false); }
      } catch (e) {
        console.error("HEIC conversion failed", e);
        if (!cancelled) { setError(true); setLoading(false); setUrl(rawUrl); }
      }
    };

    convert();
    return () => { cancelled = true; };
  }, [rawUrl]);

  return { url, loading, error };
}