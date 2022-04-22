export interface Clonable<T>{
    clone():T;
}

export interface Props{
    set(key: string, value: string):void;
    get(key: string):string;
    delete(key: string): boolean;
    keys(): string[];
}

export interface Propable{
    setProp(key: string, value: string):void;
    getProp(key: string):string;
    deleteProp(key: string): boolean;
    getProps(): Props;
    getId(): string;
}

export class BasicProps implements Props {
    set(key: string, value: string): void {
        this.items[key]=value;
    }
    get(key: string): string {
        return this.items[key];
    }
    delete(key: string): boolean {
        return delete this.items[key];
    }
    parent: Propable;
    items: {[key: string]: string};
    constructor(key: string, value: string) {
        this.items={};
        if(key!=null && value!=null)
            this.set(key,value);
    }
    keys(): string[] {
        return Object.keys(this.items);
    }
}

export function isPropable(x: any): x is Propable {
    if(typeof x.setProp != "function") return false;
    if(typeof x.getProp != "function") return false;
    if(typeof x.deleteProp != "function") return false;
    if(typeof x.getProps != "function") return false;
    if(typeof x.getId != "function") return false;
    return true;
}