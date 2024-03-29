export function raiseError(error: any): never {
  throw new Error(error);
}

export function executeInline<T>(fn: () => T): T {
  return fn();
}

export function parseIntCheckedZeroOrPositiveInteger(
  text: string,
  radix?: number | undefined
) {
  const res = parseInt(text, radix);
  if (isFinite(res) && res >= 0) {
    return res;
  } else {
    raiseError(`failed to parse to integer, ${text}`);
  }
}

export function replaceFilePathExtension(filePath: string, ext: string) {
  return filePath.split(".")[0] + ext;
}

export function splitUint8ArrayIntoBlocks(
  bytes: Uint8Array,
  n: number
): Uint8Array[] {
  const m = Math.ceil(bytes.length / n);
  return Array(m)
    .fill(0)
    .map((_, i) => bytes.slice(i * n, i * n + n));
}

export function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((total, arr) => total + arr.length, 0);
  const res = new Uint8Array(totalLength);
  let pos = 0;
  for (const arr of arrays) {
    res.set(arr, pos);
    pos += arr.length;
  }
  return res;
}
