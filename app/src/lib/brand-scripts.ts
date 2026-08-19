import "server-only"

import { execFile } from "node:child_process"
import path from "node:path"
import { promisify } from "node:util"

import { REPO_ROOT, SCRIPTS_DIR } from "./repo"

const exec = promisify(execFile)

/**
 * `scripts/` stays the single source of truth for validation and CSS
 * generation, so the app runs the real scripts rather than reimplementing
 * them.
 *
 * They run as child processes, not as imports. They are CommonJS modules
 * outside the app, and requiring them through a computed path fails under
 * Turbopack ("Cannot find module as expression is too dynamic") — a literal
 * import would bundle a build-time copy instead, which is the thing we are
 * trying to avoid. A spawn costs ~50ms and always runs the file on disk.
 */
async function runScript(
  file: string,
  args: string[]
): Promise<{ stdout: string; stderr: string; failed: boolean }> {
  try {
    const { stdout, stderr } = await exec(
      process.execPath,
      [path.join(SCRIPTS_DIR, file), ...args],
      { cwd: REPO_ROOT }
    )
    return { stdout, stderr, failed: false }
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; message?: string }
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? e.message ?? "",
      failed: true,
    }
  }
}

function collect(output: string, prefix: string): string[] {
  return output
    .split("\n")
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length).trim())
}

export type ValidationResult = { errors: string[]; warnings: string[] }

/** WCAG AA contrast and logo-sprite checks from `scripts/validate-brand.js`. */
export async function validateBrand(
  absoluteBrandDir: string
): Promise<ValidationResult> {
  const { stdout, stderr, failed } = await runScript("validate-brand.js", [
    absoluteBrandDir,
  ])
  const output = `${stdout}\n${stderr}`
  const errors = collect(output, "error:")
  const warnings = collect(output, "warning:")
  if (failed && errors.length === 0) {
    errors.push(stderr.trim() || "validate-brand.js failed.")
  }
  return { errors, warnings }
}

/** Regenerates `brand.css` from `brand.json`. Always follows a write. */
export async function generateBrandCss(absoluteBrandDir: string) {
  const { stderr, failed } = await runScript("generate-brand-css.js", [
    absoluteBrandDir,
  ])
  if (failed) {
    throw new Error(
      `brand.json was written but brand.css could not be regenerated: ${stderr.trim()}`
    )
  }
}
