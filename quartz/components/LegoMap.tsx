import { QuartzComponent } from "./types"

const LegoMap: QuartzComponent = ({ fileData }) => {
  if (fileData.slug !== "lab/graph-blocks") return null
  return (
    <section class="xiaoshi-atlas" aria-label="从知识图谱生长的积木图">
      <header class="atlas-bar">
        <div>
          <div class="atlas-heading">
            <span class="atlas-mark">▧</span>
            <strong>关系积木图</strong>
          </div>
          <p class="atlas-subtitle">从一个节点出发，沿真实链接与标签关系逐块向外拼</p>
        </div>
        <div class="atlas-controls">
          <label class="atlas-search-label">
            <span class="visually-hidden">寻找新的起点</span>
            <input
              class="atlas-search"
              type="search"
              placeholder="寻找新的起点"
              autocomplete="off"
            />
            <span class="atlas-results" hidden />
          </label>
          <button class="atlas-reset" type="button">
            回到起点
          </button>
        </div>
      </header>
      <div class="atlas-layout">
        <div class="atlas-scroll" role="region" aria-label="可滚动的关系积木图" tabindex={0}>
          <svg class="atlas-canvas" role="group" aria-label="由文章链接和标签关系生成的积木图" />
        </div>
        <aside class="atlas-detail" aria-live="polite">
          <span class="atlas-kicker">正在读取图谱</span>
          <h3>稍等片刻</h3>
          <p>地图会从知识图谱的公开内容索引读取链接和标签。</p>
        </aside>
      </div>
      <div class="atlas-bottom">
        <span class="atlas-count" aria-live="polite">
          正在加载…
        </span>
        <span class="atlas-key">
          <i class="atlas-key-page" />
          文章和词条 <i class="atlas-key-tag" />
          标签节点 <i class="atlas-key-link" />
          文章链接 <i class="atlas-key-tags" />
          标签连接
        </span>
      </div>
      <div class="atlas-hover" role="tooltip" hidden />
    </section>
  )
}

