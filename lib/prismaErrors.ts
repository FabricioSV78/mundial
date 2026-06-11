export function isMissingTableError(error: unknown, modelName?: string) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; meta?: { modelName?: string } };
  return maybeError.code === "P2021" && (!modelName || maybeError.meta?.modelName === modelName);
}
