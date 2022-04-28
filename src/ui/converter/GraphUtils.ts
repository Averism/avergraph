import cytoscape from "cytoscape";
import AverGraph from "../../AverGraph";
import GraphSerializer from "../../serializer/GraphSerializer";
import YmlSerializer from "../../serializer/YmlSerializer";

let scheme = [ // the stylesheet for the graph
    {
        selector: 'node',
        style: {
            'background-color': '#666',
            'label': 'data(id)'
        }
    },

    {
        selector: 'edge',
        style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(edgeType)'
        }
    }
]

let layout = {
    name: 'cose',
    nodeRepulsion: function( node: any ){ return 200000; },
    idealEdgeLength: function( edge: any ){ return 64; },
    edgeElasticity: function( edge: any ){ return 256; },
}

export type GraphOptions = {
    scheme?: cytoscape.Stylesheet[],
    layout?: cytoscape.LayoutOptions
}

export let defaultGraphOptions = {style: scheme, layout}

export class GraphUtils {
    static reset(cy: cytoscape.Core){
        cy.elements().remove();
    }

    static import(cy: cytoscape.Core, data: string, serializer?: GraphSerializer, options?: GraphOptions): cytoscape.Core {
        if(!serializer) serializer = new YmlSerializer(null);
        if(!options) options = defaultGraphOptions;
        let g = serializer.deserialize(data);
        let container = document.getElementById('cy');
        let elements: cytoscape.ElementDefinition[] = [];
        let cyOptions: cytoscape.CytoscapeOptions = Object.assign({container, elements},options)
        console.log(cyOptions);

        if(cy) {
            this.reset(cy);
        } else {
            cy = cytoscape(cyOptions);
            (window as any).ag.cy = cy;
        }

        for(let v of Object.values(g.vertexById)) {
            cy.add({data: {id: v.getId()}})
        }
        for(let e of Object.values(g.edgeById)) {
            cy.add({data: {
                id: e.getId(),
                source: e.source,
                target: e.target,
                edgeType: e.edgeType
            }})
        }
        cy.elements().layout(layout).start();
        return cy;
    }
}