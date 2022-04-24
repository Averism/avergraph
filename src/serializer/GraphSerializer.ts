import AverGraph from "../AverGraph";

export type KeyValuePersistance = {
    key: string[],
    value: string
}

export interface PersistanceAccessor {
    doPersist(key: string[], value: string): Promise<void>;
    revert(key: string[]): Promise<void>;
    load(key: string[]): Promise<KeyValuePersistance>;
    getKeys(): Promise<string[][]>;
}

export default abstract class GraphSerializer {
    accessor: PersistanceAccessor;
    constructor(accessor: PersistanceAccessor){
        this.accessor = accessor;
    }
    abstract serialize(graph: AverGraph): string;
    abstract deserialize(data: string): AverGraph;
    abstract prepareToPersist(graph: AverGraph): KeyValuePersistance[];
    abstract loadGraph(data: KeyValuePersistance[]): AverGraph;
    async persist(graph: AverGraph): Promise<void> {
        let data = this.prepareToPersist(graph);
        let promises: Promise<void>[];
        try{
            promises = data.map(x=>this.accessor.doPersist(x.key,x.value));
            await Promise.all(promises);
        } catch (e) {
            /* istanbul ignore next */ 
            await Promise.all(data.map(x=>this.accessor.revert(x.key)));
            /* istanbul ignore next */ 
            throw new Error(e);
        }
    }
    async load(): Promise<AverGraph> {
        let keys = await this.accessor.getKeys();
        let promises = keys.map(x=>this.accessor.load(x))
        let data = await Promise.all(promises);
        return this.loadGraph(data);
    }
}