import { getForgeModel } from "../models";

interface SubmitResult {
  requestId: string;
}

interface PollResult {
  status: "pending" | "processing" | "completed" | "failed";
  url?: string;
  error?: string;
}

const BASE_URL = "https://api.muapi.ai";

export async function muapiSubmit(
  modelId: string,
  payload: Record<string, unknown>,
  apiKey: string
): Promise<SubmitResult> {
  const model = getForgeModel(modelId);
  if (!model) throw new Error(`Model not found: ${modelId}`);

  const url = `${BASE_URL}/api/v1/${model.endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Muapi submit failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const requestId = data.request_id || data.id;

  if (!requestId) {
    // Some models return result directly
    const directUrl = data.outputs?.[0] || data.url || data.output?.url;
    if (directUrl) {
      return { requestId: `direct:${directUrl}` };
    }
    throw new Error("No request_id returned from Muapi");
  }

  return { requestId };
}

export async function muapiPoll(requestId: string, apiKey: string): Promise<PollResult> {
  // Handle direct results
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

  if (!response.ok) {
    if (response.status >= 500) {
      return { status: "processing" };
    }
    const text = await response.text();
    return { status: "failed", error: `Poll error (${response.status}): ${text.slice(0, 200)}` };
  }

  const data = await response.json();
  const status = (data.status || "").toLowerCase();

  if (status === "completed" || status === "succeeded" || status === "success") {
    const resultUrl = data.outputs?.[0] || data.url || data.output?.url;
    return { status: "completed", url: resultUrl };
  }

  if (status === "failed" || status === "error") {
    return { status: "failed", error: data.error || "Generation failed" };
  }

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
