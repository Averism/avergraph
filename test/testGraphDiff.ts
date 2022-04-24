import { strictEqual, deepStrictEqual } from "assert";
import AverGraph from "../src/AverGraph";
import AverGraphDiff, { applyGraphDiffTo, DiffChange } from "../src/AverGraphDiff";
import Edge from "../src/Edge";
import Vertex from "../src/Vertex";

describe("graphdiff", ()=>{
    let g1: AverGraph;
    let g2: AverGraph;
    let graphDiff: AverGraphDiff;

    before(()=>{
        g1 = new AverGraph();
        let v1 = g1.createVertex("v1", "default");
        v1.setProp('p1','v1');
        v1.setProp('p1','v1');
        v1.setProp('p3','v3');
        v1.setProp('p2','v2');
        let v2 = g1.createVertex("v2", "default");
        let v3 = g1.createVertex("v3", "default");
        let sv = g1.createVertex("static", "default");
        v1.setProp('p','p');
        v1.connectTo(v2);
        v2.connectTo(v3);
        v1.connectTo(v3);
        g1.getEdge({source: v1.id, target: v3.id, edgeType: "default"}).setProp("p1","val1");  
    })

    it("should diff graph correctly", ()=>{      
        g2 = g1.clone();
        g2.removeVertex("v2");
        g2.createVertex("v4","new");
        g2.createEdge("v1","v4","new");
        g2.getVertex("v1").deleteProp("p1");
        g2.getVertex("v1").setProp("p2","new");
        g2.getVertex("v3").changeClass("new");
        g2.getVertex("v3").setProp("p1","new");
        g2.getEdge({source: "v1", target: "v3", edgeType: "default"}).setProp("p1","new");  
        graphDiff = new AverGraphDiff(g1,g2);
        strictEqual(graphDiff.getVertex("static") instanceof Vertex, true);
        strictEqual(graphDiff.getVertex("v1") instanceof Vertex, true);
        strictEqual(graphDiff.getEdge({source: "v1", target: "v4", edgeType: "new"}) instanceof Edge, true);
        strictEqual(graphDiff.getVertex("v1").getProp("p1"), undefined);
        strictEqual(graphDiff.getVertex("v2") instanceof Vertex, true);
        strictEqual(graphDiff.getVertex("v3") instanceof Vertex, true);
        strictEqual(graphDiff.getVertex("v3").getProp("p1"),"new");
        strictEqual(graphDiff.getVertex("v4") instanceof Vertex, true);
    });

    it("should produce diff info correctly", ()=>{
        strictEqual(graphDiff.diffInfo["static"],undefined)
        strictEqual(graphDiff.diffInfo["static.p1"],undefined)
        deepStrictEqual(graphDiff.diffInfo["v1"],{type: "modify",before:"v1",after:"v1"})
        deepStrictEqual(graphDiff.diffInfo["v1-new-v4"], {type: "add", before: undefined, after: "v1-new-v4"})
        deepStrictEqual(graphDiff.diffInfo["v1.p1"], {type: "remove", before: "v1", after: undefined})
        deepStrictEqual(graphDiff.diffInfo["v1.p2"], {type: "modify", before: "v2", after: "new"})
        deepStrictEqual(graphDiff.diffInfo["v2"],{type: "remove",before:"v2",after:undefined})
        deepStrictEqual(graphDiff.diffInfo["v2-default-v3"], {type: "remove", before: "v2-default-v3", after: undefined})
        deepStrictEqual(graphDiff.diffInfo["v3"],{type: "modify",before:"v3",after:"v3"})
        deepStrictEqual(graphDiff.diffInfo["v3::class"],{type: "modify",before:"default",after:"new"})
        deepStrictEqual(graphDiff.diffInfo["v3.p1"],{type: "add",before:undefined,after:"new"});
        deepStrictEqual(graphDiff.diffInfo["v4"],{type: "add",before:undefined,after:"v4::new"})
    });      

    it("should be applicable correctly", ()=>{
        let g3 = g1.clone();
        applyGraphDiffTo(g3,graphDiff.diffInfo);
        for(let v of Object.values(g2.vertexById)){
            strictEqual(v.class,g3.getVertex(v.getId()).class)
            deepStrictEqual(v.getProps(),g3.getVertex(v.getId()).getProps())
        }
        for(let v of Object.values(g3.vertexById)){
            strictEqual(v.class,g2.getVertex(v.getId()).class)
            deepStrictEqual(v.getProps(),g2.getVertex(v.getId()).getProps())
        }
        for(let e of Object.values(g2.edgeById)){
            deepStrictEqual(e.getProps(),g3.edgeById[e.getId()].getProps())
        }
        for(let e of Object.values(g3.edgeById)){
            deepStrictEqual(e.getProps(),g2.edgeById[e.getId()].getProps())
        }
    });
    
});

