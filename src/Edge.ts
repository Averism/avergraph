import YAML from "yaml"
import { Pair } from "yaml/types";
import BasicProps from "./BasicProps";
import Hookable from "./Hookable";
import { Propable, Props } from "./Propable";
import Vertex from "./Vertex";

const keyIndex=["edgeType","source","target","props"];

export default class Edge implements Propable {
    source: string;
    target: string;
    edgeType: string;
    props: BasicProps;
    hook: Hookable;
    id() {
        return `${this.source}-${this.edgeType}-${this.target}`;
    }
    getId() {
        return `${this.source}-${this.edgeType}-${this.target}`;
    }

    constructor(source: string | Vertex, target: string | Vertex, edgeType: string){
        if (source instanceof Vertex) this.source = source.id;
        else this.source = source;
        if (target instanceof Vertex) this.target = target.id;
        else this.target = target;
        this.edgeType = edgeType;
    }

    setProp(key: string, value: string): void {
        if(!this.props) this.props = new BasicProps(key, value);
        else this.props.set(key,value);
    }
    getProp(key: string): string {
        if(!this.props) return;
        return this.props.get(key);
    }
    deleteProp(key: string): boolean {
        if(!this.props) return false;
        if(Object.keys(this.props.items).length==1 && typeof this.props.get(key) !== "undefined") 
            return delete this.props;
        return this.props.delete(key);
    }
    getProps(): Props {
        return this.props;
    }
    
    serialize(): string {
        let tempHook = this.hook;
        delete this.hook;
        let result = YAML.stringify(this, {sortMapEntries: (a: Pair, b:Pair): number=>{
            let a1 = keyIndex.indexOf(a.key.value);
            let b1 = keyIndex.indexOf(b.key.value);
            if(a1 > -1 && b1 > -1)
                return a1-b1;
            else if(a>b) return 1 
                 else return -1
        }});
        this.hook = tempHook;
        return result;
    }

    static deserialize(serialized:string): Edge{
        let o = YAML.parse(serialized);
        let result = new Edge(o.source, o.target, o.edgeType);
        if(o.props) {
            result.props = new BasicProps(null,null);
            result.props.items = o.props.items;
        }
        return result;
    }
}