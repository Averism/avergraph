export interface Props {
    set(key: string, value: string):void;
    get(key: string):string;
    delete(key: string): boolean;
}

export interface Propable {
    setProp(key: string, value: string):void;
    getProp(key: string):string;
    deleteProp(key: string): boolean;
    getProps(): Props;
    getId(): string;
}