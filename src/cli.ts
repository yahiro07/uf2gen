import { program } from "commander";
import { promises as fs } from "fs";
import { convertBinToUf2, getUf2FamilyId } from ".";
import {
  executeInline,
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
    baseAddress,
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
      return familyId;
    } else {
      return 0;
    }
  });

  if (1) {
    console.log({
      inputFilePath,
      baseAddress,
      familySpec,
      familyId: familyId ? "0x" + familyId.toString(16) : "",
      outputFilePath,
    });
  }

  const buffer = await fs.readFile(inputFilePath);
  const binFileBytes = new Uint8Array(buffer);
  const uf2FileBytes = convertBinToUf2(binFileBytes, baseAddress, familyId);
  await fs.writeFile(outputFilePath, uf2FileBytes);

  console.log(`${outputFilePath} saved.`);
}

function mainEntry() {
  program
    .version("0.1.0")
    .arguments("<inputFile>")
    .option("-b, --base <baseAddress>", "Base address (hex)", "0x2000")
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
