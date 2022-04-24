import { strictEqual } from "assert";
import AverGraph from "../src/AverGraph";
import Runner, { RunnerParam } from "../src/runner/Runner";
import viz from "../src/viz";

describe("Runner", ()=>{
    it("should run power script correctly", async ()=>{
        let g = new AverGraph();
        let mult = g.createVertex("mult","default");
        mult.setProp("actionType","evalScript");
        mult.setProp("script","res*base");
        mult.setProp("saveResultTo", "res");
        let dec = g.createVertex("dec","default");
        dec.setProp("actionType","evalScript");
        dec.setProp("script","n-1");
        dec.setProp("saveResultTo", "n");
        let next = g.createEdge("mult","dec","next");
        next.setProp("flow","true");
        let loop = g.createEdge("dec","mult","loop");
        loop.setProp("flow","true");
        loop.setProp("condition","n>0");

        let r = new Runner();
        let param: RunnerParam = {
            startingGraph: g,
            diff: undefined,
            activeNodes: ["mult"],
            waitingNodes: [],
            globalVar: {
                base: 2,
                n: 10,
                res: 1
            }
        };
        await r.run(param);
        strictEqual(param.globalVar["res"],1024);
        return;
    })

    it("should run twinprime correctly", async ()=>{
        let g = new AverGraph();
        let start = g.createVertex("start","start");
        start.setProp("actionType","noop");
        let a = g.createVertex("aIsPrime","isprime");
        a.setProp("actionType","runTask");
        a.setProp("param_n","a");
        a.setProp("taskId","isPrime");
        a.setProp("async","true");
        a.setProp("saveResultTo", "aIsPrime");
        a.setProp("callbackFlag", "aFlag");
        let b = g.createVertex("bIsPrime","isprime");
        b.setProp("actionType","runTask");
        b.setProp("param_n","b");
        b.setProp("taskId","isPrime");
        b.setProp("async","true");
        b.setProp("saveResultTo", "bIsPrime");
        b.setProp("callbackFlag", "bFlag");
        let process1 = g.createEdge(start,a,"checkPrime");
        process1.setProp("flow","true");
        let process2 = g.createEdge(start,b,"checkPrime");
        process2.setProp("flow","true");
        let end = g.createVertex("end","end")
        end.setProp("actionType","evalScript");
        end.setProp("script","aIsPrime && bIsPrime && Math.abs(a-b)==2");
        end.setProp("saveResultTo", "res");
        end.setProp("waitable","true");
        end.setProp("wait_aFlag","true");
        end.setProp("wait_bFlag","true");
        let e1 = g.createEdge(a, end, "default");
        e1.setProp("flow","true");
        let e2 = g.createEdge(b, end, "default");
        e2.setProp("flow","true");

        let r = new Runner();
        r.addCapability({
            isPrime: {
                1: async (param: any):Promise<any>=>{
                    let n = Number(param.n);
                    let ns = Math.ceil(Math.sqrt(n));
                    for(let i=2; i<=ns; i++) if(n%i == 0) return false;
                    return new Promise(resolve=>setTimeout(()=>resolve(true),15));
                }
            }
        })
        let param: RunnerParam = {
            startingGraph: g,
            diff: undefined,
            activeNodes: ["start"],
            waitingNodes: [],
            globalVar: {
                a: 9281,
                b: 9283
            }
        };
        await r.run(param);
        strictEqual(param.globalVar["res"],true
        );

        return;
    })
});