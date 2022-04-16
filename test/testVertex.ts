import * as Assert from 'assert';
import Vertex from '../src/Vertex';

const serializeResult1=
`id: v1
class: c1
vOut:
  default:
    - v2
  test:
    - v2
`

const serializeResult2=
`id: v1
class: c1
props:
  items:
    p1: v1
    p2: v2
    p3: v3
`

describe("Vertex",()=>{
    it("should be able to connect correctly",()=>{
        let v1: Vertex = new Vertex("v1","c1");
        let v2: Vertex = new Vertex("v2","c2");
        v1.connectTo(v2);
        v1.connectTo(v2);
        Assert.strictEqual(v1.vOut.default.length, 1);
        Assert.strictEqual(v1.vOut.default[0], v2.id);
        Assert.strictEqual(v2.vIn.default.length, 1);
        Assert.strictEqual(v2.vIn.default[0], v1.id);
    });
    it("should serialize correctly",()=>{
        let v1: Vertex = new Vertex("v1","c1");
        let v2: Vertex = new Vertex("v2","c2");
        v1.connectTo(v2);
        v1.connectTo(v2, "test");
        Assert.strictEqual(v1.serialize(), serializeResult1);
    });
    it("should deserialize correctly",()=>{
        let v1: Vertex = Vertex.deserialize(serializeResult1);
        Assert.strictEqual(v1.vOut.default.length, 1);
        Assert.strictEqual(v1.id, "v1");
        Assert.strictEqual(v1.class, "c1");
        Assert.strictEqual(v1.vOut.default[0], "v2");
        Assert.strictEqual(v1.vOut.test[0], "v2");
    });
    it("should serialize correctly with props",()=>{
        let v1: Vertex = new Vertex("v1","c1");
        v1.setProp('p1','v1');
        v1.setProp('p1','v1');
        v1.setProp('p3','v3');
        v1.setProp('p2','v2');
        Assert.strictEqual(v1.serialize(),serializeResult2)
    });
    it("should deserialize correctly with props",()=>{
        let v1: Vertex = Vertex.deserialize(serializeResult2)
        Assert.strictEqual(v1.id,"v1")
        Assert.strictEqual(v1.class,"c1")
        Assert.strictEqual(v1.getProp("p1"),"v1")
        Assert.strictEqual(v1.getProp("p2"),"v2")
        Assert.strictEqual(v1.getProp("p3"),"v3")
        v1.deleteProp("p1");
        v1.deleteProp("p2");
        v1.deleteProp("p3");
        Assert.strictEqual(v1.getProps(),undefined);
    });
    it("should reject improper id",()=>{
        Assert.throws(()=>new Vertex("<3","c1"), "should be rejected")
    });
});