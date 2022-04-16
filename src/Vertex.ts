import YAML from "yaml"
import { Pair } from "yaml/types";
import { Propable, Props } from "./Propable";
import BasicProps from "./BasicProps";
import Hookable from "./Hookable";

const keyIndex=["id","class","vIn","vOut","props"];
const idRestriction=/^\w+$/

export default class Vertex implements Propable {
    id: string;
    class: string;
    props: BasicProps;
    vIn: {[edgeType: string]: string[]};
    vOut: {[edgeType: string]: string[]};
    hook: Hookable;

    constructor(id: string, vertexClass: string){
        if(!idRestriction.test(id)) throw new Error(`invalid id:${id} - only alphanumeric and underscore allowed`);
        this.id = id;
        this.class = vertexClass;
    }
    getId(): string {
        return this.id;
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

    connectTo(target:Vertex, edgeType: string="default") {
        if(!this.vOut) this.vOut={};
        if(this.vOut[edgeType]) {
            if(this.vOut[edgeType].indexOf(target.id)==-1)
                this.vOut[edgeType].push(target.id);
        } else {
            this.vOut[edgeType] = [target.id];
        }
        if(!target.vIn) target.vIn={};
        if(target.vIn[edgeType]) {
            if(target.vIn[edgeType].indexOf(this.id)==-1)
                target.vIn[edgeType].push(this.id);
        } else {
            target.vIn[edgeType] = [this.id];
        }
        if(this.hook) this.hook.callHook("connectTo",this,target,edgeType);
    }

    serialize(): string {
        if(this.vIn) Object.keys(this.vIn).forEach(key=>{
            this.vIn[key].sort()
        });
        if(this.vOut) Object.keys(this.vOut).forEach(key=>{
            this.vOut[key].sort()
        });
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

    static deserialize(serialized:string): Vertex{
        let o = YAML.parse(serialized);
        let result = new Vertex(o.id, o.class);
        if(o.vIn) result.vIn = o.vIn;
        if(o.vOut) result.vOut = o.vOut;
        if(o.props) {
            result.props = new BasicProps(null,null);
            result.props.items = o.props.items;
        }
        return result;
    }
}