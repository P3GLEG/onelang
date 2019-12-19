import {OneAst as one} from "./Ast";
import {TypeScriptParser} from "../Parsers/TypeScriptParser";
import {SchemaTransformer} from "./SchemaTransformer";
import {FillNameTransform} from "./Transforms/FillNameTransform";
import {FillParentTransform} from "./Transforms/FillParentTransform";
import {FillMetaPathTransform} from "./Transforms/FillMetaPathTransform";
import {ResolveIdentifiersTransform} from "./Transforms/ResolveIdentifiersTransform";
import {InferTypesTransform} from "./Transforms/InferTypesTransform";
import {InlineOverlayTypesTransform} from "./Transforms/InlineOverlayTypesTransform";
import {ConvertInlineThisRefTransform} from "./Transforms/ConvertInlineThisRefTransform";
import {InferCharacterTypes} from "./Transforms/InferCharacterTypes";
import {SchemaContext} from "./SchemaContext";
import {OverviewGenerator} from "./OverviewGenerator";
import {AstHelper} from "./AstHelper";
import {SchemaCaseConverter} from "./Transforms/CaseConverter";
import {LangFileSchema} from "../Generator/LangFileSchema";
import {CodeGenerator} from "../Generator/CodeGenerator";
import {FillVariableMutability} from "./Transforms/FillVariableMutability";
import {TriviaCommentTransform} from "./Transforms/TriviaCommentTransform";
import {GenericTransformer, GenericTransformerFile} from "./Transforms/GenericTransformer";
import {FillThrowsTransform} from "./Transforms/FillThrowsTransform";
import {RemoveEmptyTemplateStringLiterals} from "./Transforms/RemoveEmptyTemplateStringLiterals";
import {FixGenericAndEnumTypes} from "./Transforms/FixGenericAndEnumTypes";
import {IParser} from "../Parsers/Common/IParser";
import {ExtractCommentAttributes} from "./Transforms/ExtractCommentAttributes";
import {ForceTemplateStrings} from "./Transforms/ForceTemplateStrings";
import {WhileToForTransform} from "./Transforms/WhileToFor";
import {ProcessTypeHints} from "./Transforms/ProcessTypeHints";
import {LangFilePreprocessor} from "../Generator/LangFilePreprocessor";
import {parse} from "yamljs";

//declare var YAML: any;

SchemaTransformer.instance.addTransform(new FillNameTransform());
SchemaTransformer.instance.addTransform(new FillParentTransform());
SchemaTransformer.instance.addTransform(new FillMetaPathTransform());
SchemaTransformer.instance.addTransform(new InlineOverlayTypesTransform());
SchemaTransformer.instance.addTransform(new ConvertInlineThisRefTransform());
SchemaTransformer.instance.addTransform(new TriviaCommentTransform());
SchemaTransformer.instance.addTransform(new InferCharacterTypes());

export class OneCompiler {
    parser: IParser;
    schemaCtx: SchemaContext;
    overlayCtx: SchemaContext;
    stdlibCtx: SchemaContext;
    genericTransformer: GenericTransformer;
    langName: string;

    saveSchemaStateCallback: (type: "overviewText" | "schemaJson", schemaType: "program" | "overlay" | "stdlib", name: string, data: string) => void;

    static parseLangSchema(langYaml: string, stdlib: one.Schema) {
        const schema = <LangFileSchema.LangFile>parse(langYaml);
        LangFilePreprocessor.preprocess(schema, stdlib);
        return schema;
    }

    setup(overlayCode: string, stdlibCode: string, genericTransformerYaml: string) {
        overlayCode = overlayCode.replace(/^[^\n]*<reference.*stdlib.d.ts[^\n]*\n/, "");

        const overlaySchema = TypeScriptParser.parseFile(overlayCode);
        const stdlibSchema = TypeScriptParser.parseFile(stdlibCode);
        this.genericTransformer = new GenericTransformer(<GenericTransformerFile>parse(genericTransformerYaml));

        overlaySchema.sourceType = "overlay";
        stdlibSchema.sourceType = "stdlib";

        this.stdlibCtx = new SchemaContext(stdlibSchema, "stdlib");
        new FixGenericAndEnumTypes().process(this.stdlibCtx.schema);
        this.saveSchemaState(this.stdlibCtx, "0_Original");

        this.stdlibCtx.ensureTransforms("fillName", "fillMetaPath", "fillParent");
        ResolveIdentifiersTransform.transform(this.stdlibCtx);
        new InferTypesTransform(this.stdlibCtx).transform();
        this.saveSchemaState(this.stdlibCtx, "0_Converted");

        this.overlayCtx = new SchemaContext(overlaySchema, "overlay");
        this.overlayCtx.addDependencySchema(this.stdlibCtx);
        new FixGenericAndEnumTypes().process(this.overlayCtx.schema);
        this.saveSchemaState(this.overlayCtx, "0_Original");

        this.overlayCtx.ensureTransforms("fillName", "fillMetaPath", "fillParent");
        ResolveIdentifiersTransform.transform(this.overlayCtx);
        new InferTypesTransform(this.overlayCtx).transform();
        this.overlayCtx.ensureTransforms("convertInlineThisRef");
        this.saveSchemaState(this.overlayCtx, "1_Converted");
    }

