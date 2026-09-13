export function createError(message: string, code: number) {
  const err = new Error(message);
  (err as any).code = code;
  return err;
}

