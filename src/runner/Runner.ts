import AverGraph, { getEdgeOptions } from "../AverGraph";
import { applyGraphDiffTo, DiffInfo } from "../AverGraphDiff";
import Edge from "../Edge";
import Vertex from "../Vertex";
import { evaluate } from "./Eval";

export type RunnerParam = {
    startingGraph: AverGraph,
    diff: DiffInfo,
    activeNodes: string[],
    waitingNodes: string[],
    globalVar: any,
    promises?: Promise<any>[]
}

export type RunnerContext = {globalVar: any, graph: AverGraph}

export type RunnerFunction = (param: any, context: RunnerContext)=>Promise<any>

export type RunnerCapability = {
    [capabilityId: string]: {
        [capabilityVersion: number]: RunnerFunction
    }
}

export type RunnerSchema = {
    flowEdgeCriteria: getEdgeOptions,
    flowEdgeConditionPropKey: string,
    flowEdgeSetFlagPropKey: string,
    nodeWaitablePropKey: string,
    nodeWaitFlagPropKeyPrefix: string,
    asyncPropKey: string,
    saveResultToPropKey: string,
    asyncCallbackFlagPropKey: string
}

export const DefaultRunnerSchema: RunnerSchema = {
    flowEdgeCriteria: {
        hasProps: ["flow"]
    },
    flowEdgeConditionPropKey: "condition",
    flowEdgeSetFlagPropKey: "setFlag",
    nodeWaitablePropKey: "waitable",
    nodeWaitFlagPropKeyPrefix: "wait_",
    asyncPropKey: "async",
    saveResultToPropKey: "saveResultTo",
    asyncCallbackFlagPropKey: "callbackFlag"
}

export default class Runner {
    capability: RunnerCapability = {
    };
    schema: RunnerSchema = DefaultRunnerSchema;

    addCapability(lib: RunnerCapability){
        for(let id of Object.keys(lib)){
            if(!this.capability[id]) this.capability[id] = {};
            for(let version of Object.keys(lib[id])){
                let ver = Number(version);
                this.capability[id][ver]=lib[id][ver];
            }
        }
    }

    async run(param: RunnerParam){
        param.promises = [];
        let g = param.startingGraph.clone();
        applyGraphDiffTo(g,param.diff);
        this.processWaiting(param, g);
        let v = this.getNextRunnableNode(g.getVertices({ids: param.activeNodes}), param.globalVar);
        while(v){
            let id = v.getId();
            let vIdx = param.activeNodes.indexOf(id);
            param.activeNodes.splice(vIdx,1);
            let async = v.getProp(this.schema.asyncPropKey);
            let result:any;
            if(!async) {
                result = await this.runNode(g,v,param);
            } else {
                param.promises.push(this.runNode(g,v,param));
            }
            let eOut = g.getEdges(Object.assign({source: v.getId()}, this.schema.flowEdgeCriteria));
            eOut = eOut.filter(e=>this.evaluateCondition(e,result,param));
            let activeSet = new Set<string>(param.activeNodes);
            eOut.forEach(e=>{
                let flag = e.getProp(this.schema.flowEdgeSetFlagPropKey);
                if(!flag) return;
                param.globalVar[flag] = true;
            })
            eOut.forEach(e=>activeSet.add(e.target));
            param.activeNodes = Array.from(activeSet);
            this.processWaiting(param, g);
            v = this.getNextRunnableNode(g.getVertices({ids: param.activeNodes}), param.globalVar);
            if(!v) {
                // console.log("awaiting all", param.promises)
                await Promise.all(param.promises);
                this.processWaiting(param, g);
                v = this.getNextRunnableNode(g.getVertices({ids: param.activeNodes}), param.globalVar);
            }
        }
    }

    async runNode(graph: AverGraph, node: Vertex, param: RunnerParam): Promise<any>{
        let actionType = node.getProp("actionType");
        switch(actionType){
            case "evalScript": return this.evalScript(graph, node, param);
            case "runTask": return this.runTask(graph, node, param);
            case "noop": return;
        }
    }

    private processWaiting(param: RunnerParam, graph: AverGraph){
        let toWait: string[] = [];
        let toActive: string[] = [];
        // console.log("process waiting", param.activeNodes, param.waitingNodes)
        for(let activeV of param.activeNodes)
            if(this.isWaiting(graph.getVertex(activeV), param.globalVar))
                toWait.push(activeV);
        for(let waitV of param.waitingNodes)
            if(!this.isWaiting(graph.getVertex(waitV), param.globalVar))
                toActive.push(waitV);
        // console.log("process waiting2", toWait, toActive)
        for(let vid of toWait) {
            param.activeNodes.splice(param.activeNodes.indexOf(vid));
            if(param.waitingNodes.indexOf(vid)==-1)
                param.waitingNodes.push(vid);
        }
        for(let vid of toActive) {
            param.waitingNodes.splice(param.waitingNodes.indexOf(vid));
            if(param.activeNodes.indexOf(vid)==-1)
                param.activeNodes.push(vid);
        }
    }

