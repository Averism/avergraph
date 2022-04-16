import Vertex from "./Vertex";

export type AutomataResult = {
    done: string[];
    next: string[];
    result: any[];
}

export interface Iterator {
    hasNext(): boolean;
    next(): any;
}

export interface Automata {
    id(): string;
    priority(): number;
    process(current: string[], value: any): AutomataResult;
}

export abstract class GraphAutomata implements Automata {
    abstract id(): string;
    abstract priority(): number;
    abstract processVertex(v: Vertex, value: any): void;
    process(current: string[], value: any): AutomataResult {
        throw new Error("Method not implemented.");
    }

}

export class IncrementalIterator implements Iterator {
    current: number;
    end: number;
    increment: number;
    constructor(start: number, end: number, increment:number=1){
        this.current = start;
        this.end = end;
        this.increment = increment;
    }
    hasNext(): boolean {
        return this.current < this.end;
    }
    next() {
        if(!this.hasNext) return;
        let res = this.current;
        this.current = this.current + this.increment;
        return res;
    }
}

export class AutomataProcessor {
    private automata: Automata[] = [];
    addAutomata(automata: Automata): boolean{
        let existing = this.automata.filter(x=>x.id()==automata.id()).length>0;
        if(existing) return false;
        this.automata.push(automata);
        this.automata.sort((a,b)=>a.priority()-b.priority());
        return true;
    }
    removeAutomata(id: string): void{
        this.automata = this.automata.filter(x=>x.id()!=id);
    }
    processAutomata(iterator: Iterator, initialSet: string[]): any[]{
        let current = initialSet;
        let next: Set<string> = new Set();
        let done: Set<string> = new Set();
        let result: any[] = [];
        while(iterator.hasNext()){
            let currentValue = iterator.next();
            for(let automata of this.automata) {
                let ar = automata.process(current,currentValue);
                ar.done.forEach(x=>done.add(x));
                ar.next.filter(x=>!done.has(x)).forEach(x=>next.add(x));
                result = result.concat(ar.result);
            }
            current.filter(x=>!done.has(x)).forEach(x=>next.add(x));
            current = Array.from(next.values());
            next.clear();
            if(current.length == 0) break;
        }
        return result;
    }
}