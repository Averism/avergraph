import AverGraph from "./AverGraph";
import Edge from "./Edge";
import { Propable } from "./Propable";
import Vertex from "./Vertex";

export type DiffChange = {
    type: "add" | "modify" | "remove"
    before: string,
    after: string
}

export type DiffInfo  = {[key:string]: DiffChange}

type DiffParam = {
    o1: Propable,
    o2: Propable,
    reverse: boolean,
    newO: Propable
}

type diffn = (param: DiffParam)=>boolean

export default class AverGraphDiff extends AverGraph {
    diffInfo: DiffInfo = {};
    g1: AverGraph;
    g2: AverGraph;
    constructor(g1: AverGraph, g2: AverGraph){
        super();
        this.g1 = g1;
        this.g2 = g2;
        let vertices = new Set<string>();
        let reverse = false;
        let newO: Propable = undefined;
        Object.keys(g1.vertexById).forEach(x=>vertices.add(x));
        Object.keys(g2.vertexById).forEach(x=>vertices.add(x));
        vertices.forEach(id=>{
            let o1 = g1.getVertex(id);
            let o2 = g2.getVertex(id);
            this.diffObj({o1, o2, reverse, newO});
        });
        let edges = new Set<string>();
        Object.keys(g1.edgeById).forEach(x=>edges.add(x));
        Object.keys(g2.edgeById).forEach(x=>edges.add(x));
        edges.forEach(id=>{
            let o1 = g1.getEdge({id});
            let o2 = g2.getEdge({id});
            this.diffObj({o1, o2, reverse, newO});
        });
    }


    private switchDiffParams(fn: diffn, param: DiffParam): boolean {
        return fn({
            o1: param.o2,
            o2: param.o1,
            reverse: !param.reverse,
            newO: param.newO
        });
    }
    // Create diff on o1 -> o2 or o2 -> o1 if reverse
    // o1 will be guaranteed no undefined
    private diffObj(param: DiffParam): boolean {
        // console.log("diffing", o1?o1.getId():undefined, o2?o2.getId():undefined)
        let {o1, o2, reverse}= param;
        let isO1Undefined = typeof o1=="undefined" && typeof o2!="undefined";
        if(isO1Undefined) return this.switchDiffParams(this.diffObj.bind(this),param);
        let id = o1.getId();
        let vid: string;
        let changed = false;
        if(o1 instanceof Vertex) {
            let res = this.diffVertex(param);
            param.newO = res.newO;
            changed = res.changed || changed;
            vid = id + `::${o1.class}`
        } else if(o1 instanceof Edge) {
            param.newO = this.createEdge(o1.source,o1.target,o1.edgeType);
            if(!o1 || !o2) changed = true;
        }
        changed = this.diffProps(param) || changed || !o2;
        if(!changed) return;
        if(o2) {
            this.diffInfo[id] = {
                type: "modify", 
                before: id,
                after: id
            };
        } else if (reverse) {
            this.diffInfo[id] = {
                type: "add", 
                before: undefined,
                after: o1 instanceof Vertex?vid:id
            };
        } else {
            this.diffInfo[id] = {
                type: "remove", 
                before: id,
                after: undefined
            };
        }
    }

    private diffVertex(param: DiffParam): {newO: Propable, changed: boolean} {            
        let vClass: string;
        let changed = false;
        let {o1, o2, reverse}= param;
        let id = o1.getId();
        if(! (o1 instanceof Vertex)) throw new Error("unexpected error, param must be instance of vertex")
        if(!(o2 instanceof Vertex) && o2) throw new Error("unexpected error, param must be instance of vertex")
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
        return {newO: this.createVertex(id,vClass), changed};
    }

    private diffProps(param: DiffParam): boolean{
        let hasChange: boolean = false;
        let {o1, o2, reverse, newO}= param;
        let bothIsDefined = typeof o1!="undefined" && typeof o2!="undefined";
        if( bothIsDefined && typeof o1.getProps()=="undefined" && typeof o2.getProps()=="undefined") 
            return false;
        if( bothIsDefined && typeof o1.getProps()=="undefined" && typeof o2.getProps()!="undefined") 
            return this.switchDiffParams(this.diffProps.bind(this), param)
        let id = o1.getId();
        let keys: string[]=o1.getProps()?o1.getProps().keys():[];
        for(let key of keys) {
            let changing = this.diffProp(key, o1, o2, reverse, newO);
            hasChange = changing || hasChange;
        }
        keys=o2&&o2.getProps()?o2.getProps().keys():[];
        for(let key of keys) 
            if(typeof this.diffInfo[`${id}.${key}`] == "undefined"){
                let changing = this.diffProp(key, o1, o2, reverse, newO);
                hasChange = changing || hasChange;
            }
        return hasChange;
    }

