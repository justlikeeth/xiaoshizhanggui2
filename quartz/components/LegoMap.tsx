import { QuartzComponent } from "./types"

const LegoMap: QuartzComponent = ({ fileData }) => {
  if (fileData.slug !== "atlas") return null
  return (
    <section class="xiaoshi-atlas" aria-label="语料积木地图">
      <div class="atlas-bar">
        <div class="atlas-heading"><span class="atlas-mark">▦</span><strong>语料积木地图</strong><span class="atlas-count" aria-live="polite">正在加载…</span></div>
        <div class="atlas-controls">
          <label><span class="visually-hidden">查找词条或日记</span><input class="atlas-search" type="search" placeholder="查找词条、日记或日期" /></label>
          <div class="atlas-filters" role="group" aria-label="筛选地图内容">
            <button type="button" data-filter="all" aria-pressed="true">全部</button>
            <button type="button" data-filter="dict" aria-pressed="false">词典</button>
            <button type="button" data-filter="diary" aria-pressed="false">日记</button>
          </div>
        </div>
      </div>
      <div class="atlas-layout">
        <div class="atlas-scroll" role="region" aria-label="可横向滚动的积木地图" tabindex={0}>
          <svg class="atlas-canvas" role="group" aria-label="按四类词典和最近两个月日记分区排列的积木地图" />
        </div>
        <aside class="atlas-detail" aria-live="polite">
          <span class="atlas-kicker">探索提示</span>
          <h3>点一块积木</h3>
          <p>查看原文、日期和它在本站明确链接到的内容。再点同一块可直接打开原文。</p>
        </aside>
      </div>
      <p class="atlas-note">线段只在选中积木时出现，表示文章之间已有的直接链接；街区表示栏目分类。没有线段不代表内容无关。地图根据本站公开的内容索引自动生成。</p>
    </section>
  )
}