    /**
     * Schema types:
     *  - program: the input program to be compiled into another language
     *  - overlay: helper classes which map the input language's built-in methods / properties to OneLang methods (eg. Object.keys(map) -> map.keys())
     *  - stdlib: declaration (not implementation!) of OneLang methods (eg. map.keys) which are implemented in every language separately
     */
    parse(langName: string, programCode: string) {
        this.langName = langName;
        let arrayName: string;
        if (langName === "typescript") {
            this.parser = new TypeScriptParser(programCode);
        } else {
            throw new Error(`[OneCompiler] Unsupported language: ${langName}`);
        }

        const schema = this.parser.parse();

        // TODO: hack
        this.overlayCtx.schema.classes[this.parser.langData.literalClassNames.array].meta = {iterable: true};
        this.stdlibCtx.schema.classes["OneArray"].meta = {iterable: true};
        this.stdlibCtx.schema.classes["OneError"].methods["raise"].throws = true;

        schema.sourceType = "program";

        this.schemaCtx = new SchemaContext(schema, "program");
        // TODO: move to somewhere else...
        this.schemaCtx.arrayType = this.parser.langData.literalClassNames.array;
        this.schemaCtx.mapType = this.parser.langData.literalClassNames.map;

        new RemoveEmptyTemplateStringLiterals().process(this.schemaCtx.schema);
        new FixGenericAndEnumTypes().process(this.schemaCtx.schema);
        new ExtractCommentAttributes().process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `0_Original`);

        this.genericTransformer.process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `1_GenericTransforms`);

        this.schemaCtx.addDependencySchema(this.overlayCtx);
        this.schemaCtx.addDependencySchema(this.stdlibCtx);
        this.schemaCtx.ensureTransforms("fillName", "fillMetaPath", "fillParent");
        ResolveIdentifiersTransform.transform(this.schemaCtx);
        new InferTypesTransform(this.schemaCtx).transform();
        this.saveSchemaState(this.schemaCtx, `2_TypesInferred`);

        this.schemaCtx.ensureTransforms("inlineOverlayTypes");
        this.saveSchemaState(this.schemaCtx, `3_OverlayTypesInlined`);

        this.schemaCtx.ensureTransforms("triviaComment");
        this.saveSchemaState(this.schemaCtx, `4_ExtendedInfoAdded`);

        this.schemaCtx.arrayType = "OneArray";
        this.schemaCtx.mapType = "OneMap";

        new InferTypesTransform(this.schemaCtx).transform();
        this.schemaCtx.ensureTransforms("inferCharacterTypes");
        this.saveSchemaState(this.schemaCtx, `5_TypesInferredAgain`);

        if (!this.schemaCtx.schema.langData.supportsTemplateStrings)
            new ForceTemplateStrings().transform(this.schemaCtx);

        if (!this.schemaCtx.schema.langData.supportsFor)
            new WhileToForTransform().transform(this.schemaCtx);

        new ProcessTypeHints().transform(this.schemaCtx);

        this.saveSchemaState(this.schemaCtx, `6_PostProcess`);
    }

    getCodeGenerator(lang: LangFileSchema.LangFile) {
        new SchemaCaseConverter(lang.casing).process(this.schemaCtx.schema);
        new SchemaCaseConverter(lang.casing).process(this.stdlibCtx.schema);
        new FillVariableMutability(lang).process(this.schemaCtx.schema);
        new FillThrowsTransform(lang).process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `10_${lang.name ? `${lang.name}_` : ""}Init`);

        const codeGen = new CodeGenerator(this.schemaCtx.schema, this.stdlibCtx.schema, lang);
        return codeGen;
    }

    compile(langCode: string, callTestMethod = true, genMeta = false) {
        const lang = OneCompiler.parseLangSchema(langCode, this.stdlibCtx.schema);
        const codeGen = this.getCodeGenerator(lang);
        codeGen.model.config.genMeta = genMeta;
        const generatedCode = codeGen.generate(callTestMethod);
        return generatedCode;
    }

    protected saveSchemaState(schemaCtx: SchemaContext, name: string) {
        if (!this.saveSchemaStateCallback) return;

        const schemaOverview = new OverviewGenerator().generate(schemaCtx);
        this.saveSchemaStateCallback("overviewText", schemaCtx.schema.sourceType, name, schemaOverview);

        const schemaJson = AstHelper.toJson(schemaCtx.schema);
        this.saveSchemaStateCallback("schemaJson", schemaCtx.schema.sourceType, name, schemaJson);
    }
}