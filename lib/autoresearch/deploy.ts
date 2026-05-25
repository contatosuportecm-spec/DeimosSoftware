import type { RoundVariant } from "@/types/autoresearch";

interface DeployResult {
  sha: string;
  url: string;
}

interface FileContents {
  content: string;
  sha: string;
}

async function getFileContents(
  repo: string,
  branch: string,
  filePath: string,
  token: string
): Promise<FileContents | null> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { content: string; sha: string; encoding: string };
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

async function commitFile(
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  message: string,
  sha: string | null,
  token: string
): Promise<DeployResult> {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { content: { sha: string; html_url: string } };
  return { sha: data.content.sha, url: data.content.html_url };
}

/**
 * Deploys a splitter config JSON file with all slot headlines.
 * The landing page reads this file to split traffic across video slots.
 */
export async function deploySplitterConfig(
  repo: string,
  branch: string,
  filePath: string,
  variants: RoundVariant[],
  roundNumber: number,
  token?: string
): Promise<DeployResult> {
  const ghToken = token || process.env.GITHUB_TOKEN;
  if (!ghToken) throw new Error("GITHUB_TOKEN not configured");

  const config = {
    slots: variants.map((v) => ({
      slot_index: v.slot_index,
      video_id: v.video_id,
      headline: v.headline,
      role: v.role,
    })),
    round: roundNumber,
    updated_at: new Date().toISOString(),
  };

  const content = JSON.stringify(config, null, 2);
  const file = await getFileContents(repo, branch, filePath, ghToken);
  const message = `[AutoResearch] Round #${roundNumber}: ${variants.length} slots deployed`;

  return commitFile(repo, branch, filePath, content, message, file?.sha ?? null, ghToken);
}