LegoMap.css = `
body[data-slug="lab/graph-blocks"] .page > #quartz-body { display: block; max-width: 1380px; margin: auto; padding: 0 clamp(1rem,3vw,2.5rem); }
body[data-slug="lab/graph-blocks"] .page > #quartz-body .sidebar { display: none; }
body[data-slug="lab/graph-blocks"] .page > #quartz-body .center { width: 100%; min-width: 0; max-width: none; }
body[data-slug="lab/graph-blocks"] .center > article { max-width: 72ch; }
.xiaoshi-atlas { --atlas-ink: #2b3d4b; --atlas-muted: #657781; --atlas-paper: #fffdf8; --atlas-border: #dbe1de; position: relative; color: var(--atlas-ink); margin: 1.3rem auto 2.5rem; border: 1px solid var(--atlas-border); border-radius: 1.1rem; background: var(--atlas-paper); box-shadow: 0 12px 36px #14283510; overflow: hidden; }
.atlas-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .9rem 1.4rem; padding: 1rem 1.2rem; border-bottom: 1px solid var(--atlas-border); }
.atlas-heading { display: flex; gap: .55rem; align-items: center; font-size: 1.1rem; }
.atlas-mark { display: inline-grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: .4rem; background: #e8dfca; color: #806541; font-size: 1.4rem; }
.atlas-subtitle { margin: .2rem 0 0; color: var(--atlas-muted); font-size: .82rem; }
.atlas-controls { display: flex; align-items: center; gap: .55rem; }
.atlas-search-label { position: relative; }
.atlas-search { box-sizing: border-box; width: min(16rem,46vw); padding: .48rem .65rem; border: 1px solid #cbd5d7; border-radius: .5rem; background: #fff; color: #253c48; font-size: .86rem; }
.atlas-reset, .atlas-detail button { border: 1px solid var(--atlas-border); border-radius: .45rem; background: var(--atlas-paper); color: var(--atlas-ink); padding: .42rem .65rem; cursor: pointer; font-size: .82rem; }
.atlas-reset:hover, .atlas-detail button:hover { border-color: #658b9f; }
.atlas-search:focus-visible, .atlas-reset:focus-visible, .atlas-brick:focus-visible, .atlas-detail button:focus-visible { outline: 3px solid #527daa; outline-offset: 2px; }
.atlas-results { position: absolute; z-index: 12; top: calc(100% + .25rem); left: 0; width: min(26rem,80vw); max-height: 19rem; overflow: auto; background: var(--atlas-paper); border: 1px solid var(--atlas-border); border-radius: .5rem; box-shadow: 0 7px 20px #0002; }
.atlas-results[hidden], .atlas-hover[hidden] { display: none; }
.atlas-results button { display: block; width: 100%; border: 0; border-bottom: 1px solid var(--atlas-border); padding: .6rem .7rem; text-align: left; color: var(--atlas-ink); background: transparent; cursor: pointer; font-size: .8rem; line-height: 1.45; }
.atlas-results button:hover { background: #a5bbc328; }
.atlas-layout { display: grid; grid-template-columns: minmax(0,1fr) minmax(220px,25%); }
.atlas-scroll { min-width: 0; height: min(68vh,690px); min-height: 470px; overflow: auto; background: #f4f2e8; background-image: radial-gradient(#7c94a927 1px,transparent 1px); background-size: 18px 18px; }
.atlas-canvas { display: block; width: 100%; min-width: 820px; height: auto; }
.atlas-edge { fill: none; stroke-width: 2; opacity: .3; pointer-events: none; }
.atlas-edge-link { stroke: #728a93; }
.atlas-edge-tag { stroke: #a585b3; stroke-dasharray: 3 4; }
.atlas-edge.is-lit { opacity: .88; stroke-width: 3; }
.atlas-brick { cursor: pointer; }
.atlas-brick .atlas-top { stroke: #24374740; stroke-width: 1.1; }
.atlas-brick .atlas-face { stroke: #24374745; stroke-width: .8; }
.atlas-brick .atlas-stud { fill: #ffffffa3; stroke: #26374755; stroke-width: 1; }
.atlas-brick text { fill: #2a3d4c; stroke: #f8f6ef; stroke-width: 2.5px; paint-order: stroke; font-size: 10px; font-weight: 700; text-anchor: middle; pointer-events: none; }
.atlas-brick.is-root { filter: drop-shadow(0 2px 6px #b37c3c88); }
.atlas-brick.is-selected { filter: drop-shadow(0 2px 7px #385d7a99); }
.atlas-brick.is-neighbor { filter: drop-shadow(0 1px 5px #62869177); }
.atlas-brick.is-new { animation: atlas-pop .32s ease-out both; transform-box: fill-box; transform-origin: center; }
@keyframes atlas-pop { from { opacity: 0; transform: scale(.35) translateY(-10px); } to { opacity: 1; transform: scale(1); } }
.atlas-detail { box-sizing: border-box; max-height: min(68vh,690px); overflow-y: auto; padding: 1rem; border-left: 1px solid var(--atlas-border); color: var(--atlas-ink); }
.atlas-kicker { color: #607c8a; font-size: .75rem; font-weight: 700; letter-spacing: .035em; }
.atlas-detail h3 { font-size: 1.1rem; line-height: 1.4; margin: .5rem 0; overflow-wrap: anywhere; }
.atlas-detail p { font-size: .84rem; line-height: 1.6; margin: .4rem 0 .85rem; }
.atlas-detail .atlas-actions { display: flex; flex-wrap: wrap; gap: .4rem; margin: .85rem 0; }
.atlas-open { display: inline-block; padding: .43rem .7rem; border-radius: .42rem; color: white !important; background: #3d6680; text-decoration: none !important; font-size: .83rem; }
.atlas-detail h4 { font-size: .82rem; margin: 1rem 0 .4rem; }
.atlas-detail ul { list-style: none; padding: 0; margin: 0; font-size: .78rem; }
.atlas-detail li { margin: .35rem 0; overflow-wrap: anywhere; }
.atlas-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .55rem; padding: .7rem 1.2rem; border-top: 1px solid var(--atlas-border); color: var(--atlas-muted); font-size: .76rem; }
.atlas-key { display: inline-flex; align-items: center; flex-wrap: wrap; gap: .2rem .45rem; }
.atlas-key i { display: inline-block; width: .72rem; height: .72rem; border-radius: .15rem; }
.atlas-key-page { background: #e8ac72; }.atlas-key-tag { background: #b6a0d7; }
.atlas-key .atlas-key-link,.atlas-key .atlas-key-tags { width: 1rem; height: 0; border-radius: 0; border-top: 2px solid #728a93; }
.atlas-key .atlas-key-tags { border-top: 2px dashed #a585b3; }
.atlas-hover { position: fixed; z-index: 99999; box-sizing: border-box; width: max-content; max-width: min(22rem,calc(100vw - 1.5rem)); padding: .48rem .66rem; border: 1px solid #b8c8cd; border-radius: .4rem; background: #fffdf7; color: #243947; box-shadow: 0 3px 14px #0003; line-height: 1.45; font-size: .9rem; overflow-wrap: anywhere; pointer-events: none; }
.xiaoshi-atlas .visually-hidden { position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0); overflow: hidden; white-space: nowrap; }
:root[saved-theme="dark"] .xiaoshi-atlas { --atlas-paper:#253039;--atlas-ink:#e5eded;--atlas-muted:#bbc8cd;--atlas-border:#566871; }
:root[saved-theme="dark"] .atlas-scroll { background-color:#e8e7dd; }
@media(max-width:780px) { .atlas-layout { display:block; }.atlas-scroll { height:55vh;min-height:370px; }.atlas-detail { max-height:none;border-left:0;border-top:1px solid var(--atlas-border); } }
@media(prefers-reduced-motion:reduce) { .atlas-brick.is-new { animation:none; } }
`

