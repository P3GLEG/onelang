require("./Utils/Extensions.js");
import { readFile, writeFile } from "./Utils/NodeUtils";
import { OneCompiler } from "./One/OneCompiler";
import { langConfigs } from "./Generator/LangConfigs";

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');


function outputAll(compiler: OneCompiler, outputFilename: string, programCode: string) {
    const langConfigVals = Object.values(langConfigs);
    for (const langConfig of langConfigVals) {
        const langYaml = readFile(`langs/${langConfig.yamlFile}`);
        langConfig.schema = OneCompiler.parseLangSchema(langYaml, compiler.stdlibCtx.schema);
    }
    compiler.parse("typescript", programCode);
    for (const lang of langConfigVals) {
        const codeGen = compiler.getCodeGenerator(lang.schema);
        lang.request.code = codeGen.generate(true);
        writeFile(`generated/${outputFilename}.${codeGen.lang.extension}`, codeGen.generatedCode + "\n");
    }
    console.log("Results saved to ./generated/");

}
function singleOutput(compiler: OneCompiler, outputFilename: string, programCode: string) {
    const fileExt = outputFilename.substring(outputFilename.lastIndexOf('.') + 1, outputFilename.length) || outputFilename;
    let selectedLang;
    switch (fileExt) {
        case "cpp":
            selectedLang = langConfigs['cpp'];
            break;
        case "cs":
            selectedLang = langConfigs['csharp'];
            break;
        case "go":
            selectedLang = langConfigs['go'];
            break;
        case "java":
            selectedLang = langConfigs['java'];
            break;
        case "js":
            selectedLang = langConfigs['javascript'];
            break;
        case "php":
            selectedLang = langConfigs['php'];
            break;
        case "pl":
            selectedLang = langConfigs['perl'];
            break;
        case "py":
            selectedLang = langConfigs['python'];
            break;
        case "rb":
            selectedLang = langConfigs['ruby'];
            break;
        case "swift":
            selectedLang = langConfigs['swift'];
            break;
        default:
            console.log(`Unable to figure out the language based on ${fileExt}`);
            process.exit(-1);
            break;
    }

    const langYaml = readFile(`langs/${selectedLang.yamlFile}`);
    selectedLang.schema = OneCompiler.parseLangSchema(langYaml, compiler.stdlibCtx.schema);


    compiler.parse("typescript", programCode);
    const codeGen = compiler.getCodeGenerator(selectedLang.schema);
    selectedLang.request.code = codeGen.generate(true);
    writeFile(outputFilename, codeGen.generatedCode + "\n");

}

const optionDefinitions = [
    {
        name: 'help',
        alias: 'h',
        type: Boolean,
        description: 'Display this usage guide.'
    },
    {
        name: 'input',
        alias: 'i',
        type: String,
        multiple: false,
        description: 'The Typescript file to transpile',
        typeLabel: '<example.ts>'
    },
    {
        name: 'output',
        alias: 'o',
        type: String,
        description: 'Filename to output as, will infer language from this setting',
        typeLabel: '<f.cpp, f.cs, f.go, f.java, f.php, f.pl, f.py, f.rb, f.swift>'
    },
    {
        name: 'all',
        alias: 'a',
        type: String,
        description: 'Output file to all possible languages',
        typeLabel: '<Filename>'
    },

];

const options = commandLineArgs(optionDefinitions);


if (Object.keys(options).length == 0 || options.help) {
    const usage = commandLineUsage([
        {
            header: 'OneLang',
            content: 'Transpiles Typescript file into\n C++, C#, Go, Java, Javascript, Perl, PHP, Python, Ruby, Swift\n'
        },
        {
            header: 'Options',
            optionList: optionDefinitions
        },
        {
            content: 'node app.js -i input.ts -o output.py\n\n\nProject home: {underline https://github.com/koczkatamas/onelang}'
        }
    ]);
    console.log(usage);
} else if (options.input === undefined) {
    console.log("Please specify input file with -i filename.ts");
    process.exit(-1);
} else {
    const overlayCode = readFile(`langs/NativeResolvers/typescript.ts`);
    const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
    const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);
    const compiler = new OneCompiler();
    compiler.setup(overlayCode, stdlibCode, genericTransforms);
    const programCode = readFile(options['input']).replace(/\r\n/g, '\n');
    if (options.all === undefined) {
        const outputFilename = options['output'];
        singleOutput(compiler, outputFilename, programCode);
    } else {
        const outputFilename = options['all'];
        outputAll(compiler, outputFilename, programCode);
    }
}

