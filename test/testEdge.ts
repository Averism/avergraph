// import * as Assert from 'assert';
// import Edge from '../src/Edge';
// import Vertex from '../src/Vertex';

// const serializeResult1=
// `edgeType: default
// source: v1
// target: v2
// props:
//   items:
//     e1: v1
//     e2: v2
//     e3: v3
// `

// describe("edge", ()=>{
//     it("should serialize correctly", ()=>{
//         let v1: Vertex = new Vertex("v1","c1");
//         let v2: Vertex = new Vertex("v2","c2");
//         let e: Edge = new Edge(v1,v2,"default");
//         e.setProp("e1","v1");
//         e.setProp("e3","v3");
//         e.setProp("e2","v2");
//         Assert.strictEqual(e.serialize(),serializeResult1)
//     });
//     it("should deserialize correctly", ()=>{
//         let e: Edge = Edge.deserialize(serializeResult1);
//         Assert.strictEqual(e.edgeType, "default");
//         Assert.strictEqual(e.source, "v1");
//         Assert.strictEqual(e.target, "v2");
//         Assert.strictEqual(e.getProp("e1"), "v1");
//         e.deleteProp("e3");
//         e.deleteProp("e2");
//         e.deleteProp("e1");
//         Assert.strictEqual(e.getProps(), undefined);
//     });
// });