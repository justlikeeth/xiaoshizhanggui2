import { FullPageLayout } from "../cfg"
import { QuartzComponent } from "./types"

// The community graph 0.1.0 uses Pixi pointerover on small moving dots. In a
// crowded graph many displayed dots are difficult to hit, even with a larger
// Pixi hit area. Add a DOM pointer listener that picks the closest *rendered*
// node from the live simulation, including after zoom/pan and during motion.
// Keep the plugin installed as-is; fail the build if its script changes.
const point =
  'U.circle(0,0,Tu),U.fill({color:De?He:le}),De&&U.stroke({width:2,color:ue}),U.eventMode="static"'
const dragRadius = 'if(K<gu+5)return v'
const renderLoop = 'var se=!1;function ce(){'

const reliableHover = `
var graphHoverTip=document.createElement("div"),graphHoverActive=null;
graphHoverTip.className="graph-hover-title";
graphHoverTip.setAttribute("role","status");
graphHoverTip.hidden=!0;
d.appendChild(graphHoverTip);
function graphHoverHide(){
  if(graphHoverActive!==null){graphHoverActive=null;Wu(null);Eu||Au()}
  graphHoverTip.hidden=!0;
}
function graphHoverMove(event){
  if(Eu)return;
  var box=Z.canvas.getBoundingClientRect();
  if(!box.width||!box.height)return;
  var closest=null,best=18*18;
  for(var k=0;k<L.length;k++){
    var item=L[k].simulationData;
    if(!Number.isFinite(item.x)||!Number.isFinite(item.y))continue;
    var screenX=box.left+(P.x+P.k*(item.x+R/2))*box.width/R;
    var screenY=box.top+(P.y+P.k*(item.y+O/2))*box.height/O;
    var dx=event.clientX-screenX,dy=event.clientY-screenY,dist=dx*dx+dy*dy;
    if(dist<best){best=dist;closest=item}
  }
  if(!closest){graphHoverHide();return}
  if(graphHoverActive!==closest.id){
    graphHoverActive=closest.id;
    graphHoverTip.textContent=closest.text;
    graphHoverTip.hidden=!1;
    Wu(closest.id);Au();
    document.dispatchEvent(new CustomEvent("xiaoshigraphhover",{detail:{slug:closest.id,title:closest.text}}));
  }
  var parent=d.getBoundingClientRect(),tip=graphHoverTip.getBoundingClientRect();
  var left=event.clientX-parent.left+16,top=event.clientY-parent.top+16;
  if(left+tip.width>parent.width-8)left=event.clientX-parent.left-tip.width-16;
  if(top+tip.height>parent.height-8)top=event.clientY-parent.top-tip.height-16;
  graphHoverTip.style.left=Math.max(8,left)+"px";
  graphHoverTip.style.top=Math.max(8,top)+"px";
}
Z.canvas.addEventListener("pointermove",graphHoverMove,{capture:true,passive:true});
Z.canvas.addEventListener("pointerleave",graphHoverHide,{capture:true,passive:true});
`

export function improveGraph(layout: {
  defaults: Partial<FullPageLayout>
  byPageType: Record<string, Partial<FullPageLayout>>
}) {
  const visited = new Set<QuartzComponent>()
  let patched = 0
  for (const section of [layout.defaults, ...Object.values(layout.byPageType)]) {
    for (const components of Object.values(section)) {
      if (!Array.isArray(components)) continue
      for (const component of components) {
        if (typeof component !== "function" || visited.has(component)) continue
        visited.add(component)
        const script = component.afterDOMLoaded
        if (typeof script !== "string" || !script.includes(point)) continue
        if (!script.includes(dragRadius) || !script.includes(renderLoop)) {
          throw new Error("Graph plugin changed: review the hover improvement before building")
        }
        component.afterDOMLoaded = script
          .replace(point, point.replace('U.eventMode="static"', 'U.hitArea=new o.Circle(0,0,Math.max(Tu,12)),U.eventMode="static"'))
          .replace(dragRadius, 'if(K<Math.max(gu+5,12))return v')
          .replace(renderLoop, reliableHover + renderLoop)
        patched++
      }
    }
  }
  if (!patched) throw new Error("Graph plugin was not found in the Quartz layout")
}
