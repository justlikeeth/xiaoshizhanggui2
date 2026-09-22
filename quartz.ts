import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import fs from "node:fs/promises"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { BuildCtx } from "./quartz/util/ctx"
import { FilePath, simplifySlug } from "./quartz/util/path"
import { ProcessedContent } from "./quartz/plugins/vfile"
import { QuartzEmitterPluginInstance } from "./quartz/plugins/types"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import RelatedReading from "./quartz/components/RelatedReading"
import { improveGraph } from "./quartz/components/improveGraph"
import LegoMap from "./quartz/components/LegoMap"

const ITEMS_PER_SECTION = 30
const CONTENT_SECTIONS = /^(?:diary|posts|thoughts|dict|podcasts|transcripts|wiki)\//
const EDITED_INDEXES = /^((?:wiki\/silk)|(?:dict\/(?:silk|market|concept|industry)))\/index\.md$/

function xml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const escapes: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    }
    return escapes[char]
  })
}

function contentCommitDates(): Map<string, Date> {
  const result = new Map<string, Date>()
  try {
    // A single Git walk avoids running one command per article. GitHub Pages
    // checks out the full history in .github/workflows/deploy.yml.
    const history = execFileSync(
      "git",
      ["-c", "core.quotePath=false", "log", "--name-only", "--format=@%cI", "--", "content"],
      { cwd: process.cwd(), encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
    )
    let date: Date | undefined
    for (const line of history.split(/\r?\n/)) {
      if (line.startsWith("@")) {
        date = new Date(line.slice(1))
      } else if (date && !isNaN(date.getTime()) && line.startsWith("content/")) {
        const source = line.slice("content/".length)
        if (!result.has(source)) result.set(source, date)
      }
    }
  } catch {
    // Local builds outside Git can still use Quartz's own date metadata.
  }
  return result
}

async function writeEditorialRSS(ctx: BuildCtx, content: ProcessedContent[]): Promise<FilePath[]> {
  const origin = `https://${ctx.cfg.configuration.baseUrl}`
  const feedUrl = `${origin}/index.xml`
  const seenSections = new Map<string, number>()
  const commitDates = contentCommitDates()
  const items = content
    .map(([, file]) => {
      const data = file.data
      const source = data.relativePath ?? ""
      if (
        !CONTENT_SECTIONS.test(source) ||
        (source.endsWith("/index.md") && !EDITED_INDEXES.test(source)) ||
        data.unlisted === true ||
        data.encrypted === true ||
        !data.slug ||
        !data.frontmatter?.title ||
        !data.text?.trim()
      ) {
        return null
      }

      // Publication/updates to the site come from Git; frontmatter `date`
      // remains the original diary/recording date even when backfilled later.
      const modified =
        commitDates.get(source) ??
        data.dates?.modified ??
        data.dates?.published ??
        data.dates?.created
      const date = modified instanceof Date && !isNaN(modified.getTime()) ? modified : new Date(0)
      const url = new URL(`/${encodeURI(simplifySlug(data.slug))}`, origin).href
      const excerpt = String(data.description ?? data.text)
        .trim()
        .slice(0, 300)
      const originalDate = data.frontmatter.date
      const recordedOn =
        originalDate instanceof Date
          ? originalDate.toISOString().slice(0, 10)
          : String(originalDate ?? "")
      const eventTime = recordedOn ? Date.parse(recordedOn) : NaN
      const context = recordedOn ? `原记录日期：${recordedOn}。` : ""
      return {
        title: String(data.frontmatter.title),
        url,
        excerpt: context + excerpt,
        date,
        eventTime: Number.isFinite(eventTime) ? eventTime : 0,
        source,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime() ||
        b.eventTime - a.eventTime ||
        a.source.localeCompare(b.source),
    )
    .filter((item) => {
      // A one-time archive import can give every page the same Git timestamp.
      // Preserve recent entries from each section instead of losing whole sections.
      const section = item.source.split("/")[0]
      const seen = seenSections.get(section) ?? 0
      if (seen >= ITEMS_PER_SECTION) return false
      seenSections.set(section, seen + 1)
      return true
    })

  const entries = items
    .map(
      ({ title, url, excerpt, date }) => `    <item>
      <title>${xml(title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <description>${xml(excerpt)}</description>
      <pubDate>${date.toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n")
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(ctx.cfg.configuration.pageTitle)}</title>
    <link>${xml(origin)}</link>
    <description>小施掌柜的日记、文章、词条、播客和口述转写稿更新</description>
    <language>zh-CN</language>
    <atom:link href="${xml(feedUrl)}" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>
`
  const destination = path.join(ctx.argv.output, "index.xml")
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.writeFile(destination, feed, "utf8")
  return [destination as FilePath]
}

const editorialRSS: QuartzEmitterPluginInstance = {
  name: "EditorialRSS",
  emit: (ctx, content) => writeEditorialRSS(ctx, content),
  partialEmit: (ctx, content) => writeEditorialRSS(ctx, content),
}

const config = await loadQuartzConfig()
config.plugins.emitters.push(editorialRSS)
const layout = await loadQuartzLayout()
layout.defaults.right = [RelatedReading, ...(layout.defaults.right ?? [])]
layout.defaults.afterBody = [LegoMap, ...(layout.defaults.afterBody ?? [])]
for (const pageLayout of Object.values(layout.byPageType)) {
  pageLayout.right = [RelatedReading, ...(pageLayout.right ?? layout.defaults.right.slice(1))]
  pageLayout.afterBody = [LegoMap, ...(pageLayout.afterBody ?? layout.defaults.afterBody.slice(1))]
}
improveGraph(layout)
config.plugins.emitters = config.plugins.emitters.map((emitter) =>
  emitter.name === "PageTypeDispatcher"
    ? PageTypeDispatcher({ defaults: layout.defaults, byPageType: layout.byPageType })
    : emitter,
)

export default config
export { layout }
