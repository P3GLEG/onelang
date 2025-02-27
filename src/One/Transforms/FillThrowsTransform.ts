import {OneAst as one} from "../Ast";
import {AstVisitor} from "../AstVisitor";
import {AstHelper} from "../AstHelper";
import {LangFileSchema} from "../../Generator/LangFileSchema";

export class FillThrowsTransform extends AstVisitor<void> {
    throws: boolean;

    constructor(public lang: LangFileSchema.LangFile) {
        super();
    }

    process(schema: one.Schema) {
        this.visitSchema(schema, null);
    }

    protected visitCallExpression(callExpr: one.CallExpression) {
        const method = AstHelper.getMethodFromRef(this.lang, <one.MethodReference>callExpr.method);
        if (method && method.throws)
            this.throws = true;

        super.visitCallExpression(callExpr, null);
    }

    protected visitMethodLike(method: one.Method | one.Constructor) {
        this.throws = false;
        super.visitMethodLike(method, null);
        method.throws = this.throws;
    }
}