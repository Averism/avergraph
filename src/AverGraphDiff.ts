import AverGraph from "./AverGraph";
import BasicGraphObject from "./BasicGraphObject";
import Edge from "./Edge";
import { Propable } from "./Propable";
import Vertex from "./Vertex";

export type DiffChange = {
    type: "add" | "modify" | "remove"
    before: string,
    after: string
}

export type DiffInfo  = {[key:string]: DiffChange}

export default class AverGraphDiff extends AverGraph {
    diffInfo: DiffInfo = {};
    g1: AverGraph;
    g2: AverGraph;
    constructor(g1: AverGraph, g2: AverGraph){
        super();
        this.g1 = g1;
        this.g2 = g2;
        let vertices = new Set<string>();
        Object.keys(g1.vertexById).forEach(x=>vertices.add(x));
        Object.keys(g2.vertexById).forEach(x=>vertices.add(x));
        vertices.forEach(id=>{
            let o1 = g1.getVertex(id);
            let o2 = g2.getVertex(id);
            this.diffObj(o1,o2,false);
        });
        let edges = new Set<string>();
        Object.keys(g1.edgeById).forEach(x=>edges.add(x));
        Object.keys(g2.edgeById).forEach(x=>edges.add(x));
        edges.forEach(id=>{
            let o1 = g1.getEdge({id});
            let o2 = g2.getEdge({id});
            this.diffObj(o1,o2,false);
        });
    }

    // Create diff on o1 -> o2 or o2 -> o1 if reverse
    // o1 will be guaranteed no undefined
    private diffObj(o1: BasicGraphObject, o2: BasicGraphObject, reverse: boolean): void {
        // console.log("diffing", o1?o1.getId():undefined, o2?o2.getId():undefined)
        if(typeof o1=="undefined" && typeof o2!="undefined") {
            this.diffObj(o2,o1,true);
            return;
        }
        let id = o1.getId();
        let newO: Propable;
        let changed = false;
        if(o1 instanceof Vertex) {
            let vClass: string;
            if(o1 && o2 && o1.class!=(o2 as Vertex).class){
                vClass = reverse? o1.class: (o2 as Vertex).class
                this.diffInfo[`${id}::class`] = {
                    type: "modify", 
                    before: reverse?(o2 as Vertex).class: o1.class, 
                    after: vClass
                };
                changed = true;
            } else if(!o2) {
                vClass = o1.class;
            }
            newO = this.createVertex(id,vClass);
        } else if(o1 instanceof Edge) {
            newO = this.createEdge(o1.source,o1.target,o1.edgeType);
            if(!o1 || !o2) changed = true;
        }
        changed = this.diffProps(o1,o2,reverse,newO) || changed || !o2;
        if(o2 && changed) {
            this.diffInfo[id] = {
                type: "modify", 
                before: id,
                after: id
            };
        } else if (changed) {
            this.diffInfo[id] = {
                type: reverse?"add":"remove", 
                before: reverse? undefined:id,
                after: !reverse? undefined:id
            };
        }
    }

    private diffProps(o1: Propable, o2: Propable, reverse: boolean, newO: Propable): boolean{
        let hasChange: boolean = false;
        if(typeof o1!="undefined" && typeof o2!="undefined" && typeof o1.getProps()=="undefined" && typeof o2.getProps()=="undefined") 
            return false;
        if(typeof o1!="undefined" && typeof o2!="undefined" && typeof o1.getProps()=="undefined" && typeof o2.getProps()!="undefined") 
            return this.diffProps(o2,o1,true, newO);
        let keys: string[]=o1.getProps()?o1.getProps().keys():[];
        for(let key of keys) 
            hasChange = this.diffProp(key, o1, o2, reverse, newO) || hasChange;
        keys=o2&&o2.getProps()?o2.getProps().keys():[];
        for(let key of keys) 
            if(typeof this.diffInfo[`${reverse?o2.getId():o1.getId()}.${key}`] == "undefined")
                hasChange = this.diffProp(key, o1, o2, reverse, newO) || hasChange;
        return hasChange;
    }

    private diffProp(key: string, o1: Propable, o2: Propable, reverse: boolean, newO: Propable): boolean{
        // console.log("diffing prop", key, o1?o1.getId():undefined, o2?o2.getId():undefined)
        let v1 = o1.getProp(key);
        let v2 = o2.getProp(key);
        let hasChange = false;
        if(typeof v2 == "undefined"){
            this.diffInfo[`${reverse?o2.getId():o1.getId()}.${key}`] = {
                type: reverse?"add":"remove", 
                before: reverse?undefined:v1, 
                after: reverse?v1:undefined};
            if(reverse) newO.setProp(key,v1);
            return true;
        }
        if(v1!=v2){
            this.diffInfo[`${reverse?o2.getId():o1.getId()}.${key}`] = {
                type: "modify", 
                before: reverse?v2:v1, 
                after: reverse?v1:v2};
            newO.setProp(key,reverse?v1:v2);
            return true;
        }
        return false;
    }
}