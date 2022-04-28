import cytoscape from "cytoscape";
import YmlSerializer from "../serializer/YmlSerializer";
import "./style.css";
import 'materialize-css/dist/css/materialize.min.css';
import M from 'materialize-css';
import { GraphUtils } from "./converter/GraphUtils";

let cy: cytoscape.Core;

const gText = `vertices:
  v1:
    id: v1
    class: default
  v2:
    id: v2
    class: default
  v3:
    id: v3
    class: default
edges:
  v1-default-v2:
    source: v1
    edgeType: default
    target: v2
    props:
      p1: val1
  v2-default-v3:
    source: v2
    edgeType: default
    target: v3
`

setTimeout(() => {
    cy = GraphUtils.import(cy, gText);
}, 5000);

let sidenav: M.Sidenav[];

document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    sidenav = M.Sidenav.init(elems);
});

function showSidenav(){
    sidenav[0].open();
}


(window as any).ag = {
    cy,
    resetCy: ()=>GraphUtils.reset(cy),
    showSidenav,
};
