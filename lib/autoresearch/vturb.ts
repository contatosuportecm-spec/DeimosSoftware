export interface VturbStats {
  play_rate: number;
  sessions: number;
  unique_views: number;
}

interface VturbRawResponse {
  data?: {
    play_rate?: number;
    sessions?: number;
    unique_views?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function getVideoStats(
  videoId: string,
  apiKey?: string | null,
  hoursBack: number = 48
): Promise<{ stats: VturbStats; raw: VturbRawResponse }> {
  const token = apiKey || process.env.VTURB_API_KEY;
  if (!token) throw new Error("VTurb API key not configured");

  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://api.vturb.com.br/v1/videos/${videoId}/analytics?since=${encodeURIComponent(since)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VTurb API error ${res.status}: ${text}`);
  }

  const raw = (await res.json()) as VturbRawResponse;
  const data = raw.data ?? raw;

  return {
    stats: {
      play_rate: Number(data.play_rate ?? 0),
      sessions: Number(data.sessions ?? 0),
      unique_views: Number(data.unique_views ?? 0),
    },
    raw,
  };
}
