import BasicGraphObject from "./BasicGraphObject";
import { BasicProps, Propable } from "./Propable";
import Vertex from "./Vertex";
import YAML from "yaml";

export default class Edge extends BasicGraphObject {
    source: string;
    target: string;
    edgeType: string;
    id() {
        return `${this.source}-${this.edgeType}-${this.target}`;
    }
    getId() {
        return `${this.source}-${this.edgeType}-${this.target}`;
    }

    constructor(source: string | Vertex, target: string | Vertex, edgeType: string){
        super();
        if (source instanceof Vertex) this.source = source.id;
        else this.source = source;
        if (target instanceof Vertex) this.target = target.id;
        else this.target = target;
        this.edgeType = edgeType;
    }
    
    serialize(): string {
        return super.serialize();
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