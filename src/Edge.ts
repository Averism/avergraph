import BasicGraphObject from "./BasicGraphObject";
import { BasicProps, Propable, Props } from "./Propable";
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

    setProp(key: string, value: string): void {
        if(!this.props) this.props = new BasicProps(key, value);
        else this.props.set(key,value);
        if(this.hook) this.hook.callHook("addProp",this,key);
    }
    getProp(key: string): string {
        if(!this.props) return;
        return this.props.get(key);
    }
    deleteProp(key: string): boolean {
        if(!this.props) return false;
        if(Object.keys(this.props.items).length==1 && typeof this.props.get(key) !== "undefined") 
            return delete this.props;
        if(this.hook) this.hook.callHook("removeProp",this,key);
        return this.props.delete(key);
    }
    getProps(): Props {
        return this.props;
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