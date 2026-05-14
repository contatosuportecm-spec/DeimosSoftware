import { execSync } from "child_process";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

/** Extract text from a PDF buffer. Runs pdf-parse in a child process to avoid webpack issues. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const tmpPdf = join(tmpdir(), `pdf-${Date.now()}.pdf`);
  const tmpOut = join(tmpdir(), `pdf-${Date.now()}.txt`);

  try {
    writeFileSync(tmpPdf, buffer);

    const script = `
      const fs = require('fs');
      const pdfParse = require('pdf-parse');
      const buf = fs.readFileSync('${tmpPdf}');
      pdfParse(buf).then(d => {
        fs.writeFileSync('${tmpOut}', d.text || '');
        process.exit(0);
      }).catch(e => {
        fs.writeFileSync('${tmpOut}', '');
        console.error(e.message);
        process.exit(1);
      });
    `;

    execSync(`node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      timeout: 30000,
      cwd: process.cwd(),
    });

    const text = readFileSync(tmpOut, "utf-8");
    return text;
  } finally {
    try { unlinkSync(tmpPdf); } catch {}
    try { unlinkSync(tmpOut); } catch {}
  }
}