LegoMap.css = `
body[data-slug="atlas"] .page > #quartz-body { display: block; max-width: 1280px; margin: auto; padding: 0 clamp(1rem, 3vw, 2.5rem); }
body[data-slug="atlas"] .page > #quartz-body .sidebar { display: none; }
body[data-slug="atlas"] .page > #quartz-body .center { width: 100%; min-width: 0; max-width: none; }
body[data-slug="atlas"] .center > article { max-width: 72ch; }
.xiaoshi-atlas { --atlas-ink: #263544; --atlas-muted: #5e7080; --atlas-paper: #fffdf8; --atlas-edge: #e4e5df; color: var(--atlas-ink); font-family: inherit; max-width: 100%; margin: 1.3rem auto 2.5rem; border: 1px solid var(--atlas-edge); border-radius: 1.2rem; background: var(--atlas-paper); box-shadow: 0 12px 36px #1428350e; overflow: hidden; }
.atlas-bar { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; align-items: center; justify-content: space-between; padding: 1rem 1.2rem; border-bottom: 1px solid var(--atlas-edge); }
.atlas-heading { display: flex; align-items: center; gap: .5rem; }
.atlas-heading strong { font-size: 1.12rem; }
.atlas-mark { display: inline-flex; align-items: center; justify-content: center; height: 1.75rem; width: 1.75rem; background: #f7eac9; border-radius: .4rem; color: #936427; font-size: 1.45rem; }
.atlas-count { margin-left: .5rem; color: var(--atlas-muted); font-size: .82rem; }
.atlas-controls { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; }
.atlas-search { width: min(15rem, 70vw); box-sizing: border-box; padding: .5rem .7rem; border: 1px solid #cbd5da; border-radius: .5rem; color: #263544; background: #fff; font-size: .9rem; }
.atlas-search:focus-visible, .atlas-filters button:focus-visible, .atlas-brick:focus-visible { outline: 3px solid #326eb2; outline-offset: 3px; }
.atlas-filters { display: flex; gap: .2rem; background: #edf1f2; padding: .2rem; border-radius: .5rem; }
.atlas-filters button { padding: .35rem .55rem; border: 0; border-radius: .35rem; color: #455969; background: transparent; cursor: pointer; font-size: .85rem; }
.atlas-filters button[aria-pressed="true"] { background: #fff; color: #263544; box-shadow: 0 1px 4px #0002; }
.atlas-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(235px, 27%); align-items: start; }
.atlas-scroll { min-width: 0; overflow: auto; background-color: #f5f4ec; background-image: radial-gradient(#b2b9b31c 1px, transparent 1px); background-size: 17px 17px; }
.atlas-canvas { display: block; width: 100%; min-width: 780px; height: auto; }
.atlas-district { fill: #fffefa; fill-opacity: .8; stroke: #d7dcd9; stroke-width: 1.5; }
.atlas-district-title { fill: #344c56; font-size: 16px; font-weight: 700; }
.atlas-district-subtitle { fill: #66777c; font-size: 11px; }
.atlas-district-line { stroke: #d2d9d6; stroke-width: 1.2; stroke-dasharray: 4 5; }
.atlas-road { fill: none; stroke: #657b8e; stroke-width: 2; stroke-dasharray: 4 4; opacity: .65; pointer-events: none; }
.atlas-brick { cursor: pointer; transition: opacity .15s ease; }
.atlas-brick polygon { stroke: #26354433; stroke-width: .9; }
.atlas-brick ellipse { fill: #ffffff80; stroke: #26354444; stroke-width: 1; }
.atlas-brick text { font-size: 10px; fill: #324556; text-anchor: middle; font-weight: 600; paint-order: stroke; stroke: #f5f4ec; stroke-width: 3px; stroke-linejoin: round; }
.atlas-brick.is-muted { opacity: .12; }
.atlas-brick.is-linked { filter: drop-shadow(0 0 5px #d9984c); }
.atlas-brick.is-active { filter: drop-shadow(0 1px 5px #2449639c); }
.atlas-brick.is-active polygon:first-child { stroke: #1f4f76; stroke-width: 2.5; }
.atlas-detail { position: sticky; top: 0; min-height: 330px; max-height: 78vh; overflow-y: auto; box-sizing: border-box; padding: 1.2rem 1.1rem; border-left: 1px solid var(--atlas-edge); color: #304454; line-height: 1.55; }
.atlas-detail h3 { margin: .5rem 0; font-size: 1.12rem; line-height: 1.4; overflow-wrap: anywhere; }
.atlas-detail p { margin: .45rem 0 .9rem; font-size: .86rem; }
.atlas-kicker { color: #526d80; font-size: .76rem; font-weight: 700; letter-spacing: .04em; }
.atlas-open { display: inline-block; padding: .43rem .7rem; color: #fff !important; border-radius: .42rem; background: #325a76; text-decoration: none !important; font-size: .85rem; }
.atlas-detail h4 { margin: 1.2rem 0 .3rem; font-size: .83rem; }
.atlas-detail ul { list-style: none; padding: 0; margin: 0; font-size: .79rem; }
.atlas-detail li { margin: .28rem 0; overflow-wrap: anywhere; }
.atlas-note { margin: 0; padding: .7rem 1.2rem 1rem; border-top: 1px solid var(--atlas-edge); color: #5e7080; font-size: .77rem; line-height: 1.6; }
.xiaoshi-atlas .visually-hidden { position: absolute; height: 1px; width: 1px; clip: rect(0,0,0,0); overflow: hidden; white-space: nowrap; }
@media (max-width: 800px) { .atlas-layout { display: block; } .atlas-scroll { max-height: 66vh; } .atlas-detail { position: static; min-height: 0; max-height: none; border-left: 0; border-top: 1px solid var(--atlas-edge); } }
@media (prefers-reduced-motion: reduce) { .atlas-brick { transition: none; } }
:root[saved-theme="dark"] .xiaoshi-atlas { --atlas-paper: #202c32; --atlas-ink: #e7efef; --atlas-muted: #bac9cc; --atlas-edge: #506168; }
:root[saved-theme="dark"] .atlas-scroll { background-color: #e7e8dd; }
:root[saved-theme="dark"] .atlas-detail, :root[saved-theme="dark"] .atlas-detail h3 { color: #e7efef; }
`

