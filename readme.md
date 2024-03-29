# uf2gen

Generate UF2 firmware file from bin format.

A partial function porting of [uf2conv.py](https://github.com/microsoft/uf2/blob/master/utils/uf2conv.py).

Only support for converting bin to uf2.

## CLI usage

### installation

```sh
npm install -g uf2gen
```

### command example
```sh
uf2gen firmware.bin --family SAMD21 --base 0x2000 -o output.hex
```

### arguments

CLI arguments are similar to uf2conv.

|flag|description|default
|--|--|--|
|-f, --family | MCU family | blank family |
|-b, --base | base address | 0x2000 |
|-o, --output | output file path | \<inputFilePath\>.uf2

Families are specified in id (like 0x68ed2b88) or shortName (like SAMD21). 

Available MCU Families are listed here.  
[uf2families.ts](https://github.com/yahiro07/uf2gen/blob/main/src/uf2families.ts)

## Library usage

```ts
import { getUf2FamilyId, convertBinToUf2 } from "uf2gen";

const inputFilePath = "firmware.bin"
const outputFilePath = "firmware.uf2"
const baseAddress = 0x2000
const familyId = getUf2FamilyId("SAMD21");
const buffer = await fs.readFile(inputFilePath);
const binFileBytes = new Uint8Array(buffer);
const uf2FileBytes = convertBinToUf2(binFileBytes, baseAddress, familyId);
await fs.writeFile(outputFilePath, uf2FileBytes);

```

