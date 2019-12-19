import {OneAst as one} from "../../One/Ast";
import {NodeManager} from "./NodeManager";

export interface IParser {
    nodeManager: NodeManager;
    langData: one.ILangData;

    parse(): one.Schema;
}