LegoMap.afterDOMLoaded = `
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  let run = 0;
  const districts = [
    {key:'market', name:'女装市场词典', tint:'#eeaa62'},
    {key:'industry', name:'产业带词典', tint:'#72b5a0'},
    {key:'silk', name:'丝绸词典', tint:'#aa94d2'},
    {key:'concept', name:'小施概念', tint:'#85a8d2'}
  ];
  const el = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (parent) parent.appendChild(node);
    return node;
  };
  const urlFor = slug => {
    const clean = slug.replace(/\\/index$/, '/');
    return (document.body.dataset.basepath || '') + encodeURI('/' + clean);
  };
  const normalize = slug => String(slug || '').replace(/^\\//, '').replace(/\\/$/, '').replace(/\\/index$/, '');
  const short = (value, max) => Array.from(value).length > max ? Array.from(value).slice(0, max).join('') + '…' : value;
  const clear = node => { while (node.firstChild) node.removeChild(node.firstChild); };
  function drawDistrict(svg, x, y, w, h, title, count, accent) {
    el('rect', {x,y,width:w,height:h,rx:18,class:'atlas-district'}, svg);
    el('rect', {x:x+14,y:y+16,width:7,height:22,rx:3,fill:accent},svg);
    el('text', {x:x+32,y:y+34,class:'atlas-district-title'},svg).textContent = title;
    el('text', {x:x+w-18,y:y+34,'text-anchor':'end',class:'atlas-district-subtitle'},svg).textContent = count + ' 篇';
    el('line',{x1:x+16,y1:y+50,x2:x+w-16,y2:y+50,class:'atlas-district-line'},svg);
  }
  function drawBrick(layer, item, x, y) {
    const group = el('g',{class:'atlas-brick',role:'button',tabindex:0,'aria-label':item.title + '，点选后可打开原文'},layer);
    const top = [[x,y-8],[x+23,y-20],[x+50,y-8],[x+27,y+4]].map(p=>p.join(',')).join(' ');
    const left = [[x,y-8],[x+27,y+4],[x+27,y+16],[x,y+4]].map(p=>p.join(',')).join(' ');
    const right = [[x+27,y+4],[x+50,y-8],[x+50,y+4],[x+27,y+16]].map(p=>p.join(',')).join(' ');
    el('polygon',{points:top,fill:item.tint},group);
    el('polygon',{points:left,fill:item.side},group);
    el('polygon',{points:right,fill:item.dark},group);
    el('ellipse',{cx:x+25,cy:y-9,rx:6,ry:3},group);
    el('text',{x:x+25,y:y+29},group).textContent = item.label;
    item.group = group; item.cx = x + 25; item.cy = y - 8;
    return group;
  }
  function makeLink(detail, title, href) {
    const link = document.createElement('a');
    link.href = href; link.textContent = title; detail.appendChild(link);
    return link;
  }
  function setup(root, index) {
    const canvas = root.querySelector('.atlas-canvas');
    const detail = root.querySelector('.atlas-detail');
    const entries = Object.entries(index).filter(([slug,page]) => page && page.title && !slug.startsWith('tags/'));
    const dict = entries.filter(([slug]) => /^dict\\/(market|industry|silk|concept)\\//.test(slug));
    const diary = entries.filter(([slug]) => /^diary\\/\\d{4}-\\d{2}-\\d{2}$/.test(slug));
    const months = [...new Set(diary.map(([slug]) => slug.slice(6,13)))].sort().slice(-2).reverse();
    const items = [];
    const map = new Map();
    const site = new Map(entries.map(([slug,page]) => [normalize(slug),{slug,page}]));
    const dictGroups = districts.map(d => {
      const pages = dict.filter(([slug]) => slug.startsWith('dict/' + d.key + '/'))
        .sort((a,b) => (a[0].endsWith('/index') ? -1 : b[0].endsWith('/index') ? 1 : a[0].localeCompare(b[0],'zh')));
      return {kind:'dict',title:d.name,accent:d.tint,group:d.key,pages};
    });
    const monthGroups = months.map((month, i) => ({kind:'diary',title:month.replace('-', ' 年 ') + ' 月日记',accent:i ? '#97bba4' : '#87aec9',group:month,pages:diary.filter(([slug])=>slug.slice(6,13)===month).sort((a,b)=>a[0].localeCompare(b[0]))}));
    const maxDictRows = Math.max(4,...dictGroups.map(group=>Math.ceil(group.pages.length/4)));
    const topH = Math.max(278, 80 + maxDictRows * 43);
    const monthH = Math.max(300,...monthGroups.map(group=>100+Math.ceil(group.pages.length/8)*51));
    const bottomY = 26 + topH + 22;
    const height = bottomY + monthH + 28;
    canvas.setAttribute('viewBox','0 0 920 ' + height);
    clear(canvas);
    el('title',{},canvas).textContent = '小施掌柜：词典与最近两个月日记的积木地图';
    const background = el('g',{},canvas);
    const roads = el('g',{},canvas);
    const bricks = el('g',{},canvas);
    const groups = dictGroups.concat(monthGroups);
    groups.forEach((group,i) => {
      const isDict = i < 4;
      const x = isDict ? 12 + i*226 : 12 + (i-4)*452;
      const y = isDict ? 26 : bottomY;
      const w = isDict ? 214 : 440;
      const h = isDict ? topH : monthH;
      drawDistrict(background,x,y,w,h,group.title,group.pages.length,group.accent);
      group.pages.forEach(([slug,page],n) => {
        const col = n % (isDict ? 4 : 8);
        const row = Math.floor(n / (isDict ? 4 : 8));
        const bx = x + (isDict ? 8+col*49+row*2 : 11+col*51+row*2);
        const by = y + (isDict ? 89+row*43-col*2 : 91+row*51-col*2);
        const item = {slug,title:String(page.title),page,kind:group.kind,districtTitle:group.title,
          label:isDict ? (slug.endsWith('/index') ? '入口' : short(String(page.title).replace(/^[《“]|[》”]$/g,''),6)) : slug.slice(-5).replace('-', '·'),
          tint:group.accent, side:isDict ? '#ba9279' : '#698fa2', dark:isDict ? '#aa7d61' : '#597e91'};
        if (group.group === 'industry') {item.side='#568b7b';item.dark='#477968';}
        if (group.group === 'silk') {item.side='#8473a9';item.dark='#706096';}
        if (group.group === 'concept') {item.side='#6989aa';item.dark='#526f98';}
        if (!isDict && i === 5) {item.side='#739989';item.dark='#5f8574';}
        drawBrick(bricks,item,bx,by);
        items.push(item);map.set(normalize(slug),item);
      });
    });
    const count = root.querySelector('.atlas-count');
    const search = root.querySelector('.atlas-search');
    const filterButtons = [...root.querySelectorAll('[data-filter]')];
    let filter = 'all', selected = null;
    function applyFilter() {
      const query = search.value.trim().toLocaleLowerCase();
      let visible = 0;
      items.forEach(item => {
        const matches = (filter === 'all' || filter === item.kind) &&
          (!query || (item.title+' '+item.slug+' '+item.districtTitle).toLocaleLowerCase().includes(query));
        item.group.classList.toggle('is-muted',!matches);
        if (matches) visible++;
      });
      count.textContent = visible + ' / ' + items.length + ' 块 · ' + (months.length ? months.join('、') : '暂无日记');
    }
    function show(item) {
      clear(roads);
      items.forEach(entry => entry.group.classList.remove('is-active','is-linked'));
      clear(detail);
      if (!item) {
        detail.appendChild(Object.assign(document.createElement('span'),{className:'atlas-kicker',textContent:'探索提示'}));
        detail.appendChild(Object.assign(document.createElement('h3'),{textContent:'点一块积木'}));
        detail.appendChild(Object.assign(document.createElement('p'),{textContent:'查看原文、日期和它在本站明确链接到的内容。再点同一块可直接打开原文。'}));
        return;
      }
      item.group.classList.add('is-active');
      detail.appendChild(Object.assign(document.createElement('span'),{className:'atlas-kicker',textContent:item.districtTitle}));
      detail.appendChild(Object.assign(document.createElement('h3'),{textContent:item.title}));
      const date = item.slug.match(/\\d{4}-\\d{2}-\\d{2}/);
      if (date) detail.appendChild(Object.assign(document.createElement('p'),{textContent:'记录日期：'+date[0]}));
      else if (item.page.description) detail.appendChild(Object.assign(document.createElement('p'),{textContent:short(String(item.page.description),96)}));
      const open = makeLink(detail,'打开原文 ↗',urlFor(item.slug));open.className='atlas-open';
      const out = (item.page.links || []).map(normalize).filter(Boolean);
      const incoming = entries.filter(([slug,page]) => slug!==item.slug && (page.links || []).map(normalize).includes(normalize(item.slug))).map(([slug])=>normalize(slug));
      const drawn = new Set();
      out.concat(incoming).forEach(slug => {
        const target = map.get(slug);
        if (!target || target === item || drawn.has(slug)) return;
        drawn.add(slug);target.group.classList.add('is-linked');
        el('path',{d:'M '+item.cx+' '+item.cy+' L '+target.cx+' '+target.cy,class:'atlas-road'},roads);
      });
      [[out,'本文链接到'],[incoming,'链接到本文']].forEach(([links,heading]) => {
        const found = [...new Set(links)].map(slug=>site.get(slug)).filter(Boolean).slice(0,8);
        if (!found.length) return;
        detail.appendChild(Object.assign(document.createElement('h4'),{textContent:heading}));
        const list = document.createElement('ul');detail.appendChild(list);
        found.forEach(({slug,page})=> {const li=document.createElement('li');list.appendChild(li);makeLink(li,String(page.title),urlFor(slug));});
      });
      if (!drawn.size) detail.appendChild(Object.assign(document.createElement('p'),{textContent:'地图范围内暂无直接双链；这不表示内容之间没有关联。'}));
    }
    items.forEach(item => {
      item.group.addEventListener('pointerenter',()=>show(item));
      item.group.addEventListener('pointerleave',()=>show(selected));
      item.group.addEventListener('focus',()=>show(item));
      item.group.addEventListener('blur',()=>show(selected));
      item.group.addEventListener('click',()=>{if (selected === item) window.location.href=urlFor(item.slug); else {selected=item;show(item);} });
      item.group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();item.group.click();}});
    });
    search.addEventListener('input',applyFilter);
    filterButtons.forEach(button=>button.addEventListener('click',()=>{
      filter=button.dataset.filter;
      filterButtons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
      applyFilter();
    }));
    applyFilter();
  }
  async function mount() {
    const root = document.querySelector('.xiaoshi-atlas');
    if (!root || root.dataset.ready) return;
    root.dataset.ready='loading';
    const thisRun=++run;
    try {
      const url=(document.body.dataset.basepath||'')+'/static/contentIndex.json';
      const response=await fetch(url);
      if(!response.ok) throw new Error('内容索引未加载：HTTP '+response.status);
      const index=await response.json();
      if(thisRun!==run || !root.isConnected) return;
      setup(root,index);root.dataset.ready='true';
    } catch(error) {
      root.dataset.ready='';root.querySelector('.atlas-count').textContent='地图暂时无法加载';
      root.querySelector('.atlas-detail').textContent=String(error);
    }
  }
  document.addEventListener('nav',mount);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
})();
`

export default LegoMap