LegoMap.afterDOMLoaded = `
(() => {
  const NS='http://www.w3.org/2000/svg', BATCH=14, LIMIT=140;
  let mountNumber=0;
  const element=(tag,attrs,parent)=>{
    const node=document.createElementNS(NS,tag);
    Object.entries(attrs||{}).forEach(([name,value])=>node.setAttribute(name,String(value)));
    if(parent)parent.appendChild(node);
    return node;
  };
  const clear=node=>{while(node.firstChild)node.removeChild(node.firstChild)};
  const normalize=value=>String(value||'').replace(/^\\//,'').replace(/\\/$/,'').replace(/\\/index$/,'');
  const articleUrl=slug=>(document.body.dataset.basepath||'')+encodeURI('/'+(slug==='index'?'':slug.replace(/\\/index$/,'/')));
  const shorten=(text,n)=>Array.from(text).length>n?Array.from(text).slice(0,n).join('')+'…':text;
  const dateOf=node=>{const found=node.slug&&node.slug.match(/\\d{4}-\\d{2}-\\d{2}/);return found?Date.parse(found[0]):NaN};
  const kindOf=slug=>slug.startsWith('diary/')?'日记':slug.startsWith('dict/')?'词条':slug.startsWith('posts/')?'文章':slug.startsWith('podcasts/')?'播客':slug.startsWith('transcripts/')?'转写': '页面';
  const keyOf=(a,b)=>[a,b].sort().join('\\u0000');
  const keyAt=(q,r)=>q+','+r;
  function buildGraph(index) {
    const nodes=new Map(),edges=new Map();
    for(const [slug,page] of Object.entries(index)) {
      if(!page||!page.title||slug.startsWith('tags/'))continue;
      const id=normalize(slug);
      nodes.set(id,{id,slug,title:String(page.title),type:'page',kind:kindOf(slug),page,neighbors:new Map()});
    }
    const connect=(a,b,kind)=>{
      if(!nodes.has(a)||!nodes.has(b)||a===b)return;
      const key=keyOf(a,b);
      if(!edges.has(key))edges.set(key,{a,b,kind});
      nodes.get(a).neighbors.set(b,kind);
      nodes.get(b).neighbors.set(a,kind);
    };
    for(const node of [...nodes.values()]) {
      for(const link of node.page.links||[])connect(node.id,normalize(link),'link');
      for(const tag of node.page.tags||[]) {
        const id='tag:'+tag;
        if(!nodes.has(id))nodes.set(id,{id,slug:'tags/'+tag,title:'#'+tag,type:'tag',kind:'标签',neighbors:new Map()});
        connect(node.id,id,'tag');
      }
    }
    return {nodes,edges};
  }
  function start(root,index) {
    const canvas=root.querySelector('.atlas-canvas');
    const scroll=root.querySelector('.atlas-scroll');
    const detail=root.querySelector('.atlas-detail');
    const count=root.querySelector('.atlas-count');
    const hover=root.querySelector('.atlas-hover');
    const search=root.querySelector('.atlas-search');
    const results=root.querySelector('.atlas-results');
    const resetButton=root.querySelector('.atlas-reset');
    const {nodes,edges}=buildGraph(index);
    const pages=[...nodes.values()].filter(n=>n.type==='page');
    let origin=null,selected=null,placed=new Map(),occupied=new Set(),newItems=new Set();
    function matchesRoot(value){
      if(value.startsWith('tags/'))return 'tag:'+value.slice(5);
      return normalize(value);
    }
    function chooseRoot(value){
      const requested=nodes.get(matchesRoot(value||''));
      return requested||nodes.get('dict/concept')||pages.find(n=>n.neighbors.size>2)||pages[0];
    }
    const currentFrom=new URLSearchParams(location.search).get('from');
    const initial=chooseRoot(currentFrom);
    function orderNeighbors(parent){
      const sourceDate=dateOf(origin);
      return [...parent.neighbors.keys()].filter(id=>nodes.has(id)&&!placed.has(id))
        .sort((a,b)=>{
          const an=nodes.get(a),bn=nodes.get(b);
          const linkFirst=(parent.neighbors.get(a)==='link'?0:1)-(parent.neighbors.get(b)==='link'?0:1);
          if(linkFirst)return linkFirst;
          if(Number.isFinite(sourceDate)){
            const da=dateOf(an),db=dateOf(bn);
            if(Number.isFinite(da)&&Number.isFinite(db)&&Math.abs(da-sourceDate)!==Math.abs(db-sourceDate))return Math.abs(da-sourceDate)-Math.abs(db-sourceDate);
          }
          return a.localeCompare(b,'zh');
        });
    }
    function findCell(parent,id){
      const bias=[...id].reduce((n,ch)=>n+ch.charCodeAt(0),0)%7;
      let best=null,bestScore=Infinity;
      for(let radius=1;radius<=30;radius++){
        for(let q=parent.q-radius;q<=parent.q+radius;q++)for(let r=parent.r-radius;r<=parent.r+radius;r++){
          const distance=Math.abs(q-parent.q)+Math.abs(r-parent.r);
          if(distance!==radius||occupied.has(keyAt(q,r)))continue;
          const outward=Math.abs(q)+Math.abs(r);
          const score=distance*100-outward*4+((q*13+r*7+bias*11+10000)%17);
          if(score<bestScore){best={q,r};bestScore=score}
        }
        if(best)return best;
      }
      return null;
    }
    function expand(id,amount=BATCH){
      const parent=placed.get(id),node=nodes.get(id);
      if(!parent||!node)return 0;
      let added=0;
      for(const next of orderNeighbors(node)){
        if(placed.size>=LIMIT||added>=amount)break;
        const spot=findCell(parent,next);
        if(!spot)break;
        placed.set(next,{...spot,id:next,parent:id,depth:parent.depth+1});
        occupied.add(keyAt(spot.q,spot.r));
        newItems.add(next);
        added++;
      }
      return added;
    }
    function describe(node){
      clear(detail);
      const kick=document.createElement('span');kick.className='atlas-kicker';kick.textContent=node.kind+(node.id===origin.id?' · 起点':'');detail.appendChild(kick);
      const title=document.createElement('h3');title.textContent=node.title;detail.appendChild(title);
      const visible=[...node.neighbors.keys()].filter(id=>placed.has(id));
      const hidden=[...node.neighbors.keys()].filter(id=>!placed.has(id));
      const context=document.createElement('p');
      context.textContent='已拼出相邻 '+visible.length+' 块；还有 '+hidden.length+' 块可沿关系展开。';
      detail.appendChild(context);
      const actions=document.createElement('div');actions.className='atlas-actions';detail.appendChild(actions);
      if(hidden.length&&placed.size<LIMIT){
        const grow=document.createElement('button');grow.type='button';grow.textContent='沿这里继续拼 +'+Math.min(BATCH,hidden.length);
        grow.addEventListener('click',()=>{expand(node.id);render();describe(node)});
        actions.appendChild(grow);
      }
      if(node.id!==origin.id){
        const reRoot=document.createElement('button');reRoot.type='button';reRoot.textContent='以它为新起点';
        reRoot.addEventListener('click',()=>reset(node,true));
        actions.appendChild(reRoot);
      }
      const original=document.createElement('a');original.className='atlas-open';original.href=articleUrl(node.slug);original.textContent=node.type==='tag'?'查看标签页 ↗':'打开原文 ↗';actions.appendChild(original);
      if(!node.neighbors.size){
        const empty=document.createElement('p');empty.textContent='这个节点目前没有文章链接或标签关系，可搜索另一篇内容作为起点。';detail.appendChild(empty);
      }
      if(visible.length){
        const heading=document.createElement('h4');heading.textContent='图上已连接的节点';detail.appendChild(heading);
        const list=document.createElement('ul');detail.appendChild(list);
        visible.slice(0,8).forEach(id=>{
          const next=nodes.get(id),li=document.createElement('li');
          li.textContent=(node.neighbors.get(id)==='tag'?'标签 · ':'文章链接 · ')+next.title;
          list.appendChild(li);
        });
      }
    }
    function cell(p){return {x:(p.q-p.r)*38,y:(p.q+p.r)*20}}
    function render(){
      const cells=[...placed.values()].map(cell);
      const minX=Math.min(...cells.map(p=>p.x)),maxX=Math.max(...cells.map(p=>p.x));
      const minY=Math.min(...cells.map(p=>p.y)),maxY=Math.max(...cells.map(p=>p.y));
      const width=Math.max(840,maxX-minX+240),height=Math.max(510,maxY-minY+230);
      const offsetX=width/2-(minX+maxX)/2,offsetY=height/2-(minY+maxY)/2;
      const loc=p=>{const c=cell(p);return {x:c.x+offsetX,y:c.y+offsetY}};
      canvas.setAttribute('viewBox','0 0 '+width+' '+height);
      canvas.style.minWidth=width+'px';
      clear(canvas);
      element('title',{},canvas).textContent='真实关系拼出的积木图；点击相邻节点继续向外展开';
      const edgeLayer=element('g',{},canvas);
      for(const edge of edges.values()){
        const a=placed.get(edge.a),b=placed.get(edge.b);
        if(!a||!b)continue;
        const p=loc(a),q=loc(b);
        element('path',{d:'M '+p.x+' '+p.y+' L '+q.x+' '+q.y,class:'atlas-edge atlas-edge-'+edge.kind,'data-from':edge.a,'data-to':edge.b},edgeLayer);
      }
      const blocks=element('g',{},canvas);
      const sorted=[...placed.values()].sort((a,b)=>cell(a).y-cell(b).y||cell(a).x-cell(b).x);
      for(const position of sorted){
        const node=nodes.get(position.id),point=loc(position);
        const x=point.x,y=point.y;
        const isTag=node.type==='tag',isRoot=node.id===origin.id;
        const top=isRoot?'#f3c77e':isTag?'#bba7d8':node.kind==='词条'?'#e7ab75':node.kind==='日记'?'#87bdaf':'#91b2c9';
        const front=isRoot?'#c99a58':isTag?'#947fb9':node.kind==='词条'?'#bd835a':node.kind==='日记'?'#61998d':'#668da8';
        const side=isRoot?'#ad7f44':isTag?'#8068a9':node.kind==='词条'?'#a66c49':node.kind==='日记'?'#4e7f73':'#537b96';
        const group=element('g',{class:'atlas-brick'+(isRoot?' is-root':'')+(selected===node.id?' is-selected':'')+(newItems.has(node.id)?' is-new':''),role:'button',tabindex:0,'aria-label':node.title,'data-id':node.id},blocks);
        const points=parts=>parts.map(p=>p.join(',')).join(' ');
        element('polygon',{class:'atlas-top',fill:top,points:points([[x,y-20],[x+38,y],[x,y+20],[x-38,y]])},group);
        element('polygon',{class:'atlas-face',fill:front,points:points([[x-38,y],[x,y+20],[x,y+36],[x-38,y+16]])},group);
        element('polygon',{class:'atlas-face',fill:side,points:points([[x,y+20],[x+38,y],[x+38,y+16],[x,y+36]])},group);
        element('ellipse',{class:'atlas-stud',cx:x-12,cy:y-8,rx:6,ry:3},group);
        element('ellipse',{class:'atlas-stud',cx:x+9,cy:y+3,rx:6,ry:3},group);
        element('text',{x,y:y+29},group).textContent=isRoot?'起点':isTag?shorten(node.title,4):shorten(node.title.replace(/^辑[一二三四五六七八九十百千万零]+\\s*/,''),5);
        const showTooltip=event=>{
          hover.textContent=node.title;hover.hidden=false;
          if(event.clientX!==undefined){
            const box=hover.getBoundingClientRect();
            hover.style.left=Math.max(8,Math.min(event.clientX+15,window.innerWidth-box.width-8))+'px';
            hover.style.top=Math.max(8,Math.min(event.clientY+15,window.innerHeight-box.height-8))+'px';
          }
          blocks.querySelectorAll('.atlas-brick').forEach(item=>item.classList.toggle('is-neighbor',node.neighbors.has(item.getAttribute('data-id'))));
          edgeLayer.querySelectorAll('.atlas-edge').forEach(edge=>edge.classList.toggle('is-lit',edge.getAttribute('data-from')===node.id||edge.getAttribute('data-to')===node.id));
        };
        group.addEventListener('pointerenter',showTooltip);
        group.addEventListener('pointermove',showTooltip);
        group.addEventListener('pointerleave',()=>{hover.hidden=true;blocks.querySelectorAll('.is-neighbor').forEach(e=>e.classList.remove('is-neighbor'));edgeLayer.querySelectorAll('.is-lit').forEach(e=>e.classList.remove('is-lit'))});
        group.addEventListener('focus',showTooltip);
        group.addEventListener('blur',()=>hover.hidden=true);
        group.addEventListener('click',()=>{selected=node.id;expand(node.id);render();describe(node)});
        group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();group.click()}});
      }
      newItems.clear();
      const shownEdges=[...edges.values()].filter(edge=>placed.has(edge.a)&&placed.has(edge.b)).length;
      count.textContent=placed.size+' 块积木 · '+shownEdges+' 条真实关系 · 起点：'+origin.title;
      scroll.scrollLeft=Math.max(0,(canvas.getBoundingClientRect().width-scroll.clientWidth)/2);
      scroll.scrollTop=Math.max(0,(canvas.getBoundingClientRect().height-scroll.clientHeight)/2);
    }
    function reset(node,updateUrl=false){
      origin=node;selected=node.id;placed=new Map([[node.id,{id:node.id,q:0,r:0,parent:null,depth:0}]]);occupied=new Set([keyAt(0,0)]);newItems=new Set([node.id]);
      expand(node.id,16);render();describe(node);
      if(updateUrl)history.replaceState(history.state,'',(document.body.dataset.basepath||'')+'/lab/graph-blocks?from='+encodeURIComponent(node.type==='tag'?node.slug:node.id));
      results.hidden=true;
    }
    function searchNow(){
      clear(results);
      const query=search.value.trim().toLocaleLowerCase();
      if(!query){results.hidden=true;return}
      const matches=pages.filter(node=>(node.title+' '+node.slug).toLocaleLowerCase().includes(query)).slice(0,8);
      for(const node of matches){
        const option=document.createElement('button');option.type='button';option.textContent=node.title;
        option.addEventListener('click',()=>{search.value='';reset(node,true)});
        results.appendChild(option);
      }
      results.hidden=!matches.length;
    }
    search.addEventListener('input',searchNow);
    search.addEventListener('keydown',event=>{
      if(event.key==='Escape')results.hidden=true;
      if(event.key==='Enter'){const first=results.querySelector('button');if(first){event.preventDefault();first.click()}}
    });
    resetButton.addEventListener('click',()=>reset(initial,true));
    reset(initial);
  }
  async function mount(){
    const root=document.querySelector('.xiaoshi-atlas');
    if(!root||root.dataset.ready)return;
    root.dataset.ready='loading';
    const ticket=++mountNumber;
    try{
      const response=await fetch((document.body.dataset.basepath||'')+'/static/contentIndex.json');
      if(!response.ok)throw Error('内容索引未加载：HTTP '+response.status);
      const index=await response.json();
      if(ticket!==mountNumber||!root.isConnected)return;
      start(root,index);root.dataset.ready='true';
    }catch(error){
      root.dataset.ready='';
      root.querySelector('.atlas-count').textContent='关系图暂时无法加载';
      root.querySelector('.atlas-detail').textContent=String(error);
    }
  }
  document.addEventListener('nav',mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
`

export default LegoMap
