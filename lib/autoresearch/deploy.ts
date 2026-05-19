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
 * Deploys a variant by doing find-and-replace in the target file.
 * Fetches the full file, replaces `oldValue` with `newValue`, commits back.
 * If oldValue is null (first iteration), searches for newValue's placeholder or fails gracefully.
 */
export async function deployVariant(
  repo: string,
  branch: string,
  filePath: string,
  newValue: string,
  oldValue: string | null,
  message: string,
  token?: string
): Promise<DeployResult> {
  const ghToken = token || process.env.GITHUB_TOKEN;
  if (!ghToken) throw new Error("GITHUB_TOKEN not configured");

  const file = await getFileContents(repo, branch, filePath, ghToken);
  if (!file) throw new Error(`File not found: ${filePath} on ${repo}@${branch}`);

  let updatedContent: string;

  if (oldValue && file.content.includes(oldValue)) {
    // Replace old headline with new one
    updatedContent = file.content.replace(oldValue, newValue);
  } else {
    // First iteration or old value not found — try to find newValue placeholder
    // Look for common patterns: {{HEADLINE}}, <!-- HEADLINE -->, %HEADLINE%
    const placeholders = ["{{HEADLINE}}", "<!-- HEADLINE -->", "%HEADLINE%", "{{headline}}", "{HEADLINE}"];
    let replaced = false;
    for (const ph of placeholders) {
      if (file.content.includes(ph)) {
        updatedContent = file.content.replace(ph, newValue);
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      // No placeholder found and no old value — cannot safely replace
      // Fall back: if the file has the current campaign value somewhere, we missed it
      throw new Error(
        `Cannot find "${oldValue?.slice(0, 60) ?? "placeholder"}" in ${filePath}. ` +
        `Add a placeholder ({{HEADLINE}}) or ensure the current headline exists in the file.`
      );
    }

    updatedContent = updatedContent!;
  }

  if (updatedContent === file.content) {
    throw new Error("File content unchanged after replacement — old value may not match exactly");
  }

  return commitFile(repo, branch, filePath, updatedContent, message, file.sha, ghToken);
}

/**
 * Reverts by replacing the current value back to the previous one.
 */
export async function revertVariant(
  repo: string,
  branch: string,
  filePath: string,
  currentValue: string,
  previousValue: string,
  token?: string
): Promise<DeployResult> {
  return deployVariant(
    repo,
    branch,
    filePath,
    previousValue,
    currentValue,
    `[AutoResearch] Revert to previous variant`,
    token
  );
}
