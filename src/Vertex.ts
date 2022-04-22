import YAML from "yaml"
import { BasicProps, Propable } from "./Propable";
import BasicGraphObject from "./BasicGraphObject";
const idRestriction=/^\w+$/

export default class Vertex extends BasicGraphObject {
    id: string;
    class: string;
    vIn: {[edgeType: string]: string[]};
    vOut: {[edgeType: string]: string[]};

    constructor(id: string, vertexClass: string){
        super()
        if(!idRestriction.test(id)) throw new Error(`invalid id:${id} - only alphanumeric and underscore allowed`);
        this.id = id;
        this.class = vertexClass;
    }

    getTuple(type: "in"|"out"): {edgeType: string, vId: string}[] {
        let et = type=="in"?this.vIn:this.vOut;
        return Object.keys(et).map(x=>et[x].map(y=>{return {edgeType: x, vId: y}})).flat();
    }

    getId(): string {
        return this.id;
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

    changeClass(newClass: string){
        if(this.hook) this.hook.callHook("changeClass",this,newClass);
        this.class = newClass;
    }

    serialize(): string {
        if(this.vIn) Object.keys(this.vIn).forEach(key=>{
            this.vIn[key].sort()
        });
        if(this.vOut) Object.keys(this.vOut).forEach(key=>{
            this.vOut[key].sort()
        });
        return super.serialize();
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