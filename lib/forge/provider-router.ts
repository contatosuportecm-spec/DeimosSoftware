import { muapiSubmit, muapiPoll, muapiUploadFile } from "./adapters/muapi";
import { createServerClient } from "@/lib/supabase";

interface SubmitResult {
  requestId: string;
}

interface PollResult {
  status: "pending" | "processing" | "completed" | "failed";
  url?: string;
  error?: string;
}

export async function getProviderKey(providerId: string): Promise<string> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("forge_api_keys")
    .select("encrypted_key")
    .eq("provider_id", providerId)
    .single();

  if (error || !data) {
    throw new Error(`API key not configured for provider: ${providerId}`);
  }

  return data.encrypted_key;
}

export async function submitGeneration(
  providerId: string,
  modelId: string,
  payload: Record<string, unknown>,
  apiKey: string
): Promise<SubmitResult> {
  switch (providerId) {
    case "muapi":
      return muapiSubmit(modelId, payload, apiKey);
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

export async function pollGeneration(
  providerId: string,
  requestId: string,
  apiKey: string
): Promise<PollResult> {
  switch (providerId) {
    case "muapi":
      return muapiPoll(requestId, apiKey);
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

export async function uploadFile(
  providerId: string,
  file: Buffer,
  filename: string,
  apiKey: string
): Promise<string> {
  switch (providerId) {
    case "muapi":
      return muapiUploadFile(file, filename, apiKey);
    default:
      throw new Error(`Upload not supported for provider: ${providerId}`);
  }
}
