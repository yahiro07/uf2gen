import { program } from "commander";
import { promises as fs } from "fs";
import {
  convertBinToUf2,
  convertHexToBin,
  getUf2FamilyId,
  readHexBaseAddress,
} from ".";
import {
  executeInline,
  numberToHexString,
  parseIntCheckedZeroOrPositiveInteger,
  raiseError,
  replaceFilePathExtension,
} from "./utils";

async function processMain(args: {
  inputFilePath: string;
  baseAddress: number;
  familySpec: string | undefined;
  outputFilePath: string | undefined;
}) {
  const {
    inputFilePath,
    baseAddress: baseAddressSpec,
    familySpec,
    outputFilePath: outputFilePathSpec,
  } = args;

  const outputFilePath =
    outputFilePathSpec ?? replaceFilePathExtension(inputFilePath, ".uf2");

  const familyId = executeInline(() => {
    if (familySpec?.startsWith("0x")) {
      return parseIntCheckedZeroOrPositiveInteger(familySpec, 16);
    } else if (familySpec) {
      const familyId = getUf2FamilyId(familySpec);
      if (!familyId) {
        raiseError(`target family not found for ${familySpec}`);
      }
      console.log(`family: ${familySpec}(${numberToHexString(familyId)})`);
      return familyId;
    } else {
      return 0;
    }
  });

  const [baseAddress, binFileBytes] = await executeInline(async () => {
    if (inputFilePath.endsWith(".hex")) {
      const hexFileText = await fs.readFile(inputFilePath, {
        encoding: "utf-8",
      });
      const baseAddress = readHexBaseAddress(hexFileText);
      if (baseAddressSpec != 0 && baseAddress !== baseAddressSpec) {
        console.log(
          `[WARN] baseAddress override: ${numberToHexString(baseAddress)}`
        );
      }
      return [baseAddress, convertHexToBin(hexFileText)];
    } else {
      const buffer = await fs.readFile(inputFilePath);
      return [baseAddressSpec, new Uint8Array(buffer)];
    }
  });

  const uf2FileBytes = convertBinToUf2(binFileBytes, baseAddress, familyId);
  await fs.writeFile(outputFilePath, uf2FileBytes);

  const size = uf2FileBytes.length;

  console.log(
    `Converted to uf2, output size: ${size}, start address: ${numberToHexString(
      baseAddress
    )}`
  );

  console.log(`Wrote ${size} bytes to ${outputFilePath}`);
}

function mainEntry() {
  program
    .version("0.1.0")
    .arguments("<inputFile>")
    .option("-b, --base <baseAddress>", "Base address (hex)", "0x00")
    .option("-f, --family <family>", "Family")
    .option("-o, --output <outputFile>", "Output file")
    .action((inputFilePath, options) => {
      const baseAddress = parseIntCheckedZeroOrPositiveInteger(
        options.base,
        16
      );
      const familySpec = options.family ?? undefined;
      const outputFilePath = options.output;
      processMain({ inputFilePath, baseAddress, familySpec, outputFilePath });
    });
  program.parse(process.argv);
}

(async () => {
  try {
    mainEntry();
  } catch (error) {
    console.error(error);
  }
})();
