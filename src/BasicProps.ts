import { Propable, Props } from "./Propable";

export default class BasicProps implements Props {
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
}