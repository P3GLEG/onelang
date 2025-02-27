import {ISchemaTransform} from "./../SchemaTransformer";
import {SchemaContext} from "../SchemaContext";

export class FillNameTransform implements ISchemaTransform {
    name = "fillName";

    transform(schemaCtx: SchemaContext) {
        const schema = schemaCtx.schema;

        for (const globName of Object.keys(schema.globals))
            schema.globals[globName].name = globName;

        for (const enumName of Object.keys(schema.enums))
            schema.enums[enumName].name = enumName;

        for (const intfName of Object.keys(schema.interfaces))
            schema.interfaces[intfName].name = intfName;

        for (const className of Object.keys(schema.classes)) {
            const cls = schema.classes[className];
            cls.name = className;

            if (cls.constructor)
                cls.constructor.name = "constructor";

            for (const propName of Object.keys(cls.properties))
                cls.properties[propName].name = propName;

            for (const fieldName of Object.keys(cls.fields))
                cls.fields[fieldName].name = fieldName;

            for (const methodName of Object.keys(cls.methods))
                cls.methods[methodName].name = methodName;
        }
    }
}