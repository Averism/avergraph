import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import BasicGraphObject from "./BasicGraphObject";
import Edge from "./Edge";
import Hookable from "./Hookable";
import { isPropable, Propable } from "./Propable";
import Vertex from "./Vertex";

export type graphObjectOptions = {
    id?: string,
    idRegex?: string,
    hasProps?: string[],
    hasPropsWithValues?: {[labelName: string]: string}
}

export type getVertexOptions = graphObjectOptions & {
    class?: string
}

export type getEdgeOptions = graphObjectOptions & {
    source?: string,
    target?: string,
    edgeType?: string
}

function intersect(a: any[], b: any[]){
    let base = a.length<b.length?a:b;
    let other = a.length<b.length?new Set(b):new Set(a);
    return base.filter(x=>other.has(x));
}

export default class AverGraph implements Hookable {
    private vertexById: {[id: string]: Vertex} = {};
    private vertexByClass: {[id: string]: Vertex[]} = {};
    private edgeById: {[id: string]: Edge} = {};
    private propIndex: {[propKey: string]: {[id: string]:Propable}} = {};

    private searchObjectById<T extends BasicGraphObject>(container: {[id: string]: T}, options: graphObjectOptions): T[] {
        if(options.id) return [container[options.id]];
        if(options.idRegex) {
            let pattern = new RegExp(options.idRegex)
            return Object.keys(container).filter(x=>pattern.test(x)).map(x=>container[x]);
        }
    }

    private searchObjectByProps<T extends BasicGraphObject>(container: {[id: string]: T}, options: graphObjectOptions): T[] {
        let result: string[];
        if(options.hasProps) for(let propKey of options.hasProps){
            if(!result) result = Object.keys(this.propIndex[propKey])
            else result = intersect(result,Object.keys(this.propIndex[propKey]))
        }
        if(options.hasPropsWithValues) for(let propKey of Object.keys(options.hasPropsWithValues)){
            let propVal = options.hasPropsWithValues[propKey];
            if(!result) result = Object.values(this.propIndex[propKey]).filter(x=>x.getProp(propKey)==propVal).map(x=>x.getId());
            else result = intersect(result,Object.values(this.propIndex[propKey]).filter(x=>x.getProp(propKey)==propVal).map(x=>x.getId()));
        }
        return result.map(x=>container[x]).filter(x=>x);
    }


    private searchObject<T extends BasicGraphObject>(container: {[id: string]: T}, options: graphObjectOptions): T[] {
        let result: T[];
        if(options.id || options.idRegex) result = this.searchObjectById(container, options);
        if(options.hasProps || options.hasPropsWithValues){
            let tempResult = this.searchObjectByProps(container,options);
            if(result) result = intersect(result, tempResult);
            else result = tempResult;
        }
        return result;
    }

