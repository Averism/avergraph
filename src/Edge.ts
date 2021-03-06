import BasicGraphObject from "./BasicGraphObject";
import Vertex from "./Vertex";

export default class Edge extends BasicGraphObject {
    source: string;
    target: string;
    edgeType: string;
    id() {
        return `${this.source}-${this.edgeType}-${this.target}`;
    }
    getId() {
        return `${this.source}-${this.edgeType}-${this.target}`;
    }

    constructor(source: string | Vertex, target: string | Vertex, edgeType: string){
        super();
        if (source instanceof Vertex) this.source = source.id;
        else this.source = source;
        if (target instanceof Vertex) this.target = target.id;
        else this.target = target;
        this.edgeType = edgeType;
    }
}