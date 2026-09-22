import { QuartzPluginData } from "../plugins/vfile"
import { resolveRelative, simplifySlug } from "../util/path"
import { QuartzComponent } from "./types"

const article = /^(?:diary|dict|posts|podcasts|transcripts|thoughts|wiki)\//

function recordTime(page: QuartzPluginData): number {
  const date = page.frontmatter?.date
  const time = date ? Date.parse(String(date)) : NaN
  return Number.isFinite(time) ? time : 0
}

const RelatedReading: QuartzComponent = ({ fileData, allFiles }) => {
  const slug = fileData.slug
  if (!slug || !article.test(slug) || slug.endsWith("/index")) return null

  const pages = allFiles.filter(
    (page) =>
      page.slug &&
      page.slug !== slug &&
      article.test(page.slug) &&
      !page.slug.endsWith("/index") &&
      page.frontmatter?.title &&
      page.unlisted !== true &&
      page.encrypted !== true,
  )
  const chronological = (a: QuartzPluginData, b: QuartzPluginData) =>
    recordTime(b) - recordTime(a) || String(a.slug).localeCompare(String(b.slug))

  const outgoing = pages
    .filter((page) => fileData.links?.includes(simplifySlug(page.slug!)))
    .sort(chronological)
    .slice(0, 3)
  const outgoingSlugs = new Set(outgoing.map((page) => page.slug))
  const incoming = pages
    .filter((page) => !outgoingSlugs.has(page.slug) && page.links?.includes(simplifySlug(slug)))
    .sort(chronological)
    .slice(0, 3)

  // Shared broad tags are only a fallback for diary pages, not an assertion
  // that two pages discuss the same event or cite each other.
  const tags = fileData.frontmatter?.tags ?? []
  const contextTime = recordTime(fileData)
  const otherDiaries =
    slug.startsWith("diary/") && outgoing.length + incoming.length < 3 && tags.length
      ? pages
          .filter(
            (page) =>
              page.slug!.startsWith("diary/") &&
              !outgoingSlugs.has(page.slug) &&
              !incoming.some((item) => item.slug === page.slug) &&
              page.frontmatter?.tags?.some((tag) => tags.includes(tag)),
          )
          .sort((a, b) => {
            const aOverlap = a.frontmatter!.tags!.filter((tag) => tags.includes(tag)).length
            const bOverlap = b.frontmatter!.tags!.filter((tag) => tags.includes(tag)).length
            return (
              bOverlap - aOverlap ||
              (contextTime
                ? Math.abs(recordTime(a) - contextTime) - Math.abs(recordTime(b) - contextTime)
                : 0) ||
              chronological(a, b)
            )
          })
          .slice(0, 3 - outgoing.length - incoming.length)
      : []

  if (!outgoing.length && !incoming.length && !otherDiaries.length) return null

  const renderGroup = (label: string, entries: QuartzPluginData[]) =>
    entries.length > 0 && (
      <div class="related-reading-group">
        <h4>{label}</h4>
        <ul>
          {entries.map((page) => (
            <li>
              <a class="internal" href={resolveRelative(slug, page.slug!)}>
                {page.frontmatter!.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )

  return (
    <section class="related-reading" aria-label="关联阅读">
      <h3>关联阅读</h3>
      {renderGroup("本页链接", outgoing)}
      {renderGroup("引用本页", incoming)}
      {renderGroup("同标签的前后日记", otherDiaries)}
    </section>
  )
}

RelatedReading.css = `
.related-reading { margin: 0 0 1.25rem; }
.related-reading h3 { font-size: 1rem; margin: 0 0 .65rem; }
.related-reading h4 { color: var(--gray); font-size: .82rem; font-weight: 600; margin: .65rem 0 .25rem; }
.related-reading ul { list-style: none; margin: 0; padding: 0; }
.related-reading li { margin: .24rem 0; line-height: 1.45; font-size: .9rem; }
.related-reading a { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; overflow-wrap: anywhere; }
.graph-mode-toolbar { position: fixed; z-index: 1; top: 3vh; left: 50%; transform: translateX(-50%); display: flex; gap: .4rem; align-items: center; padding: .45rem .55rem; background: var(--light); border: 1px solid var(--lightgray); border-radius: .6rem; box-shadow: 0 2px 12px rgba(0,0,0,.1); white-space: nowrap; }
.graph-mode-toolbar span { color: var(--gray); font-size: .83rem; margin-right: .2rem; }
.graph-mode-toolbar button { border: 1px solid var(--lightgray); border-radius: .4rem; padding: .28rem .55rem; background: var(--light); color: var(--dark); font-size: .83rem; cursor: pointer; }
.graph-mode-toolbar button[aria-pressed="true"] { background: var(--secondary); border-color: var(--secondary); color: var(--light); }
.graph-mode-toolbar a { color: var(--secondary); font-size: .83rem; margin-left: .25rem; }
.graph-atlas-entry { float: right; color: var(--secondary); font-size: .78rem; font-weight: 500; }
.graph-hover-title { position: absolute; z-index: 10; top: 0; left: 0; box-sizing: border-box; width: max-content; max-width: min(22rem, calc(100% - 1rem)); padding: .45rem .65rem; border: 1px solid var(--lightgray); border-radius: .4rem; background: var(--light); color: var(--dark); box-shadow: 0 2px 10px #0003; font-size: .88rem; line-height: 1.45; overflow-wrap: anywhere; pointer-events: none; }
.graph-hover-title[hidden] { display: none; }
.graph-container, .global-graph-container { position: relative; }
@media (max-width: 600px) { .graph-mode-toolbar { top: 2vh; flex-wrap: wrap; justify-content: center; width: min(94vw, 26rem); white-space: normal; } .graph-mode-toolbar span { display: none; } }
`

RelatedReading.afterDOMLoaded = `
function setupGraphModes() {
  document.querySelectorAll('.global-graph-outer').forEach((outer) => {
    if (outer.querySelector('.graph-mode-toolbar')) return;
    const graph = outer.querySelector('.global-graph-container');
    if (!graph) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'graph-mode-toolbar';
    toolbar.innerHTML = '<span>图谱范围</span><button type="button" data-mode="near" aria-pressed="true">本页关联</button><button type="button" data-mode="all" aria-pressed="false">全站概览</button><button type="button" data-labels="all" aria-pressed="false">显示全部标题</button>';
    const atlasUrl = (document.body.dataset.basepath || '') + '/lab/graph-blocks?from=' + encodeURIComponent(document.body.dataset.slug || '');
    const atlasLink = document.createElement('a');
    atlasLink.href = atlasUrl;
    atlasLink.textContent = '从本页拼积木图 →';
    toolbar.appendChild(atlasLink);
    const heading = outer.closest('.graph')?.querySelector(':scope > h3');
    if (heading && !heading.querySelector('.graph-atlas-entry')) {
      const entry = atlasLink.cloneNode(true);
      entry.className = 'graph-atlas-entry';
      entry.textContent = '拼成积木图 ↗';
      heading.appendChild(entry);
    }
    toolbar.addEventListener('click', (event) => {
      // The graph closes on outside clicks; keep clicks on the controls inside.
      event.stopPropagation();
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.labels === 'all') {
        const showing = button.getAttribute('aria-pressed') !== 'true';
        const settings = JSON.parse(graph.dataset.cfg || '{}');
        // Quartz 0.1.0 computes alpha as (zoom * opacityScale - 1) / 3.75.
        // At the initial zoom, 1 is fully transparent; 5 makes it visible.
        settings.opacityScale = showing ? 5 : 0.25;
        graph.dataset.cfg = JSON.stringify(settings);
        button.setAttribute('aria-pressed', String(showing));
        button.textContent = showing ? '仅悬停显示标题' : '显示全部标题';
        document.dispatchEvent(new Event('themechange'));
        return;
      }
      if (!button.dataset.mode || button.getAttribute('aria-pressed') === 'true') return;
      const all = button.dataset.mode === 'all';
      const settings = JSON.parse(graph.dataset.cfg || '{}');
      settings.depth = all ? -1 : 1;
      settings.showTags = true;
      settings.enableRadial = false;
      graph.dataset.cfg = JSON.stringify(settings);
      toolbar.querySelectorAll('button[data-mode]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      document.dispatchEvent(new Event('themechange'));
    });
    outer.appendChild(toolbar);
  });
}
document.addEventListener('nav', setupGraphModes);
document.addEventListener('xiaoshigraphhover', (event) => {
  const outer = document.querySelector('.global-graph-outer.active');
  const link = outer?.querySelector('.graph-mode-toolbar a');
  const slug = event.detail?.slug;
  if (!link || !slug) return;
  link.href = (document.body.dataset.basepath || '') + '/lab/graph-blocks?from=' + encodeURIComponent(slug);
  link.textContent = '从这个节点拼积木图 →';
});
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupGraphModes);
} else {
  setupGraphModes();
}
`

export default RelatedReading