    private diffProp(key: string, o1: Propable, o2: Propable, reverse: boolean, newO: Propable): boolean{
        // console.log("diffing prop", key, o1?o1.getId():undefined, o2?o2.getId():undefined)
        let v1 = o1.getProp(key);
        let v2 = o2.getProp(key);
        let diffKey = `${reverse?o2.getId():o1.getId()}.${key}`;
        if(typeof v2 == "undefined" && reverse){
            this.diffInfo[diffKey] = {
                type: "add", 
                before: undefined, 
                after: v1};
            newO.setProp(key,v1);
            return true;
        } 
        if (typeof v2 == "undefined") {
            this.diffInfo[diffKey] = {
                type: "remove", 
                before: v1, 
                after: undefined};
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

export function applyGraphDiffTo(startingGraph: AverGraph, diff: DiffInfo) {
    if(!diff || Object.keys(diff).length == 0) return;
    let diffKeys = Object.keys(diff);
    let vertexDiffKey = diffKeys.filter(x=>!x.includes("-") && !x.includes("."))
    for(let key of vertexDiffKey) 
        applyVertexNoDeleteDiff(startingGraph, key, diff[key]);
    let vertexPropsDiffKey = diffKeys.filter(x=>!x.includes("-") && x.includes("."))
    for(let key of vertexPropsDiffKey) 
        applyPropsDiff(startingGraph, key, diff[key]);
    let edgeDiffKey = diffKeys.filter(x=>x.includes("-") && !x.includes("."))
    for(let key of edgeDiffKey) 
        applyEdgeDiff(startingGraph, key, diff[key]);
    let edgePropsDiffKey = diffKeys.filter(x=>x.includes("-") && x.includes("."))
    for(let key of edgePropsDiffKey) 
        applyPropsDiff(startingGraph, key, diff[key]);
    for(let key of vertexDiffKey) 
        applyVertexDeleteDiff(startingGraph, key, diff[key]);
}

function applyVertexNoDeleteDiff(startingGraph: AverGraph, id: string, diff: DiffChange) {
    // console.log(id,diff)
    let v: Vertex = startingGraph.getVertex(id);
    if(id.includes("::")) {
        let vId = id.split("::")[0];
        v = startingGraph.getVertex(vId);
        // console.log(vId, cls, v)
        if(diff.before != v.class) throw new Error(`diff conflict! expected class to be ${diff.before} got ${v.class}`);
        v.changeClass(diff.after);
        return;
    }
    if(diff.type == "add") {
        let cls = diff.after.split("::")[1];
        startingGraph.createVertex(id,cls);
        return;
    }
}

function applyVertexDeleteDiff(startingGraph: AverGraph, id: string, diff: DiffChange) {
    if(diff.type == "remove") {
        startingGraph.removeVertex(id);
        return;
    }
}

function applyPropsDiff(startingGraph: AverGraph, key: string, diff: DiffChange) {
    let splitId = key.split(".");
    let pId = splitId[0];
    let propKey = splitId[1];
    let p: Propable = startingGraph.getVertex(pId) || startingGraph.getEdge({id: pId});
    if(diff.type == "add" || diff.type == "modify") {
        if(diff.before != p.getProp(propKey)) 
            throw new Error(`diff conflict! expected prop ${propKey} value to be ${diff.before} got ${p.getProp(propKey)}`);
        p.setProp(propKey, diff.after);
        return;
    }
    if(diff.type == "remove") {
        p.deleteProp(propKey)
        return;
    }
}
function applyEdgeDiff(startingGraph: AverGraph, key: string, diff: DiffChange) {
    let[source,edgeType,target] = key.split('-');
    if(diff.type == "add" ) {
        startingGraph.createEdge(source,target,edgeType);
        return;
    }
    if(diff.type == "remove") {
        startingGraph.removeEdge(key);
        return;
    }
}

