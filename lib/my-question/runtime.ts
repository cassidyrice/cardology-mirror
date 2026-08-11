import type { D1DatabaseLike } from "./orders";

export type MyQuestionRuntimeEnv = Record<string, unknown>;

export async function resolveMyQuestionRuntime(): Promise<{
  env: MyQuestionRuntimeEnv;
  db: D1DatabaseLike | null;
}> {
  let env: MyQuestionRuntimeEnv = {};
  try {
    const { getOptionalRequestContext } = await import(
      "@cloudflare/next-on-pages"
    );
    env = (getOptionalRequestContext()?.env as MyQuestionRuntimeEnv) ?? {};
  } catch {
    env = {};
  }

  const candidate = env.MY_QUESTION_DB;
  const db = isD1DatabaseLike(candidate) ? candidate : null;
  return { env, db };
}

export function runtimeString(
  env: MyQuestionRuntimeEnv,
  name: string,
): string | undefined {
  const runtimeValue = env[name];
  if (typeof runtimeValue === "string" && runtimeValue.trim()) {
    return runtimeValue.trim();
  }
  const processValue = process.env[name];
  return processValue?.trim() || undefined;
}

export function runtimeFlag(
  env: MyQuestionRuntimeEnv,
  name: string,
): boolean {
  return runtimeString(env, name) === "true";
}

function isD1DatabaseLike(value: unknown): value is D1DatabaseLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "prepare" in value &&
      typeof (value as { prepare?: unknown }).prepare === "function",
  );
}
