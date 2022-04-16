import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import Edge from "./Edge";
import Hookable from "./Hookable";
import Vertex from "./Vertex";

export type getVertexOptions = {
    id?: string
}

export type getEdgeOptions = {
    id?: string,
    source?: string,
    target?: string,
    edgeType?: string
}

export default class AverGraph implements Hookable {
    private vertexById: {[id: string]: Vertex} = {};
    private edgeById: {[id: string]: Edge} = {};

    callHook(fnName: string, ...params: any[]) {
        if(fnName == "connectTo" && params[0] instanceof Vertex && params[1] instanceof Vertex && typeof params[2] == "string")
            return this.createEdge(params[0], params[1], params[2]);
    }
    getVertex(option: getVertexOptions): Vertex{
        if(!option) throw "option must not be null";
        if(typeof option.id == "string") return this.vertexById[option.id];
        return;
    }
    getVertices(option: getVertexOptions): Vertex[]{
        return;
    }
    getEdge(option: getEdgeOptions): Edge{
        if(!option) throw "option must not be null";
        if(typeof option.id == "string") return this.edgeById[option.id];
        if(typeof option.source == "string" || typeof option.target == "string" || typeof option.edgeType == "string") 
            return this.edgeById[`${option.source}-${option.edgeType}-${option.target}`];
        return;
    }
    getEdges(option: getEdgeOptions): Edge[]{
        return;
    }
    createVertex(id: string, vertexClass: string): Vertex{
        let v: Vertex = new Vertex(id, vertexClass);
        this.vertexById[id] = v;
        v.hook=this;
        return v;
    }
    createEdge(source: string | Vertex, target: string | Vertex, edgeType: string): Edge{
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
            if(!v.vOut) continue;
            for(let edgeType of Object.keys(v.vOut)){
                for(let vOut of v.vOut[edgeType]){
                    if(typeof this.edgeById[`${v.getId()}-${edgeType}-${vOut}`] == "undefined")
                        this.createEdge(v.getId(),vOut,edgeType);
                }
            }
        }
        // end load from files
    }
}