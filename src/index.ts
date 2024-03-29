import { uf2Families } from "./uf2families";
import {
  concatenateUint8Arrays,
  parseIntCheckedZeroOrPositiveInteger,
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
