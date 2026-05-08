interface SubmitResult {
  requestId: string;
}

interface PollResult {
  status: "pending" | "processing" | "completed" | "failed";
  url?: string;
  error?: string;
}

const BASE_URL = "https://api.muapi.ai";

function extractUrl(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const u = extractUrl(item);
      if (u) return u;
    }
    return undefined;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return (
      extractUrl(obj.url) ||
      extractUrl(obj.image_url) ||
      extractUrl(obj.video_url) ||
      extractUrl(obj.audio_url) ||
      extractUrl(obj.result_url) ||
      extractUrl(obj.output_url) ||
      extractUrl(obj.cdn_url) ||
      extractUrl(obj.signed_url) ||
      undefined
    );
  }
  return undefined;
}

function extractResultUrl(data: Record<string, unknown>): string | undefined {
  return (
    extractUrl(data.outputs) ||
    extractUrl(data.output) ||
    extractUrl(data.result) ||
    extractUrl(data.results) ||
    extractUrl(data.data) ||
    extractUrl(data.url) ||
    extractUrl(data.image_url) ||
    extractUrl(data.video_url) ||
    extractUrl(data.images) ||
    extractUrl(data.videos) ||
    undefined
  );
}

function extractRequestId(data: Record<string, unknown>): string | undefined {
  const candidates = [
    data.request_id,
    data.id,
    data.prediction_id,
    data.task_id,
    data.job_id,
    (data.data as Record<string, unknown> | undefined)?.request_id,
    (data.data as Record<string, unknown> | undefined)?.id,
    (data.prediction as Record<string, unknown> | undefined)?.id,
    (data.prediction as Record<string, unknown> | undefined)?.request_id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return undefined;
}

const PROCESSING_STATES = new Set([
  "pending",
  "queued",
  "in_queue",
  "in_progress",
  "processing",
  "running",
  "started",
  "starting",
]);
const COMPLETED_STATES = new Set(["completed", "succeeded", "success", "finished", "done"]);
const FAILED_STATES = new Set(["failed", "error", "errored", "cancelled", "canceled", "timeout"]);

export async function muapiSubmit(
  endpoint: string,
  payload: Record<string, unknown>,
  apiKey: string
): Promise<SubmitResult> {
  const url = `${BASE_URL}/api/v1/${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();

  if (!response.ok) {
    console.error(`[muapi/submit] ${endpoint} ${response.status}`, rawText.slice(0, 400));
    throw new Error(`Muapi submit failed (${response.status}): ${rawText.slice(0, 200)}`);
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Muapi submit returned non-JSON: ${rawText.slice(0, 200)}`);
  }

  console.log(`[muapi/submit] ${endpoint} response:`, JSON.stringify(data).slice(0, 500));

  const requestId = extractRequestId(data);

  if (!requestId) {
    const directUrl = extractResultUrl(data);
    if (directUrl) {
      return { requestId: `direct:${directUrl}` };
    }
    throw new Error(`No request_id in Muapi response: ${rawText.slice(0, 200)}`);
  }

  return { requestId };
}

export async function muapiPoll(requestId: string, apiKey: string): Promise<PollResult> {
  if (requestId.startsWith("direct:")) {
    return { status: "completed", url: requestId.slice(7) };
  }

  const url = `${BASE_URL}/api/v1/predictions/${requestId}/result`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  const rawText = await response.text();

  if (!response.ok) {
    if (response.status >= 500 || response.status === 404) {
      return { status: "processing" };
    }
    console.error(`[muapi/poll] ${requestId} ${response.status}`, rawText.slice(0, 400));
    return { status: "failed", error: `Poll error (${response.status}): ${rawText.slice(0, 200)}` };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    return { status: "processing" };
  }

  const rawStatus = String(data.status || "").toLowerCase();
  console.log(`[muapi/poll] ${requestId} status=${rawStatus}`, JSON.stringify(data).slice(0, 400));

  if (COMPLETED_STATES.has(rawStatus)) {
    const resultUrl = extractResultUrl(data);
    if (!resultUrl) {
      console.error(`[muapi/poll] ${requestId} completed but no URL found in:`, JSON.stringify(data).slice(0, 600));
      return { status: "failed", error: "Completed but no output URL in response" };
    }
    return { status: "completed", url: resultUrl };
  }

  if (FAILED_STATES.has(rawStatus)) {
    const errMsg = (data.error as string) || (data.message as string) || `Generation ${rawStatus}`;
    return { status: "failed", error: errMsg };
  }

  if (PROCESSING_STATES.has(rawStatus) || !rawStatus) {
    // Some Muapi models embed a final URL even before status flips
    const earlyUrl = extractResultUrl(data);
    if (earlyUrl) {
      return { status: "completed", url: earlyUrl };
    }
    return { status: "processing" };
  }

  console.warn(`[muapi/poll] ${requestId} unknown status: ${rawStatus}`);
  return { status: "processing" };
}

export async function muapiUploadFile(file: Buffer, filename: string, apiKey: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(file)]);
  formData.append("file", blob, filename);

  const response = await fetch(`${BASE_URL}/api/v1/upload_file`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const fileUrl = data.url || data.file_url || data.data?.url;
  if (!fileUrl) throw new Error("No URL returned from upload");
  return fileUrl;
}