    callHook(fnName: string, ...params: any[]) {
        if(fnName == "connectTo" && params[0] instanceof Vertex && params[1] instanceof Vertex && typeof params[2] == "string")
            return this.createEdge(params[0], params[1], params[2]);
        if(fnName == "addProp" && isPropable(params[0]) && typeof params[1] == "string"){
            if(!this.propIndex[params[1]]) this.propIndex[params[1]] = {};
            this.propIndex[params[1]][params[0].getId()] = params[0];
        }
        if(fnName == "removeProp" && isPropable(params[0]) && typeof params[1] == "string"){
            if(!this.propIndex[params[1]]) this.propIndex[params[1]] = {};
            delete this.propIndex[params[1]][params[0].getId()];
        }
    }
    getVertex(option: getVertexOptions|string): Vertex{
        if(!option) throw new Error("option must not be null");
        let o: getVertexOptions = {};
        if(typeof option == "string") o.id = option;
        else o = option;
        let result = this.getVertices(o);
        if(result) return result[0];
    }
    getVertices(option: getVertexOptions): Vertex[]{
        if(!option) throw new Error("option must not be null");
        let result = this.searchObject<Vertex>(this.vertexById,option);
        if(option.class)
            if(result) result = intersect(result, this.vertexByClass[option.class])
            else result = this.vertexByClass[option.class];
        return result;
    }
    getEdge(option: getEdgeOptions): Edge{
        let result = this.getEdges(option);
        if(result) return result[0];
    }
    getEdges(option: getEdgeOptions): Edge[]{
        if(!option) throw new Error("option must not be null");
        let result = this.searchObject<Edge>(this.edgeById,option);
        let tempResult: Edge[];
        if(option.source){
            let v = this.getVertex(option.source);
            let et = option.edgeType?[option.edgeType]:Object.keys(v.vOut);
            let t = et.map(x=>{
                let vo = v.vOut[x];
                if(option.target) vo=vo.filter(y=>y==option.target)
                return vo.map(y=>`${option.source}-${x}-${y}`)
            }).flat();
            tempResult = t.map(x=>this.edgeById[x]);
        }else if(option.target){
            let v = this.getVertex(option.target);
            let et = option.edgeType?[option.edgeType]:Object.keys(v.vIn);
            let t = et.map(x=>v.vIn[x].map(y=>`${y}-${x}-${option.target}`)).flat();
            tempResult = t.map(x=>this.edgeById[x]);
        }else if(option.edgeType){
            tempResult = this.searchObject<Edge>(this.edgeById,{idRegex: `-${option.edgeType}-`});
        }
        if(tempResult)
            if(result) result = intersect(result, tempResult)
            else result = tempResult;
        return result;
    }
    createVertex(id: string, vertexClass: string): Vertex{
        let v: Vertex = new Vertex(id, vertexClass);
        this.vertexById[id] = v;
        if(this.vertexByClass[vertexClass]) this.vertexByClass[vertexClass].push(v);
        else this.vertexByClass[vertexClass] = [v];
        v.hook=this;
        return v;
    }
    createEdge(source: string | Vertex, target: string | Vertex, edgeType: string): Edge{
        let v1 = source instanceof Vertex? source : this.vertexById[source];
        let v2 = target instanceof Vertex? target : this.vertexById[target];
        if(!v1 || !v2) throw new Error(`cannot create edge (${v1},${v2}) on uncreated vertex`);
        if(typeof v1.vOut == "undefined") v1.vOut = {}
        if(typeof v1.vOut[edgeType] == "undefined") v1.vOut[edgeType] = [];
        if(v1.vOut[edgeType].indexOf(v2.getId())==-1) v1.vOut[edgeType].push(v2.getId())
        if(typeof v2.vIn == "undefined") v2.vIn = {}
        if(typeof v2.vIn[edgeType] == "undefined") v2.vIn[edgeType] = [];
        if(v2.vIn[edgeType].indexOf(v1.getId())==-1) v2.vIn[edgeType].push(v1.getId())
        let e: Edge = new Edge(source, target, edgeType);
        this.edgeById[e.id()] = e;
        e.hook=this;
        return e;
    }
    saveToFiles(basepath: string):void {
        for(let v of Object.values(this.vertexById) ) {
            let content = v.serialize();
            if(!existsSync(basepath)) mkdirSync(basepath)
            if(!existsSync(path.join(basepath,"vertex"))) mkdirSync(path.join(basepath,"vertex"))
            writeFileSync(path.join(basepath,"vertex",v.id+".yml"),content);
        }
        for(let e of Object.values(this.edgeById) ) {
            if(!e.props) continue;
            let content = e.serialize();
            if(!existsSync(basepath)) mkdirSync(basepath)
            if(!existsSync(path.join(basepath,"edge"))) mkdirSync(path.join(basepath,"edge"))
            writeFileSync(path.join(basepath,"edge",e.id()+".yml"),content);
        }
    }
    loadFromFiles(basepath: string): void {
        let vFiles = readdirSync(path.join(basepath,"vertex"));
        for(let vFile of vFiles) {
            let v = Vertex.deserialize(readFileSync(path.join(basepath,"vertex",vFile)).toString());
            this.vertexById[v.getId()] = v;
            v.hook=this;
        }
        let eFiles = readdirSync(path.join(basepath,"edge"));
        for(let eFile of eFiles) {
            let e = Edge.deserialize(readFileSync(path.join(basepath,"edge",eFile)).toString());
            this.edgeById[e.getId()] = e;
            e.hook=this;
        }
        for(let v of Object.values(this.vertexById)) {
            if(v.getProps())
                this.indexProp(v);
            if(!v.vOut) continue;
            let tuple = v.getTuple("out");
            for(let t of tuple){
                let e = this.edgeById[`${v.getId()}-${t.edgeType}-${t.vId}`];
                if(typeof e == "undefined")
                    e = this.createEdge(v.getId(),t.vId,t.edgeType);
                if(e.getProps()){
                    this.indexProp(e);
                }
            }
        }
        // end load from files
    }

    private indexProp(o: Propable){
        for(let propKey of o.getProps().keys()){
            this.callHook("addProp",o,propKey);
        }
    }
}