import {AstVisitor} from "../AstVisitor";
import {ISchemaTransform} from "../SchemaTransformer";
import {OneAst as one} from "../Ast";
import {SchemaContext} from "../SchemaContext";

export class FillParentTransform extends AstVisitor<any> implements ISchemaTransform {
    name: string = "fillParent";

    transform(schemaCtx: SchemaContext) {
        const schema = schemaCtx.schema;
        this.visitSchema(schema, schema);
    }

    protected visitExpression(expression: one.Expression, parent: any) {
        expression.parentRef = parent;
        super.visitExpression(expression, expression);
    }

    protected visitStatement(statement: one.Statement, parent: any) {
        statement.parentRef = parent;
        super.visitStatement(statement, statement);
    }

    protected visitBlock(block: one.Block, parent: any) {
        block.parentRef = parent;
        super.visitBlock(block, block);
    }

    protected visitMethodLike(method: one.Method | one.Constructor, parent: any) {
        method.classRef = parent;
        super.visitMethodLike(method, method);
    }

    protected visitField(field: one.Field, parent: any) {
        field.classRef = parent;
        super.visitField(field, parent);
    }

    protected visitProperty(prop: one.Property, parent: any) {
        prop.classRef = parent;
        super.visitProperty(prop, parent);
    }

    protected visitInterface(intf: one.Interface, parent: any) {
        intf.schemaRef = parent;
        super.visitInterface(intf, intf);
    }

    protected visitClass(cls: one.Class, parent: any) {
        cls.schemaRef = parent;
        super.visitClass(cls, cls);
    }
}