    private evaluateCondition(e: Edge, result: any, param: RunnerParam){
        let condition = e.getProp(this.schema.flowEdgeConditionPropKey);
        if(!condition) return true;
        let context = Object.assign({"_": result}, param.globalVar)
        return evaluate(condition, context);
    }

    private async evalScript(graph: AverGraph, node: Vertex, param: RunnerParam): Promise<any>{
        let script = node.getProp("script");
        if(!script) throw new Error("script is undefined for node "+node.getId());
        let result = evaluate(script, param.globalVar);
        if(node.getProp(this.schema.saveResultToPropKey))
            param.globalVar[node.getProp(this.schema.saveResultToPropKey)] = result;
        return result;
    }

    private async runTask(graph: AverGraph, node: Vertex, param: RunnerParam): Promise<any>{
        let taskId = node.getProp("taskId");
        let version = this.getNodeVersion(node);
        let fn = this.capability[taskId][version];
        let fnparam: any = {};
        let paramKeys = node.getProps().keys().filter(x=>x.startsWith("param_")).map(x=>x.substring(6));
        for(let paramKey of paramKeys)
            fnparam[paramKey] = node.getProp("param_"+paramKey);
        let context = {graph, globalVar: param.globalVar};
        let saveResultTo = node.getProp(this.schema.saveResultToPropKey);
        let async = node.getProp(this.schema.asyncPropKey);
        if(async){
            let cbFlag = node.getProp(this.schema.asyncCallbackFlagPropKey);
            let resultPromise = fn(fnparam, context);
            resultPromise.then(res=>{
                if(saveResultTo)
                    param.globalVar[saveResultTo] = res;
                if(cbFlag)
                    param.globalVar[cbFlag] = true;
            });
            return resultPromise;
        } else {
            let result = await fn(fnparam, context);
            if(saveResultTo)
                param.globalVar[saveResultTo] = result;
        }
    }

    private getNextRunnableNode(nodes: Vertex[], globalVar: any): Vertex {
        if(!nodes || nodes.length==0) return undefined;
        for(let v of nodes){
            if(this.isWaiting(v, globalVar)) continue;
            if(v.getProp("actionType") == "noop") return v;
            if(v.getProp("actionType") == "evalScript") return v;
            if(v.getProp("actionType") == "runTask" && this.getNodeVersion(v)>-1) 
                return v; 
        }
        return undefined;
    }

    private isWaiting(node: Vertex, globalVar: any): boolean {
        const WAITABLE = node.getProp(this.schema.nodeWaitablePropKey);
        if(!WAITABLE) return false;
        const PREFIX = this.schema.nodeWaitFlagPropKeyPrefix;
        let waits = node.getProps().keys().filter(x=>x.startsWith(PREFIX)).map(x=>x.substring(PREFIX.length));
        let result = false;
        for(let wait of waits) {
            result = result || !globalVar[wait]; 
        }
        return result;
    }

    private getNodeVersion(v: Vertex):number {
        let taskId = v.getProp("taskId");
        let taskVersion = v.getProp("taskVersion");
        let taskVersionStart = v.getProp("taskVersionStart");
        let versioningType = v.getProp("versioningType") || "any";
        if(!this.capability[taskId]) return -1;
        if(versioningType == "any") return this.hasCapabilityVersion(taskId, 0, Number.MAX_SAFE_INTEGER);
        if(versioningType == "after") return this.hasCapabilityVersion(taskId, Number(taskVersion), Number.MAX_SAFE_INTEGER);
        if(versioningType == "before") return this.hasCapabilityVersion(taskId, 0, Number(taskVersion));
        if(versioningType == "between") return this.hasCapabilityVersion(taskId, Number(taskVersionStart), Number(taskVersion));
    }

    private hasCapabilityVersion(capability: string, versionStart: number, versionEnd: number): number {
        let versions = Object.keys(this.capability[capability]).map(Number);
        let filteredVersions = versions.filter(x=>versionStart<=x && versionEnd>=x)
        if(filteredVersions.length == 0) return -1;
        return filteredVersions.sort().reverse()[0];
    }
}