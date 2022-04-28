import AverGraph from "../AverGraph";
import Edge from "../Edge";
import { Propable } from "../Propable";
import Vertex from "../Vertex";
import GraphSerializer, { KeyValuePersistance } from "./GraphSerializer";

const entityMap = ["vertex","edge"]

export default class YmlSerializer extends GraphSerializer {
    deserialize(data: string): AverGraph {
        let graph = new AverGraph();
        let [verticesString, edgeString] = data.split("\nedges:\n");
        // strictEqual(verticesString.startsWith("vertices:\n"),true);
        verticesString = verticesString.split("vertices:\n")[1];
        this.deserializeObjects(graph, verticesString, "vertex");

        // strictEqual(verticesString.length > 0, true);
        // strictEqual(typeof edgeString, "string");
        // strictEqual(edgeString.length > 0, true);
        this.deserializeObjects(graph, edgeString, "edge");

        return graph
    }

    deserializeObjects(graph: AverGraph, data: string, type: "vertex"|"edge"){
        let rows: string[] = [];
        let rawRows = data.split("\n")
        let id: string;
        let cursor: string;
        let parser: (g: AverGraph, data: string[])=>void; 

        if(type == "vertex") parser = this.deserializeVertex.bind(this);
        else parser = this.deserializeEdge.bind(this);

        while(rawRows.length>0){
            cursor = rawRows.shift();
            if(cursor.startsWith("    ")) {
                rows.push(cursor)
            } else {
                if(rows.length > 0){
                    parser(graph, rows);
                    rows = [];
                }
                // strictEqual(cursor.endsWith(":"), true);
                id = cursor.trim();
                id = id.substring(0,id.length-1);
            }
        }
        if(rows.length > 0){
            parser(graph, rows);
        }
    }

    loadGraph(data: KeyValuePersistance[]): AverGraph {
        let g = new AverGraph();
        data.sort((a,b)=>{
            return entityMap.indexOf(a.key[0]) - entityMap.indexOf(b.key[0])
        })
        for(let o of data){
            if(o.key[0] == "vertex") this.deserializeVertex(g, o.value.split("\n"));
            if(o.key[0] == "edge") this.deserializeEdge(g, o.value.split("\n"));
        }
        return g;
    }
    serialize(graph: AverGraph): string {
        let v = this.prepareVertexData(graph);
        let e = this.prepareEdgeData(graph);
        let vertices = v.map(x=>[x.key[1]+":",...x.value.split("\n").map(y=>"  "+y)]).flat();
        let edges = e.map(x=>[x.key[1]+":",...x.value.split("\n").map(y=>"  "+y)]).flat();
        return [
            "vertices:",
            ...vertices.map(x=>"  "+x),
            "edges:",
            ...edges.map(x=>"  "+x)
        ].join("\n")
    }
    prepareToPersist(graph: AverGraph): KeyValuePersistance[] {
        return [
            ...this.prepareVertexData(graph),
            ...this.prepareEdgeData(graph)
        ];
    }

    private prepareVertexData(graph: AverGraph): KeyValuePersistance[] {
        let result: KeyValuePersistance[] = [];
        for(let v of Object.values(graph.vertexById)){
            let value = this.serializeVertex(v).join("\n");
            let key = ["vertex",v.getId()];
            result.push({key, value});
        }
        return result;
    }

    private prepareEdgeData(graph: AverGraph): KeyValuePersistance[] {
        let result: KeyValuePersistance[] = [];
        for(let e of Object.values(graph.edgeById)){
            let value = this.serializeEdge(e).join("\n");
            let key = ["edge",e.getId()];
            result.push({key, value});
        }
        return result;
    }

    private serializeEdge(e: Edge): string[] {
        let sp = this.serializeProps(e);
        return [
            `source: ${e.source}`,
            `edgeType: ${e.edgeType}`,
            `target: ${e.target}`,
            ...sp
        ]
    }

    private deserializeEdge(graph: AverGraph, data: string[]){
        // strictEqual(data[0].trim().startsWith("source: "), true);
        // strictEqual(data[1].trim().startsWith("edgeType: "), true);
        // strictEqual(data[2].trim().startsWith("target: "), true);
        let sourceString = data.shift().trim();
        let source = this.decodeYmlRow(sourceString).value;
        let edgeTypeString = data.shift().trim();
        let edgeType = this.decodeYmlRow(edgeTypeString).value;
        let targetString = data.shift().trim();
        let target = this.decodeYmlRow(targetString).value;
        let e = graph.createEdge(source,target,edgeType);
        data.shift();
        this.deserializeProps(data, e);
    }

    private serializeVertex(v: Vertex): string[]{
        let sp = this.serializeProps(v);
        return [
            `id: ${v.id}`,
            `class: ${v.class}`,
            ...sp
        ]
    }

    private deserializeVertex(graph: AverGraph,data: string[]){
        // strictEqual(data[0].trim().startsWith("id: "), true);
        // strictEqual(data[1].trim().startsWith("class: "), true);
        let idString = data.shift().trim();
        let id = this.decodeYmlRow(idString).value;
        let classString = data.shift().trim();
        let cls = this.decodeYmlRow(classString).value;
        let v = graph.createVertex(id, cls);
        data.shift();
        this.deserializeProps(data, v);
    }

    private deserializeProps(data: string[], p: Propable){
        for(let row of data){
            let {key, value} = this.decodeYmlRow(row);
            p.setProp(key,value);
        }
    }

    private serializeProps(p: Propable): string[]{
        if(!p.getProps()) return [];
        let keys = p.getProps().keys();
        keys.sort();
        return ['props:',...keys.map(x=>`  ${x}: ${encodeURIComponent(p.getProp(x))}`)];
    }

    private decodeYmlRow(row: string):{key: string, value: string} {
        row = row.trim();
        let i = row.indexOf(": ");
        let key = row.substring(0,i);
        let value = decodeURIComponent(row.substring(i+2));
        return {key, value};
    }
}