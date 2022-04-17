import { writeFileSync } from "fs"
import AverGraph from "./AverGraph"

export default function viz(graph: AverGraph, path: string) { 
    let v: string[] = graph.getVertices({idRegex: ".*"}).map(x=>`                {data: {id: "${x.getId()}"}}`)
    let e: string[] = graph.getEdges({idRegex: ".*"}).map(x=>`                {data: {id: "${x.getId()}", source: "${x.source}", target: "${x.target}", edgeType: "${x.edgeType}"}}`)
    let content = `<body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.21.1/cytoscape.min.js"></script>
    <style>
        #cy {
            width: 100%;
            height: 100%;
            display: block;
        }
    </style>
    <div id="cy"></div>
    <script>
        var cy = cytoscape({
            container: document.getElementById('cy'),

            elements: [ // list of graph elements to start with
${e.concat(v).join(",\n")}
            ],

            style: [ // the stylesheet for the graph
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
            ],

            layout: {
                name: 'cose',
                nodeRepulsion: function( node ){ return 200000; },
                idealEdgeLength: function( edge ){ return 64; },
                edgeElasticity: function( edge ){ return 256; },
            }
        });
    </script>
</body>`
    writeFileSync(path,content);
    }