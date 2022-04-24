import { deepStrictEqual, strictEqual, throws } from "assert";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import AverGraph from "../src/AverGraph";
import Edge from "../src/Edge";
import rimraf from "rimraf";
import Vertex from "../src/Vertex";
import viz from "../src/viz";
import YmlSerializer from "../src/serializer/YmlSerializer";
import FilePersistor from "../src/serializer/FilePersistor";

describe("graph", ()=>{
    let graph: AverGraph;
    let serializedGraph: string;
    it("should create vertex and edges correctly", ()=>{
        graph = new AverGraph();
        let v1 = graph.createVertex("v1", "default");
        let v2 = graph.createVertex("v2", "default");
        v1.connectTo(v2);
        let e1 = graph.getEdge({source: v1.id, target: v2.id, edgeType: "default"});
        deepStrictEqual(graph.getVertex({id: v1.id}), v1); 
        strictEqual(e1 instanceof Edge, true);

        //negative tests
        strictEqual(graph.getVertex({}), undefined); 
        strictEqual(graph.getEdge({}), undefined); 
        throws(()=>graph.getVertex(null))
        throws(()=>graph.getEdge(null))

        //not yet implemented
        strictEqual(graph.getVertices({}), undefined); 
    });
    it("should serialize correctly", async ()=>{
        graph = new AverGraph();
        let v1 = graph.createVertex("v1", "default");
        let v2 = graph.createVertex("v2", "default");
        let v3 = graph.createVertex("v3", "default");
        v1.connectTo(v2);
        v2.connectTo(v3);
        graph.getEdge({source: v1.id, target: v2.id, edgeType: "default"}).setProp("p1","val1");
        let tempTestPath = join("test","temp");
        let serializer = new YmlSerializer(new FilePersistor(tempTestPath));
        serializedGraph = serializer.serialize(graph);
        await serializer.persist(graph);
        strictEqual(existsSync(join(tempTestPath,"vertex","v1")),true);
        strictEqual(existsSync(join(tempTestPath,"vertex","v2")),true);
        strictEqual(existsSync(join(tempTestPath,"vertex","v3")),true);
        strictEqual(existsSync(join(tempTestPath,"edge","v1-default-v2")),true);
        strictEqual(existsSync(join(tempTestPath,"edge","v2-default-v3")),true);
        return Promise.resolve();
    });


    it("should load from files correctly", async ()=>{
        let tempTestPath = join("test","temp");
        let serializer = new YmlSerializer(new FilePersistor(tempTestPath))
        graph = await serializer.load();
        strictEqual(graph.getVertex({id: "v1"}) instanceof Vertex, true);
        strictEqual(graph.getVertex({id: "v2"}) instanceof Vertex, true);
        strictEqual(graph.getVertex({id: "v3"}) instanceof Vertex, true);
        strictEqual(graph.getEdge({source: "v1", target: "v2", edgeType: "default"}) instanceof Edge, true);
        strictEqual(graph.getEdge({source: "v2", target: "v3", edgeType: "default"}) instanceof Edge, true);
        strictEqual(graph.getEdge({source: "v1", target: "v2", edgeType: "default"}).getProp("p1"), "val1");
        return Promise.resolve();
    });

    it("should deserialize correctly", async ()=>{
        let tempTestPath = join("test","temp");
        let serializer = new YmlSerializer(new FilePersistor(tempTestPath))
        graph = serializer.deserialize(serializedGraph);
        strictEqual(graph.getVertex({id: "v1"}) instanceof Vertex, true);
        strictEqual(graph.getVertex({id: "v2"}) instanceof Vertex, true);
        strictEqual(graph.getVertex({id: "v3"}) instanceof Vertex, true);
        strictEqual(graph.getEdge({source: "v1", target: "v2", edgeType: "default"}) instanceof Edge, true);
        strictEqual(graph.getEdge({source: "v2", target: "v3", edgeType: "default"}) instanceof Edge, true);
        strictEqual(graph.getEdge({source: "v1", target: "v2", edgeType: "default"}).getProp("p1"), "val1");
        return Promise.resolve();
    });

    it("should search correctly", async ()=>{
        graph = new AverGraph();
        let v1 = graph.createVertex("v1", "default");
        let v2 = graph.createVertex("v2", "default");
        let v3 = graph.createVertex("v3", "default");
        v1.connectTo(v2);
        v2.connectTo(v3);
        graph.getEdge({source: v1.id, target: v2.id, edgeType: "default"}).setProp("p1","val1");
        let tempTestPath = join("test","temp");
        graph.getVertex({id: "v1"}).setProp("p1","v1");
        graph.getVertex({id: "v2"}).setProp("p1","a");
        graph.createEdge("v1","v3","test");
        strictEqual(graph.getVertices({hasPropsWithValues:{"p1":"a"}}).length,1);
        strictEqual(graph.getEdges({hasProps:["p1"]}).length,1);
        strictEqual(graph.getEdges({target: "v3"}).length,2);
        strictEqual(graph.getVertices({hasProps:["p1"], idRegex:"v."}).length,2);
        return Promise.resolve();
    });

    it("should be able visualized correctly", async ()=>{
        graph.createVertex("v4", "default");
        graph.createVertex("v5", "default");
        graph.createVertex("v6", "default");
        graph.createEdge("v4","v3","test");
        graph.createEdge("v1","v4","test");
        graph.createEdge("v5","v3","test");
        graph.createEdge("v6","v5","test");
        graph.createEdge("v2","v5","test");
        graph.createEdge("v1","v5","test");
        viz(graph,join("test","temp","test.html"));
        strictEqual(existsSync(join("test","temp","test.html")),true);
    });
    
    after(()=>{
        rimraf.sync(join("test","temp"));
    })
});