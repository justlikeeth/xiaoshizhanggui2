import { FullPageLayout } from "../cfg"
import { QuartzComponent } from "./types"

// The community graph 0.1.0 draws tiny dots, so hovering the visible dot is
// unnecessarily difficult. Keep the plugin installed as-is and improve the
// generated client script before Quartz writes it to the page. These exact
// anchors intentionally fail the build if a future plugin update changes them.
const point =
  'U.circle(0,0,Tu),U.fill({color:De?He:le}),De&&U.stroke({width:2,color:ue}),U.eventMode="static"'
const hover = 'A.on("pointerover",function(N){Wu(F.id),j=v.alpha,Eu||Au()})'
const leave = 'A.on("pointerleave",function(){Wu(null),v.alpha=j,Eu||Au()})'
const dragRadius = 'if(K<gu+5)return v'

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
        if (!script.includes(hover) || !script.includes(leave) || !script.includes(dragRadius)) {
          throw new Error("Graph plugin changed: review the hover improvement before building")
        }
        component.afterDOMLoaded = script
          .replace(point, point.replace('U.eventMode="static"', 'U.hitArea=new o.Circle(0,0,Math.max(Tu,12)),U.eventMode="static"'))
          .replace(
            hover,
            'A.on("pointerover",function(N){Wu(F.id),j=v.alpha,Eu||Au();var tip=d.querySelector(".graph-hover-title");tip||(tip=document.createElement("div"),tip.className="graph-hover-title",tip.setAttribute("role","status"),d.appendChild(tip));tip.textContent=F.text;tip.hidden=!1})',
          )
          .replace(
            leave,
            'A.on("pointerleave",function(){Wu(null),v.alpha=j,Eu||Au();var tip=d.querySelector(".graph-hover-title");tip&&(tip.hidden=!0)})',
          )
          .replace(dragRadius, 'if(K<Math.max(gu+5,12))return v')
        patched++
      }
    }
  }
  if (!patched) throw new Error("Graph plugin was not found in the Quartz layout")
}
