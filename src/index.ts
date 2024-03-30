import { uf2Families } from "./uf2families";
import {
  concatenateUint8Arrays,
  parseIntCheckedZeroOrPositiveInteger,
  raiseError,
  splitUint8ArrayIntoBlocks,
} from "./utils";

export function getUf2FamilyId(familyName: string): number | undefined {
  const family = uf2Families.find((it) => it.short_name === familyName);
  return family && parseIntCheckedZeroOrPositiveInteger(family.id, 16);
}

export function convertBinToUf2(
  binaryBytes: Uint8Array,
  appStartAddress: number,
  familyId: number
): Uint8Array {
  const payloadBlocks = splitUint8ArrayIntoBlocks(binaryBytes, 256);

  const flags = familyId ? 0x2000 : 0;
  const numBlocks = payloadBlocks.length;

  const convertedBlocks = payloadBlocks.map((payloadBlock, i) => {
    const block = new Uint8Array(512);
    const da = new DataView(block.buffer);
    da.setUint32(0, 0x0a324655, true);
    da.setUint32(4, 0x9e5d5157, true);
    da.setUint32(8, flags, true);
    da.setUint32(12, appStartAddress + i * 256, true);
    da.setUint32(16, 256, true);
    da.setUint32(20, i, true);
    da.setUint32(24, numBlocks, true);
    da.setUint32(28, familyId, true);
    const payloadBuf = new Uint8Array(476);
    payloadBuf.fill(0);
    payloadBuf.set(payloadBlock);
    block.set(payloadBuf, 32);
    da.setUint32(508, 0x0ab16f30, true);
    return block;
  });
  return concatenateUint8Arrays(convertedBlocks);
}

function readHexRecord(line: string) {
  const bytesStr = line.slice(1);
  const numBytes = bytesStr.length / 2;
  const bytes = new Array(numBytes).fill(0).map((_, i) => {
    const byteStr = bytesStr.slice(i * 2, i * 2 + 2);
    return parseInt(byteStr, 16);
  });
  const length = bytes[0];
  const offset = (bytes[1] << 8) | bytes[2];
  const recordType = bytes[3];
  const data = bytes.slice(4, 4 + length);
  return { offset, recordType, data };
}

export function readHexBaseAddress(hexFileText: string): number {
  const lines = hexFileText.split(/\r?\n/);
  const line0 = readHexRecord(lines[0]);
  const line1 = readHexRecord(lines[1]);
  if (line0.recordType === 0x02 && line1.recordType === 0x00) {
    const offset = ((line0.data[0] << 8) | line0.data[1]) << 4;
    return offset | line1.offset;
  } else if (line0.recordType === 0x00) {
    return line0.offset;
  } else {
    raiseError(`unsupported hex file variation`);
  }
}

export function convertHexToBin(hexFileText: string): Uint8Array {
  const records = hexFileText.split(/\r?\n/).map(readHexRecord);
  const bytes = records
    .filter((it) => it.recordType === 0)
    .flatMap((it) => it.data);
  return new Uint8Array(bytes);
}
