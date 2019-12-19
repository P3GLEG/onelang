require("./Utils/Extensions.js");
import {readFile, timeNow} from "./Utils/NodeUtils";
import {OneCompiler} from "./One/OneCompiler";
import {langConfigs} from "./Generator/LangConfigs";

const fs = require("fs");


let prgNames = ["all"];
const langFilter = "";
const compileAll = prgNames[0] === "all";

if (compileAll)
    prgNames = fs.readdirSync("input").filter(x => x.endsWith(".ts")).map(x => x.replace(".ts", ""));

const overlayCode = readFile(`langs/NativeResolvers/typescript.ts`);
const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

const compiler = new OneCompiler();
compiler.setup(overlayCode, stdlibCode, genericTransforms);

const langConfigVals = Object.values(langConfigs);
for (const langConfig of langConfigVals) {
    const langYaml = readFile(`langs/${langConfig.name}.yaml`);
    langConfig.schema = OneCompiler.parseLangSchema(langYaml, compiler.stdlibCtx.schema);
}

const programCode = readFile(`input/Pegleg.ts`).replace(/\r\n/g, '\n');
let t0 = timeNow();
compiler.parse("typescript", programCode);

const compileTimes = [];
for (const lang of langConfigVals) {
    if (langFilter && lang.name !== langFilter) continue;
    t0 = timeNow();
    const codeGen = compiler.getCodeGenerator(lang.schema);
    lang.request.code = codeGen.generate(true);
    compileTimes.push(timeNow() - t0);
    console.log(codeGen.generatedCode);
}

