import { strictEqual, throws } from "assert";
import { existsSync } from "fs";
import { join } from "path";
import AverGraph from "../src/AverGraph";
import Edge from "../src/Edge";
import rimraf from "rimraf";
import Vertex from "../src/Vertex";

describe("graph", ()=>{
    it("should create vertex and edges correctly", ()=>{
        let graph = new AverGraph();
        let v1 = graph.createVertex("v1", "default");
        let v2 = graph.createVertex("v2", "default");
        v1.connectTo(v2);
        let e1 = graph.getEdge({source: v1.id, target: v2.id, edgeType: "default"});
        strictEqual(graph.getVertex({id: v1.id}).serialize(), v1.serialize()); 
        strictEqual(e1 instanceof Edge, true);

        //negative tests
        strictEqual(graph.getVertex({}), undefined); 
        strictEqual(graph.getEdge({}), undefined); 
        throws(()=>graph.getVertex(null))
        throws(()=>graph.getEdge(null))

        //not yet implemented
        strictEqual(graph.getVertices({}), undefined); 
    });
    it("should saves to files correctly", async ()=>{
        let graph = new AverGraph();
        let v1 = graph.createVertex("v1", "default");
        let v2 = graph.createVertex("v2", "default");
        let v3 = graph.createVertex("v3", "default");
        v1.connectTo(v2);
        v2.connectTo(v3);
        graph.getEdge({source: v1.id, target: v2.id, edgeType: "default"}).setProp("p1","val1");
        let tempTestPath = join("test","temp");
        graph.saveToFiles(tempTestPath);
        strictEqual(existsSync(join(tempTestPath,"vertex","v1.yml")),true);
        strictEqual(existsSync(join(tempTestPath,"vertex","v2.yml")),true);
        strictEqual(existsSync(join(tempTestPath,"vertex","v3.yml")),true);
        strictEqual(existsSync(join(tempTestPath,"edge","v1-default-v2.yml")),true);
        strictEqual(existsSync(join(tempTestPath,"edge","v2-default-v3.yml")),false);
        return Promise.resolve();
    });
    it("should load from files correctly", async ()=>{
        let graph = new AverGraph();
        graph.loadFromFiles(join("test","temp"));
        strictEqual(graph.getVertex({id: "v1"}) instanceof Vertex, true);
        strictEqual(graph.getVertex({id: "v2"}) instanceof Vertex, true);
        strictEqual(graph.getVertex({id: "v3"}) instanceof Vertex, true);
        strictEqual(graph.getEdge({source: "v1", target: "v2", edgeType: "default"}) instanceof Edge, true);
        strictEqual(graph.getEdge({source: "v2", target: "v3", edgeType: "default"}) instanceof Edge, true);
        strictEqual(graph.getEdge({source: "v1", target: "v2", edgeType: "default"}).getProp("p1"), "val1");
        return Promise.resolve();
    });
    it("should search correctly", async ()=>{
        let graph = new AverGraph();
        graph.loadFromFiles(join("test","temp"));
        graph.getVertex({id: "v1"}).setProp("p1","v1");
        graph.getVertex({id: "v2"}).setProp("p1","a");
        graph.createEdge("v1","v3","test");
        strictEqual(graph.getVertices({hasPropsWithValues:{"p1":"a"}}).length,1);
        strictEqual(graph.getEdges({hasProps:["p1"]}).length,1);
        strictEqual(graph.getEdges({target: "v3"}).length,2);
        strictEqual(graph.getVertices({hasProps:["p1"], idRegex:"v."}).length,2);
        return Promise.resolve();
    });
    after(()=>{
        rimraf.sync(join("test","temp"));
    })
});