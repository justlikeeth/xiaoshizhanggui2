/* 小施掌柜自动统计 v1.5.0 — Cloudflare module Worker, no build dependencies.
 * Setup: STATS_KV binding; CF_API_TOKEN secret; CF_ZONE_ID variable.
 * Optional full bot directory: CF_RADAR_TOKEN with User Details Read.
 * Optional browser analytics: CF_ACCOUNT_ID; site_tag is discovered automatically.
 * Automatic discovery needs Account Settings Read; manual CF_RUM_SITE_TAG still works.
 * Deploy only after configuring your own account and validating live queries.
 */
const DAY = 86400000
const OFFSET = 8 * 3600000
const PREFIX = "/_stats/"
const API = "https://api.cloudflare.com/client/v4/graphql"
const RADAR_BOTS_API = "https://api.cloudflare.com/client/v4/radar/bots"
const SCAN_LIMIT = 5000
const RESPONSE_DETAIL_VERSION = 2
const CRAWLER_CLASSIFICATION_VERSION = 3
// Major AI, search and mixed-purpose crawlers. The array order is the matching
// priority: every request is assigned to the first matching crawler only.
// Shape: [user-agent token, operator, detection IDs, exclusive category].
export const BOTS = [
  ["GPTBot", "OpenAI", [123815556, 33563875], "ai-crawler"],
  ["ChatGPT-User", "OpenAI", [132995013, 33563857], "ai-assistant"],
  ["OAI-SearchBot", "OpenAI", [126255384, 33563986], "ai-search"],
  ["ClaudeBot", "Anthropic", [33563859], "ai-crawler"],
  ["Claude-SearchBot", "Anthropic", [33564301], "ai-search"],
  ["Claude-User", "Anthropic", [33564303], "ai-assistant"],
  ["PerplexityBot", "Perplexity", [33563889], "ai-search"],
  ["Perplexity-User", "Perplexity", [33564371], "ai-assistant"],
  ["Google-CloudVertexBot", "Google", [133730073, 33564321], "ai-crawler"],
  ["GoogleOther", "Google", [], "ai-crawler"],
  ["Bytespider", "ByteDance", [33563853], "ai-crawler"],
  ["CCBot", "Common Crawl", [133621792, 33563855], "ai-crawler"],
  ["meta-externalagent", "Meta", [124581738, 33563982], "ai-crawler"],
  ["meta-externalfetcher", "Meta", [132272919, 33563980], "ai-assistant"],
  ["FacebookBot", "Meta", [33563972], "ai-crawler"],
  ["Applebot", "Apple", [120424214, 33563845], "ai-search"],
  ["Amazonbot", "Amazon", [118601807, 33563839], "ai-crawler"],
  ["DuckAssistBot", "DuckDuckGo", [126666910, 33564037], "ai-assistant"],
  ["MistralAI-User", "Mistral", [128950951, 33564323], "ai-assistant"],
  ["PetalBot", "Huawei", [], "hybrid"],
  ["Googlebot", "Google", [120623194, 33554459], "search"],
  ["bingbot", "Microsoft", [117479730, 33554461], "search"],
  ["Baiduspider", "Baidu", [], "search"],
  ["DuckDuckBot", "DuckDuckGo", [], "search"],
  ["YandexBot", "Yandex", [], "search"],
  ["Slurp", "Yahoo", [], "search"],
  ["Exabot", "Exalead", [], "search"],
  ["360Spider", "360 Search", [], "search"],
  ["HaosouSpider", "360 Search", [], "search"],
  ["YisouSpider", "Shenma", [], "search"],
]
const CATEGORY_META = {
  "ai-crawler": ["AI 抓取与训练", "AI"],
  "ai-search": ["AI 搜索", "AI"],
  "ai-assistant": ["AI 助手与按需读取", "AI"],
  search: ["传统搜索引擎", "搜索"],
  hybrid: ["搜索与 AI 混合", "混合"],
  seo: ["SEO 与站点审计", "SEO"],
  social: ["社交与链接预览", "社交预览"],
  feed: ["RSS、播客与聚合器", "订阅聚合"],
  monitoring: ["监控、分析与 Webhook", "监控"],
  archive: ["网页存档", "存档"],
  research: ["学术研究", "研究"],
  security: ["安全扫描", "安全"],
  accessibility: ["无障碍检查", "无障碍"],
  marketing: ["广告与营销", "营销"],
  data: ["数据采集", "数据采集"],
  automation: ["其他自动服务", "自动服务"],
  unknown: ["其他可识别程序", "其他"],
}

const RADAR_CATEGORY_MAP = {
  AI_CRAWLER: "ai-crawler",
  TRAINING: "ai-crawler",
  AI_SEARCH: "ai-search",
  AI_ASSISTANT: "ai-assistant",
  AGENT: "ai-assistant",
  SEARCH: "search",
  SEARCH_ENGINE_CRAWLER: "search",
  SEARCH_ENGINE_OPTIMIZATION: "seo",
  SEO: "seo",
  PAGE_PREVIEW: "social",
  SOCIAL_LINK_PREVIEW: "social",
  SOCIAL_MEDIA_MARKETING: "social",
  FEED_FETCHER: "feed",
  FEED_FETCHING: "feed",
  AGGREGATOR: "feed",
  MONITORING_AND_ANALYTICS: "monitoring",
  MONITORING_ANALYTICS: "monitoring",
  MONITORING_OPERATIONS: "monitoring",
  WEBHOOKS: "monitoring",
  ARCHIVER: "archive",
  ACADEMIC_RESEARCH: "research",
  SECURITY: "security",
  SECURITY_TESTING: "security",
  ACCESSIBILITY: "accessibility",
  ADVERTISING_AND_MARKETING: "marketing",
  ADVERTISING_MARKETING: "marketing",
  ADS_VERIFICATION: "marketing",
  DATA_COLLECTION: "data",
  TRANSACT: "automation",
  OTHER: "automation",
}

const GENERIC_BOT_MARKERS = [
  "bot",
  "spider",
  "crawler",
  "scraper",
  "fetcher",
  "preview",
  "monitor",
  "checker",
  "scanner",
  "feed",
  "rss",
  "lighthouse",
  "headless",
  "python-requests",
  "go-http-client",
  "apache-httpclient",
  "wget",
  "curl/",
]

class StatsError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}
export function localDate(ms) {
  return new Date(ms + OFFSET).toISOString().slice(0, 10)
}
export function dayBounds(date) {
  const start = Date.parse(date + "T00:00:00+08:00")
  if (!Number.isFinite(start) || localDate(start) !== date) throw new StatsError("DATE")
  return { start: new Date(start).toISOString(), end: new Date(start + DAY).toISOString() }
}
function queryBounds(date, throughMs = null) {
  const bounds = dayBounds(date)
  if (throughMs == null) return bounds
  const startMs = Date.parse(bounds.start)
  const endMs = Math.min(Date.parse(bounds.end), throughMs)
  if (!Number.isFinite(endMs) || endMs <= startMs) throw new StatsError("DATE_RANGE")
  return { start: bounds.start, end: new Date(endMs).toISOString() }
}
function config(env) {
  const hostname = env.SITE_HOST || "xiaoshizhanggui.com"
  if (!/^[a-z0-9.-]+$/i.test(hostname)) throw new StatsError("HOST")
  if (!env.STATS_KV) throw new StatsError("KV_BINDING")
  if (!/^[a-f0-9]{32}$/i.test(env.CF_ZONE_ID || "")) throw new StatsError("ZONE_ID")
  if (!env.CF_API_TOKEN) throw new StatsError("TOKEN_MISSING")
  const rum = !!env.CF_ACCOUNT_ID
  if (env.CF_RUM_SITE_TAG && !rum) throw new StatsError("RUM_CONFIG")
  if (
    rum &&
    ![env.CF_ACCOUNT_ID, ...(env.CF_RUM_SITE_TAG ? [env.CF_RUM_SITE_TAG] : [])].every((x) =>
      /^[a-f0-9]{32}$/i.test(x),
    )
  ) {
    throw new StatsError("RUM_CONFIG")
  }
  const mode = env.BOT_MATCH_MODE || "user-agent"
  if (!["user-agent", "verified"].includes(mode)) throw new StatsError("BOT_MODE")
  return { hostname, rum, mode }
}
function errorCode(e) {
  return e instanceof StatsError ? e.code : "NETWORK_OR_STORAGE"
}
function number(x) {
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0) throw new StatsError("INVALID_DATA")
  return x
}
export function contentPath(path) {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(path)
  )
    return null
  const clean = path.split("?")[0].split("#")[0]
  if (/^\/(?:_stats|cdn-cgi|api|static|assets)(?:\/|$)/i.test(clean)) return null
  if (clean.split("/").some((p) => p.startsWith("."))) return null
  if (/\.[^/]+$/.test(clean) && !/\.html?$/i.test(clean)) return null
  return clean
}
async function graphql(env, query, variables, fetcher) {
  let response
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetcher(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + env.CF_API_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(12000),
      })
    } catch {
      if (attempt === 0) continue
      throw new StatsError("NETWORK")
    }
    if (response.status >= 500 && attempt === 0) {
      await response.arrayBuffer()
      continue
    }
    break
  }
  if ([401, 403].includes(response.status)) throw new StatsError("AUTH")
  if (response.status === 429) throw new StatsError("RATE_LIMIT")
  if (!response.ok) throw new StatsError("HTTP_" + response.status)
  let body
  try {
    body = await response.json()
  } catch {
    throw new StatsError("INVALID_JSON")
  }
  if (body.errors?.length) {
    const msg = body.errors
      .map((x) => x.message || "")
      .join(" ")
      .toLowerCase()
    // Never put raw upstream messages, account IDs, or credentials into public output/logs.
    if (/permission|not authorized|unauthorized|access denied|not entitled/.test(msg))
      throw new StatsError("AUTH_OR_PLAN")
    if (/cannot query|unknown|not defined|field.*not found/.test(msg))
      throw new StatsError("SCHEMA")
    if (/limit|range|older|retention/.test(msg)) throw new StatsError("QUERY_LIMIT")
    throw new StatsError("GRAPHQL")
  }
  if (!body.data?.viewer) throw new StatsError("INVALID_DATA")
  return body.data.viewer
}
function hostName(value) {
  return typeof value === "string" ? value.toLowerCase().replace(/\.$/, "") : ""
}
export function selectRUMSite(sites, cfg, env) {
  const host = hostName(cfg.hostname)
  const matches = []
  for (const site of sites) {
    if (!site || site.ruleset?.enabled === false) continue
    const rules = Array.isArray(site.rules) ? site.rules : []
    const inclusions = rules.filter((r) => !r.is_paused && r.inclusive !== false && r.host)
    const exact = hostName(site.host) === host || inclusions.some((r) => hostName(r.host) === host)
    // Zone fallback only when there are no explicit inclusion hosts, avoiding another subdomain's site.
    const zone =
      !inclusions.length &&
      !site.host &&
      site.ruleset?.zone_tag === env.CF_ZONE_ID &&
      hostName(site.ruleset?.zone_name) === host
    if (!exact && !zone) continue
    if (!/^[a-f0-9]{32}$/i.test(site.site_tag || "")) throw new StatsError("RUM_SITE_INVALID")
    matches.push({ tag: site.site_tag, score: exact ? 2 : 1 })
  }
  if (!matches.length) throw new StatsError("RUM_SITE_NOT_FOUND")
  const best = Math.max(...matches.map((x) => x.score))
  const tags = [...new Set(matches.filter((x) => x.score === best).map((x) => x.tag))]
  if (tags.length !== 1) throw new StatsError("RUM_SITE_AMBIGUOUS")
  return tags[0]
}
export async function resolveRUMSite(env, cfg, fetcher = fetch, now = Date.now()) {
  if (env.CF_RUM_SITE_TAG) return env.CF_RUM_SITE_TAG
  const cacheKey = "private:rum-site:v1"
  const scope = [env.CF_ACCOUNT_ID, env.CF_ZONE_ID, cfg.hostname].join(":")
  const cached = await env.STATS_KV.get(cacheKey, "json")
  if (
    cached?.scope === scope &&
    now >= cached.checkedAt &&
    now - cached.checkedAt < DAY &&
    /^[a-f0-9]{32}$/i.test(cached.siteTag || "")
  )
    return cached.siteTag
  const sites = []
  const perPage = 50
  for (let page = 1; page <= 20; page++) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/rum/site_info/list?page=${page}&per_page=${perPage}`
    let response
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetcher(url, {
          headers: { Authorization: "Bearer " + env.CF_API_TOKEN },
          signal: AbortSignal.timeout(12000),
        })
      } catch {
        if (!attempt) continue
        throw new StatsError("RUM_LOOKUP_NETWORK")
      }
      if (response.status >= 500 && !attempt) {
        await response.arrayBuffer()
        continue
      }
      break
    }
    if ([401, 403].includes(response.status)) throw new StatsError("RUM_LOOKUP_AUTH")
    if (response.status === 429) throw new StatsError("RATE_LIMIT")
    if (!response.ok) throw new StatsError("RUM_LOOKUP_HTTP_" + response.status)
    let body
    try {
      body = await response.json()
    } catch {
      throw new StatsError("INVALID_JSON")
    }
    if (body.success !== true || !Array.isArray(body.result)) throw new StatsError("RUM_LOOKUP_API")
    sites.push(...body.result)
    const pages = body.result_info?.total_pages
    if (pages != null && (!Number.isInteger(pages) || pages < 0))
      throw new StatsError("RUM_LOOKUP_API")
    const finished = pages != null ? page >= pages : body.result.length < perPage
    if (finished) {
      const siteTag = selectRUMSite(sites, cfg, env)
      // Private lookup cache is separate from the public statistics JSON.
      await env.STATS_KV.put(cacheKey, JSON.stringify({ scope, siteTag, checkedAt: now }))
      return siteTag
    }
  }
  throw new StatsError("RUM_LOOKUP_TOO_MANY_SITES")
}

function radarCategory(value) {
  const key = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
  return RADAR_CATEGORY_MAP[key] || "automation"
}

function coreCatalog() {
  return BOTS.map((bot) => ({
    name: bot[0],
    operator: bot[1],
    detectionIds: bot[2],
    category: bot[3],
    patterns: [bot[0]],
  }))
}

function normalizeRadarBots(value) {
  if (!Array.isArray(value)) return []
  const normalized = []
  for (const bot of value) {
    const name = typeof bot?.name === "string" ? bot.name.trim().slice(0, 100) : ""
    const operator = typeof bot?.operator === "string" ? bot.operator.trim().slice(0, 100) : ""
    const rawPatterns = bot?.userAgentPatterns || bot?.patterns
    const patterns = Array.isArray(rawPatterns)
      ? [...new Set(rawPatterns.map((x) => String(x).trim()).filter((x) => x.length >= 3))]
      : []
    if (!name || !patterns.length) continue
    normalized.push({
      name,
      operator: operator || "未标明",
      detectionIds: [],
      category: CATEGORY_META[bot.category] ? bot.category : radarCategory(bot.category),
      patterns,
    })
  }
  return normalized
}

function mergeCatalog(remote) {
  const result = coreCatalog()
  const positions = new Map(result.map((bot, index) => [bot.name.toLowerCase(), index]))
  for (const bot of remote || []) {
    const key = bot.name.toLowerCase()
    const index = positions.get(key)
    if (index == null) {
      positions.set(key, result.length)
      result.push(bot)
    } else {
      result[index].patterns = [...new Set([...result[index].patterns, ...bot.patterns])]
    }
  }
  return result
}

export async function resolveBotCatalog(env, fetcher = fetch, now = Date.now()) {
  const cacheKey = "private:bot-catalog:v1"
  let cached
  try {
    cached = await env.STATS_KV.get(cacheKey, "json")
  } catch {
    cached = null
  }
  const cachedBots = normalizeRadarBots(cached?.bots)
  if (
    cachedBots.length &&
    Number.isFinite(cached?.checkedAt) &&
    now >= cached.checkedAt &&
    now - cached.checkedAt < DAY
  ) {
    return {
      bots: mergeCatalog(cachedBots),
      source: "radar",
      directoryCount: cachedBots.length,
      checkedAt: cached.checkedAt,
      error: null,
    }
  }

  const token = env.CF_RADAR_TOKEN || env.CF_API_TOKEN
  try {
    const bots = []
    const pageSize = 1000
    for (let offset = 0; offset < 10000; offset += pageSize) {
      const url =
        RADAR_BOTS_API +
        `?botVerificationStatus=VERIFIED&format=JSON&limit=${pageSize}&offset=${offset}`
      const response = await fetcher(url, {
        headers: { Authorization: "Bearer " + token },
        signal: AbortSignal.timeout(12000),
      })
      if ([401, 403].includes(response.status)) throw new StatsError("RADAR_AUTH")
      if (response.status === 429) throw new StatsError("RATE_LIMIT")
      if (!response.ok) throw new StatsError("RADAR_HTTP_" + response.status)
      const body = await response.json()
      const rawBots = body?.result?.bots
      if (body?.success !== true || !Array.isArray(rawBots)) throw new StatsError("RADAR_DATA")
      bots.push(...normalizeRadarBots(rawBots))
      if (rawBots.length < pageSize) break
    }
    if (bots.length < BOTS.length) throw new StatsError("RADAR_DATA")
    await env.STATS_KV.put(cacheKey, JSON.stringify({ checkedAt: now, bots }))
    return {
      bots: mergeCatalog(bots),
      source: "radar",
      directoryCount: bots.length,
      checkedAt: now,
      error: null,
    }
  } catch (error) {
    if (cachedBots.length) {
      return {
        bots: mergeCatalog(cachedBots),
        source: "radar-cache",
        directoryCount: cachedBots.length,
        checkedAt: cached.checkedAt || null,
        error: errorCode(error),
      }
    }
    return {
      bots: coreCatalog(),
      source: "core-fallback",
      directoryCount: BOTS.length,
      checkedAt: null,
      error: errorCode(error),
    }
  }
}

function patternMatches(userAgent, pattern) {
  const candidate = String(pattern || "")
    .trim()
    .toLowerCase()
  if (candidate.length < 3) return false
  if (!candidate.includes("*")) return userAgent.includes(candidate)
  const parts = candidate.split("*").filter(Boolean)
  if (!parts.length) return false
  let offset = 0
  for (const part of parts) {
    const found = userAgent.indexOf(part, offset)
    if (found < 0) return false
    offset = found + part.length
  }
  return true
}

function genericCrawler(userAgent) {
  const lower = userAgent.toLowerCase()
  if (!GENERIC_BOT_MARKERS.some((marker) => lower.includes(marker))) return null
  const tokens = userAgent
    .replace(/[()]/g, " ")
    .split(/[\s;]+/)
    .map((token) => token.trim())
    .filter(Boolean)
  const product =
    tokens.find((token) =>
      GENERIC_BOT_MARKERS.some((marker) => token.toLowerCase().includes(marker.replace("/", ""))),
    ) || "自动程序"
  const label = product
    .replace(/^https?:\/\//i, "")
    .replace(/\/\d[\w.+-]*$/, "")
    .replace(/[^\p{L}\p{N}_.+-]/gu, "")
    .slice(0, 60)
  return {
    name: "未收录 · " + (label || "自动程序"),
    operator: "未验证",
    detectionIds: [],
    category: "unknown",
    patterns: [],
  }
}

function crawlerFor(dimensions, mode, catalog) {
  if (mode === "verified") {
    const verified = catalog.find((bot) =>
      bot.detectionIds.some((id) => dimensions.botDetectionIds?.includes(id)),
    )
    if (verified) return verified
  }
  const ua = String(dimensions.userAgent || "").toLowerCase()
  if (!ua) return null
  return (
    catalog.find((bot) => bot.patterns.some((pattern) => patternMatches(ua, pattern))) ||
    genericCrawler(String(dimensions.userAgent))
  )
}
export async function collectAI(
  env,
  cfg,
  date,
  fetcher = fetch,
  throughMs = null,
  catalogInfo = { bots: coreCatalog(), source: "core-fallback", directoryCount: BOTS.length },
) {
  const catalog = Array.isArray(catalogInfo) ? catalogInfo : catalogInfo.bots
  const { start, end } = queryBounds(date, throughMs)
  const filter = {
    datetime_geq: start,
    datetime_lt: end,
    requestSource: "eyeball",
    clientRequestHTTPHost: cfg.hostname,
    clientRequestPath_notlike: PREFIX + "%",
  }
  const matchDimensions = cfg.mode === "verified" ? "botDetectionIds userAgent" : "userAgent"
  const query = `query StatsCrawlers($zone: String!, $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!) {
    viewer { zones(filter: {zoneTag: $zone}) {
      rows: httpRequestsAdaptiveGroups(limit: ${SCAN_LIMIT}, filter: $filter, orderBy: [count_DESC]) {
        count dimensions { ${matchDimensions} clientRequestPath edgeResponseStatus }
      }
    } }
  }`
  const viewer = await graphql(env, query, { zone: env.CF_ZONE_ID, filter }, fetcher)
  const rows = viewer.zones?.[0]?.rows
  if (!Array.isArray(rows)) throw new StatsError("NO_ZONE_DATA")
  if (rows.length >= SCAN_LIMIT) throw new StatsError("TRUNCATED_TOTALS")
  const result = {
    requests: 0,
    successful: 0,
    blocked: 0,
    notFound: 0,
    serverError: 0,
    notModified: 0,
    redirects: 0,
    other: 0,
    responseDetailVersion: RESPONSE_DETAIL_VERSION,
    classificationVersion:
      !Array.isArray(catalogInfo) && catalogInfo.source === "core-fallback"
        ? CRAWLER_CLASSIFICATION_VERSION - 1
        : CRAWLER_CLASSIFICATION_VERSION,
    directorySource: Array.isArray(catalogInfo) ? "custom" : catalogInfo.source,
    directoryCount: Array.isArray(catalogInfo) ? catalogInfo.length : catalogInfo.directoryCount,
    mode: cfg.mode,
    crawlers: {},
    crawlerDetails: {},
    topPages: [],
    failedPages: [],
    pagesTruncated: false,
    failedPagesTruncated: false,
  }
  const topPages = new Map()
  const failedPages = new Map()
  for (const row of rows) {
    const count = number(row.count)
    if (!row.dimensions || typeof row.dimensions.edgeResponseStatus !== "number")
      throw new StatsError("INVALID_DATA")
    const bot = crawlerFor(row.dimensions, cfg.mode, catalog)
    if (!bot) continue
    const status = row.dimensions.edgeResponseStatus
    result.requests += count
    result.crawlers[bot.name] = (result.crawlers[bot.name] || 0) + count
    result.crawlerDetails[bot.name] = {
      operator: bot.operator,
      category: bot.category,
    }
    if (status >= 200 && status < 300) result.successful += count
    else if ([403, 429].includes(status)) result.blocked += count
    else if (status === 404) result.notFound += count
    else if (status >= 500 && status < 600) result.serverError += count
    else if (status === 304) result.notModified += count
    else if (status >= 300 && status < 400) result.redirects += count
    else result.other += count

    const path = contentPath(row.dimensions.clientRequestPath)
    if (!path) continue
    if (status >= 200 && status < 300) topPages.set(path, (topPages.get(path) || 0) + count)
    else if (status >= 400) {
      const key = status + "\n" + path
      failedPages.set(key, (failedPages.get(key) || 0) + count)
    }
  }
  result.topPages = [...topPages]
    .map(([path, requests]) => ({ path, requests }))
    .sort((a, b) => b.requests - a.requests)
  result.failedPages = [...failedPages]
    .map(([key, requests]) => {
      const split = key.indexOf("\n")
      return { status: Number(key.slice(0, split)), path: key.slice(split + 1), requests }
    })
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 50)
  return result
}
export async function collectReaders(env, cfg, date, fetcher = fetch, throughMs = null) {
  const { start, end } = queryBounds(date, throughMs)
  const siteTag = cfg.siteTag || (await resolveRUMSite(env, cfg, fetcher))
  const query = `query StatsReaders($account: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
    viewer { accounts(filter: {accountTag: $account}) {
      rows: rumPageloadEventsAdaptiveGroups(limit: 1, filter: $filter) { count sum { visits } }
    } }
  }`
  const viewer = await graphql(
    env,
    query,
    {
      account: env.CF_ACCOUNT_ID,
      filter: { datetime_geq: start, datetime_lt: end, siteTag },
    },
    fetcher,
  )
  const rows = viewer.accounts?.[0]?.rows
  if (!Array.isArray(rows) || rows.length > 1) throw new StatsError("NO_RUM_DATA")
  return rows.length
    ? { views: number(rows[0].count), visits: number(rows[0].sum?.visits) }
    : { views: 0, visits: 0 }
}
function emptyState(now, cfg) {
  return {
    version: 1,
    hostname: cfg.hostname,
    installedAt: new Date(now).toISOString(),
    browserEnabled: cfg.rum,
    days: {},
    sourceStatus: { ai: {}, readers: {} },
  }
}
const AI_TOTAL_KEYS = [
  "requests",
  "successful",
  "blocked",
  "notFound",
  "serverError",
  "notModified",
  "redirects",
  "other",
]
function emptyCategories() {
  return {
    aiCrawler: 0,
    aiSearch: 0,
    aiAssistant: 0,
    search: 0,
    hybrid: 0,
    seo: 0,
    social: 0,
    feed: 0,
    monitoring: 0,
    archive: 0,
    research: 0,
    security: 0,
    accessibility: 0,
    marketing: 0,
    data: 0,
    automation: 0,
    unknown: 0,
  }
}
function categoryKey(value) {
  return {
    "ai-crawler": "aiCrawler",
    "ai-search": "aiSearch",
    "ai-assistant": "aiAssistant",
    search: "search",
    hybrid: "hybrid",
    seo: "seo",
    social: "social",
    feed: "feed",
    monitoring: "monitoring",
    archive: "archive",
    research: "research",
    security: "security",
    accessibility: "accessibility",
    marketing: "marketing",
    data: "data",
    automation: "automation",
    unknown: "unknown",
  }[value]
}
function crawlerMeta(name, details = {}) {
  const detail = details?.[name]
  if (detail && CATEGORY_META[detail.category])
    return { name, operator: detail.operator || "未标明", category: detail.category }
  const bot = BOTS.find((b) => b[0] === name)
  return bot
    ? { name: bot[0], operator: bot[1], category: bot[3] }
    : { name, operator: "其他", category: "unknown" }
}
function categorize(crawlers, details = {}) {
  const result = emptyCategories()
  for (const [name, count] of Object.entries(crawlers || {})) {
    const key = categoryKey(crawlerMeta(name, details).category) || "unknown"
    result[key] += number(count)
  }
  result.ai = result.aiCrawler + result.aiSearch + result.aiAssistant
  result.total = Object.entries(result)
    .filter(([key]) => key !== "ai" && key !== "total")
    .reduce((total, [, value]) => total + value, 0)
  return result
}
function emptyAITotals() {
  return {
    from: null,
    through: null,
    requests: 0,
    successful: 0,
    blocked: 0,
    notFound: 0,
    serverError: 0,
    notModified: 0,
    redirects: 0,
    other: 0,
    crawlers: {},
    crawlerDetails: {},
  }
}
function emptyReaderTotals() {
  return { from: null, through: null, views: 0, visits: 0 }
}
function includeDate(total, date) {
  total.from = !total.from || date < total.from ? date : total.from
  total.through = !total.through || date > total.through ? date : total.through
}
function addAI(total, value, date, direction = 1) {
  if (!value) return
  includeDate(total, date)
  for (const key of AI_TOTAL_KEYS) total[key] += direction * number(value[key] || 0)
  for (const [name, count] of Object.entries(value.crawlers || {})) {
    total.crawlers[name] = (total.crawlers[name] || 0) + direction * number(count)
    if (!total.crawlers[name]) delete total.crawlers[name]
  }
  if (direction > 0)
    for (const [name, detail] of Object.entries(value.crawlerDetails || {})) {
      if (detail && CATEGORY_META[detail.category]) total.crawlerDetails[name] = detail
    }
}
function addReaders(total, value, date, direction = 1) {
  if (!value) return
  includeDate(total, date)
  total.views += direction * number(value.views || 0)
  total.visits += direction * number(value.visits || 0)
}
function ensureLifetime(state) {
  if (state.lifetime?.version === 1 || state.lifetime?.version === 2) {
    state.lifetime.version = 2
    state.lifetime.ai ||= emptyAITotals()
    state.lifetime.readers ||= emptyReaderTotals()
    for (const key of AI_TOTAL_KEYS) {
      if (!Number.isFinite(state.lifetime.ai[key])) state.lifetime.ai[key] = 0
    }
    state.lifetime.ai.crawlers ||= {}
    state.lifetime.ai.crawlerDetails ||= {}
    return state.lifetime
  }
  const lifetime = { version: 2, ai: emptyAITotals(), readers: emptyReaderTotals() }
  for (const [date, day] of Object.entries(state.days || {}).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (day?.aiInLifetime !== false) addAI(lifetime.ai, day?.ai, date)
    if (day?.readersInLifetime !== false) addReaders(lifetime.readers, day?.readers, date)
  }
  state.lifetime = lifetime
  return lifetime
}
export async function collect(env, now = Date.now(), fetcher = fetch) {
  const cfg = config(env)
  const state = (await env.STATS_KV.get("state:v1", "json")) || emptyState(now, cfg)
  if (state.hostname !== cfg.hostname || state.version !== 1)
    throw new StatsError("STORAGE_CONFIG_MISMATCH")
  state.browserEnabled = cfg.rum
  state.lastAttempt = new Date(now).toISOString()
  state.sourceStatus ||= { ai: {}, readers: {} }
  const botCatalog = await resolveBotCatalog(env, fetcher, now)
  state.botDirectory = {
    source: botCatalog.source,
    directoryCount: botCatalog.directoryCount,
    checkedAt: botCatalog.checkedAt,
    error: botCatalog.error,
  }
  const lifetime = ensureLifetime(state)
  const today = localDate(now)
  const recent = Array.from({ length: 6 }, (_, i) => localDate(now - (i + 1) * DAY))
  // Today is a partial snapshot and is overwritten every hour. The last two complete
  // China-time days are re-read, plus one missing or legacy-classification day.
  const dates = [today, ...recent.slice(0, 2)]
  const storedRecoverable = Object.keys(state.days || {})
    .filter((d) => d < today && d >= localDate(now - 35 * DAY))
    .sort()
    .find(
      (d) =>
        state.days[d]?.ai?.classificationVersion !== CRAWLER_CLASSIFICATION_VERSION ||
        state.days[d]?.ai?.responseDetailVersion !== RESPONSE_DETAIL_VERSION,
    )
  const recoverable =
    recent.slice(2).find((d) => !state.days[d]?.ai || (cfg.rum && !state.days[d]?.readers)) ||
    storedRecoverable
  if (recoverable) dates.push(recoverable)
  const failures = []
  const successes = []
  let rumSiteTask
  for (const date of dates) {
    const previous = state.days[date] || { date }
    const throughMs = date === today ? now : null
    const jobs = [collectAI(env, cfg, date, fetcher, throughMs, botCatalog)]
    if (cfg.rum) {
      rumSiteTask ||= resolveRUMSite(env, cfg, fetcher, now)
      jobs.push(
        rumSiteTask.then((siteTag) =>
          collectReaders(env, { ...cfg, siteTag }, date, fetcher, throughMs),
        ),
      )
    }
    const results = await Promise.allSettled(jobs)
    const sources = cfg.rum ? ["ai", "readers"] : ["ai"]
    let changed = false
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      const result = results[i]
      if (result.status === "fulfilled") {
        const lifetimeFlag = source + "InLifetime"
        const complete = date < today
        // Existing v1 records predate this flag and were already counted in lifetime.
        const wasInLifetime =
          previous[lifetimeFlag] === true ||
          (previous[lifetimeFlag] == null && complete && !!previous[source])
        if (source === "ai") {
          if (wasInLifetime) addAI(lifetime.ai, previous.ai, date, -1)
          if (complete) addAI(lifetime.ai, result.value, date, 1)
        } else {
          if (wasInLifetime) addReaders(lifetime.readers, previous.readers, date, -1)
          if (complete) addReaders(lifetime.readers, result.value, date, 1)
        }
        previous[source] = result.value
        previous[lifetimeFlag] = complete
        previous[source + "FetchedAt"] = state.lastAttempt
        successes.push({ source, date })
        changed = true
      } else failures.push({ source, date, code: errorCode(result.reason) })
    }
    if (changed) {
      state.days[date] = previous
      // Long-term daily aggregate archive. No visitor IPs, raw UAs or query strings.
      await env.STATS_KV.put("archive:" + date, JSON.stringify(previous))
    }
  }
  for (const source of cfg.rum ? ["ai", "readers"] : ["ai"]) {
    const status = state.sourceStatus[source] || {}
    status.lastAttempt = state.lastAttempt
    const ok = successes.filter((x) => x.source === source)
    if (ok.length) {
      status.lastSuccess = state.lastAttempt
      status.latestDate = [status.latestDate || "", ...ok.map((x) => x.date)].sort().at(-1)
      const completeDates = ok.map((x) => x.date).filter((date) => date < today)
      if (completeDates.length)
        status.latestCompleteDate = [status.latestCompleteDate || "", ...completeDates]
          .sort()
          .at(-1)
    }
    status.errors = failures.filter((x) => x.source === source)
    state.sourceStatus[source] = status
  }
  for (const date of Object.keys(state.days)) {
    if (date < localDate(now - 35 * DAY)) delete state.days[date]
  }
  await env.STATS_KV.put("state:v1", JSON.stringify(state))
  if (failures.length) console.error(JSON.stringify({ event: "stats_fetch_failed", failures }))
  return state
}

function normalizeRange(range) {
  const value = String(range ?? "30")
  return ["today", "1", "7", "30"].includes(value) ? value : "30"
}
function rangeLabel(range) {
  return { today: "今日", 1: "昨日", 7: "近 7 天", 30: "近 30 天" }[range]
}
export function summary(state, range = 30, now = Date.now()) {
  const selected = normalizeRange(range)
  const days = selected === "today" ? 1 : Number(selected)
  const dates =
    selected === "today"
      ? [localDate(now)]
      : Array.from({ length: days }, (_, i) => localDate(now - (i + 1) * DAY))
  const sum = {
    range: selected,
    label: rangeLabel(selected),
    days,
    dates,
    from: dates.at(-1),
    through: dates[0],
    recordedDates: [],
    aiDays: 0,
    readerDays: 0,
    detailedDays: 0,
    classifiedDays: 0,
    requests: 0,
    successful: 0,
    blocked: 0,
    notFound: 0,
    serverError: 0,
    notModified: 0,
    redirects: 0,
    other: 0,
    views: 0,
    visits: 0,
    crawlers: {},
    crawlerDetails: {},
    topPages: [],
    failedPages: [],
    pathsTruncated: false,
    failedPathsTruncated: false,
  }
  const recorded = new Set()
  const topPages = new Map()
  const failedPages = new Map()
  for (const date of dates) {
    const day = state?.days?.[date]
    if (day?.ai) {
      recorded.add(date)
      sum.aiDays++
      if (day.ai.responseDetailVersion === RESPONSE_DETAIL_VERSION) sum.detailedDays++
      if (day.ai.classificationVersion === CRAWLER_CLASSIFICATION_VERSION) sum.classifiedDays++
      for (const key of AI_TOTAL_KEYS) sum[key] += day.ai[key] || 0
      for (const [name, count] of Object.entries(day.ai.crawlers))
        sum.crawlers[name] = (sum.crawlers[name] || 0) + count
      for (const [name, detail] of Object.entries(day.ai.crawlerDetails || {}))
        if (detail && CATEGORY_META[detail.category]) sum.crawlerDetails[name] = detail
      for (const row of day.ai.topPages || [])
        topPages.set(row.path, (topPages.get(row.path) || 0) + row.requests)
      for (const row of day.ai.failedPages || []) {
        const key = row.status + "\n" + row.path
        failedPages.set(key, (failedPages.get(key) || 0) + row.requests)
      }
      sum.pathsTruncated ||= !!day.ai.pagesTruncated
      sum.failedPathsTruncated ||= !!day.ai.failedPagesTruncated
    }
    if (state?.browserEnabled && day?.readers) {
      recorded.add(date)
      sum.readerDays++
      sum.views += day.readers.views
      sum.visits += day.readers.visits
    }
  }
  sum.recordedDates = dates.filter((date) => recorded.has(date))
  sum.topPages = [...topPages]
    .map(([path, requests]) => ({ path, requests }))
    .sort((a, b) => b.requests - a.requests)
  sum.contentRequests = sum.topPages.reduce((total, row) => total + row.requests, 0)
  sum.uniqueContentPages = sum.topPages.length
  sum.failedPages = [...failedPages]
    .map(([key, requests]) => {
      const split = key.indexOf("\n")
      return { status: Number(key.slice(0, split)), path: key.slice(split + 1), requests }
    })
    .sort((a, b) => b.requests - a.requests)
  sum.categories = categorize(sum.crawlers, sum.crawlerDetails)
  sum.userTriggered = sum.categories.aiAssistant
  sum.automated = Math.max(0, sum.requests - sum.userTriggered)
  return sum
}
export function publicSummary(state) {
  const lifetime = state ? ensureLifetime(state) : null
  const ai = lifetime?.ai || emptyAITotals()
  const readers = lifetime?.readers || emptyReaderTotals()
  const categories = categorize(ai.crawlers, ai.crawlerDetails)
  return {
    version: 2,
    from: [ai.from, readers.from].filter(Boolean).sort()[0] || null,
    through: [ai.through, readers.through].filter(Boolean).sort().at(-1) || null,
    crawlerRequests: ai.requests,
    aiRequests: categories.ai,
    searchRequests: categories.search,
    hybridRequests: categories.hybrid,
    otherCrawlerRequests: Math.max(
      0,
      categories.total - categories.ai - categories.search - categories.hybrid,
    ),
    successful: ai.successful,
    blocked: ai.blocked,
    notFound: ai.notFound,
    serverError: ai.serverError,
    notModified: ai.notModified,
    redirects: ai.redirects,
    other: ai.other,
    pageViews: readers.views,
    visits: readers.visits,
    updatedAt: state?.lastAttempt || null,
  }
}
function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  )
}
function displayPath(path) {
  let value = String(path)
  // Decode for display only. The href below keeps the original path unchanged.
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(value)
      if (decoded === value) break
      value = decoded
    } catch {
      break
    }
  }
  return value
}
function fmt(value) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
function coverage(found, total) {
  return "已取得 " + found + "/" + total + " 天数据"
}
function time(value) {
  const ms = Date.parse(value || "")
  return Number.isFinite(ms)
    ? new Date(ms + OFFSET).toISOString().slice(0, 19).replace("T", " ")
    : "尚未成功取数"
}
function clock(value) {
  const formatted = time(value)
  return formatted === "尚未成功取数" ? formatted : formatted.slice(11, 16)
}
function card(label, value, foot) {
  return `<div class="card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(foot)}</small></div>`
}
const STYLE = `:root{color-scheme:light dark;--bg:#faf8f3;--paper:#fffdf8;--ink:#292d29;--muted:#696f66;--line:#dce0d5;--accent:#42644b}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.7 system-ui,-apple-system,"Noto Sans SC",sans-serif}main{max-width:1000px;margin:auto;padding:30px 22px}a{color:var(--accent);text-underline-offset:4px;overflow-wrap:anywhere}h1{font-size:27px;margin:8px 0}h2{font-size:19px;margin:28px 0 10px}p{margin:9px 0}.muted,small{color:var(--muted)}.eyebrow{font-size:12px;letter-spacing:.15em}.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.tabs a{border:1px solid var(--line);border-radius:20px;padding:5px 17px;text-decoration:none}.tabs a[aria-current=page]{background:var(--accent);color:white}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.totals{grid-template-columns:repeat(3,minmax(0,1fr))}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.totals .card strong{font-size:34px}.card{padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--paper)}.card span,.card small{display:block}.card strong{display:block;font-size:29px;line-height:1.7;font-variant-numeric:tabular-nums}.notice{border-left:3px solid #bc9858;padding:8px 13px;background:var(--paper)}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:9px 7px;border-bottom:1px solid var(--line);text-align:left}th{white-space:nowrap}td.num{text-align:right;font-variant-numeric:tabular-nums}.bar{background:var(--line);height:5px;border-radius:8px;min-width:80px}.bar i{display:block;background:var(--accent);height:5px;border-radius:8px}.foot{border-top:1px solid var(--line);margin-top:27px;padding-top:16px;font-size:13px}@media(max-width:650px){main{padding:18px 14px}.grid,.totals{grid-template-columns:repeat(2,minmax(0,1fr))}.card{padding:12px}.card strong,.totals .card strong{font-size:25px}.tabs{gap:6px}.tabs a{padding:5px 13px}h1{font-size:24px}}@media(prefers-color-scheme:dark){:root{--bg:#191d19;--paper:#222822;--ink:#e3e8de;--muted:#a4b29e;--line:#3a493b;--accent:#a9c399}}`
export function render(state, range = 30, now = Date.now()) {
  const s = summary(state, range, now)
  const all = publicSummary(state)
  const today = localDate(now)
  const yesterday = localDate(now - DAY)
  const botRows = Object.entries(s.crawlers).sort((a, b) => b[1] - a[1])
  const max = botRows[0]?.[1] || 1
  const status = state?.sourceStatus || {}
  const lifetimeMigrating = Object.values(state?.days || {}).some(
    (day) =>
      day?.ai &&
      day?.aiInLifetime !== false &&
      day.ai.classificationVersion !== CRAWLER_CLASSIFICATION_VERSION,
  )
  const lifetimeFoot = all.from
    ? `${all.from} 至 ${all.through}${lifetimeMigrating ? " · 历史全量爬虫补全中" : ""}`
    : "等待首次取数"
  const expectedLatest = s.range === "today" ? today : yesterday
  const stale = ["ai", ...(state?.browserEnabled ? ["readers"] : [])].some(
    (key) =>
      !status[key]?.lastSuccess ||
      now - Date.parse(status[key].lastSuccess) > 26 * 3600000 ||
      status[key].errors?.length ||
      (status[key].latestDate || "") < expectedLatest,
  )
  const notice = !state
    ? "等待首次自动取数。完成账户配置后，定时任务将开始更新。"
    : stale
      ? "部分数据正在等待更新或重试。页面保留最近成功取得的结果；缺失日期不按零计入。"
      : s.range === "today"
        ? "今日数据定时覆盖更新，当前为未结束自然日；记录以来累计仍截至昨日。"
        : "统计任务运行中。展示截至昨日的完整自然日，并定时自动复核。"
  const todayFetchedAt = state?.days?.[today]?.aiFetchedAt || state?.days?.[today]?.readersFetchedAt
  const todayThrough = todayFetchedAt ? clock(todayFetchedAt) : "等待首次取数"
  const periodLine =
    s.range === "today"
      ? `${today} 00:00 至 ${todayThrough} · 北京时间 · 今日尚未结束`
      : `${s.recordedDates.at(-1) || s.from} 至 ${s.recordedDates[0] || s.through} · 北京时间 · 已记录 ${s.recordedDates.length}/${s.days} 天`
  const crawlerFoot =
    s.range === "today"
      ? s.aiDays
        ? `今日数据，截至 ${clock(state?.days?.[today]?.aiFetchedAt)}`
        : "等待今日首次取数"
      : coverage(s.aiDays, s.days)
  const browserFoot = !state?.browserEnabled
    ? "尚未接入 Web Analytics 数据接口"
    : s.range === "today"
      ? s.readerDays
        ? `今日数据，截至 ${clock(state?.days?.[today]?.readersFetchedAt)}`
        : "等待今日首次取数"
      : coverage(s.readerDays, s.days)
  const datedRows = s.dates
    .filter((date) => state?.days?.[date]?.ai || state?.days?.[date]?.readers)
    .map((date) => {
      const d = state?.days?.[date]
      const categories = d?.ai ? categorize(d.ai.crawlers, d.ai.crawlerDetails) : null
      return `<tr><td>${date}</td><td class="num">${d?.ai ? fmt(d.ai.requests) : "—"}</td><td class="num">${categories ? fmt(categories.ai) : "—"}</td><td class="num">${state?.browserEnabled && d?.readers ? fmt(d.readers.views) : "—"}</td></tr>`
    })
    .join("")
  const host = state?.hostname || "xiaoshizhanggui.com"
  const pathRows = s.topPages
    .slice(0, 20)
    .map(
      (p) =>
        `<tr><td><a href="https://${esc(host)}${esc(p.path)}" target="_top">${esc(displayPath(p.path))}</a></td><td class="num">${fmt(p.requests)}</td></tr>`,
    )
    .join("")
  const failedRows = s.failedPages
    .slice(0, 20)
    .map(
      (p) =>
        `<tr><td><a href="https://${esc(host)}${esc(p.path)}" target="_top">${esc(displayPath(p.path))}</a></td><td class="num">${esc(p.status)}</td><td class="num">${fmt(p.requests)}</td></tr>`,
    )
    .join("")
  const detailFoot =
    s.detailedDays < s.aiDays ? "部分历史日期仍在自动补分状态码" : "未归入上述类别的响应状态"
  const classificationFoot =
    s.classifiedDays < s.aiDays
      ? "部分历史日期正在自动补全全量爬虫分类"
      : "互斥主分类，合计等于全部爬虫请求"
  const directory = state?.botDirectory
  const directoryNotice =
    directory?.source === "radar" || directory?.source === "radar-cache"
      ? `识别范围：Cloudflare Radar 已验证机器人目录 ${fmt(directory.directoryCount || 0)} 项，加上未收录但名称明显为自动程序的兜底识别。每个请求只归入一个主分类。`
      : "识别范围：当前使用核心名单与自动程序兜底。若要启用 Cloudflare Radar 全量已验证机器人目录，请为 Worker 添加具有 User Details Read 权限的 CF_RADAR_TOKEN。"
  const extraCategoryCards = [
    ["seo", "SEO 与站点审计", "如 Lighthouse、站点检查工具"],
    ["social", "社交与链接预览", "社交平台和聊天软件预览"],
    ["feed", "RSS、播客与聚合器", "订阅器、播客和内容聚合"],
    ["monitoring", "监控、分析与 Webhook", "可用性检查与自动通知"],
    ["archive", "网页存档", "网页历史保存服务"],
    ["research", "学术研究", "研究机构与资料收集"],
    ["security", "安全扫描", "安全与漏洞检查"],
    ["accessibility", "无障碍检查", "网页无障碍测试"],
    ["marketing", "广告与营销", "广告验证及营销服务"],
    ["data", "数据采集", "价格、情报及第三方分析"],
    ["automation", "其他自动服务", "交易代理等自动化服务"],
    ["unknown", "目录外自动程序", "名称明显，但尚未被目录收录或验证"],
  ]
    .filter(([key]) => s.categories[key] > 0)
    .map(([key, label, foot]) => card(label, fmt(s.categories[key]), foot))
    .join("")
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>网站访问记录 · 小施掌柜</title><style>${STYLE}</style></head><body><main>
    <div class="eyebrow">小施掌柜 · 网站访问记录</div><h1>谁来读过这些文字</h1>
    <p class="muted">${periodLine} · 数字可能包含采样估算</p>
    <nav class="tabs" aria-label="统计周期">${[
      ["today", "今日"],
      ["1", "昨日"],
      ["7", "近 7 天"],
      ["30", "近 30 天"],
    ]
      .map(
        ([value, label]) =>
          `<a href="?range=${value}"${value === s.range ? ' aria-current="page"' : ""}>${label}</a>`,
      )
      .join("")}</nav>
    <p class="notice">${esc(notice)}</p>
    <p class="notice">${esc(directoryNotice)}</p>
    <h2>记录以来累计（截至昨日）</h2><div class="grid totals">
    ${card("已识别爬虫请求", all.from ? fmt(all.crawlerRequests) : "—", lifetimeFoot)}
    ${card("其中 AI 服务", all.from ? fmt(all.aiRequests) : "—", lifetimeFoot)}
    ${card("页面浏览量", all.from ? fmt(all.pageViews) : "—", lifetimeFoot)}
    </div>
    <h2>${s.label}爬虫概览</h2><div class="grid">
    ${card(`${s.label}爬虫请求`, s.aiDays ? fmt(s.requests) : "—", crawlerFoot)}
    ${card("内容页面成功请求", s.aiDays ? fmt(s.contentRequests) : "—", "不含静态资源与站点文件")}
    ${card("被访问内容页面", s.aiDays ? fmt(s.uniqueContentPages) : "—", "不同内容路径数量")}
    </div>
    <h2>爬虫用途分类</h2><p class="muted">${classificationFoot}</p><div class="grid">
    ${card("AI 抓取与训练", s.aiDays ? fmt(s.categories.aiCrawler) : "—", "如 GPTBot、Meta-ExternalAgent")}
    ${card("AI 搜索", s.aiDays ? fmt(s.categories.aiSearch) : "—", "如 OAI-SearchBot、PerplexityBot")}
    ${card("AI 助手与按需读取", s.aiDays ? fmt(s.categories.aiAssistant) : "—", "如 ChatGPT-User、Claude-User")}
    ${card("传统搜索引擎", s.aiDays ? fmt(s.categories.search) : "—", "如 Googlebot、Bingbot、百度")}
    ${card("搜索与 AI 混合", s.aiDays ? fmt(s.categories.hybrid) : "—", "目前主要为 PetalBot")}
    ${extraCategoryCards}
    </div>
    <h2>响应状态</h2><div class="grid">
    ${card("成功响应 · 2xx", s.aiDays ? fmt(s.successful) : "—", "包括页面及其他资源")}
    ${card("页面不存在 · 404", s.aiDays ? fmt(s.notFound) : "—", "用于发现失效或错误链接")}
    ${card("403 / 429 响应", s.aiDays ? fmt(s.blocked) : "—", "拒绝访问或限流")}
    ${card("服务器异常 · 5xx", s.aiDays ? fmt(s.serverError) : "—", "需要优先检查")}
    ${card("3xx 重定向", s.aiDays ? fmt(s.redirects) : "—", "不含 304")}
    ${card("其他状态", s.aiDays ? fmt(s.other) : "—", detailFoot)}
    </div><p class="muted">304 未修改响应：${s.aiDays ? fmt(s.notModified) : "—"}。它表示爬虫沿用缓存，不等于抓取失败。</p>
    <h2>浏览器访问</h2><div class="grid two">${card(`${s.label}页面浏览`, s.readerDays ? fmt(s.views) : "—", browserFoot)}${card(`${s.label}访问次数`, s.readerDays ? fmt(s.visits) : "—", "Visits，不是独立人数")}</div>
    <h2>哪些爬虫来过</h2>${
      botRows.length
        ? `<div class="scroll"><table><thead><tr><th>爬虫标识</th><th>平台</th><th>主分类</th><th>请求次数</th><th>相对数量</th></tr></thead><tbody>${botRows
            .map(([name, count]) => {
              const meta = crawlerMeta(name, s.crawlerDetails)
              return `<tr><td>${esc(name)}</td><td>${esc(meta.operator)}</td><td>${esc(CATEGORY_META[meta.category]?.[0] || "其他")}</td><td class="num">${fmt(count)}</td><td><div class="bar"><i style="width:${Math.max(1, (count / max) * 100).toFixed(2)}%"></i></div></td></tr>`
            })
            .join("")}</tbody></table></div>`
        : '<p class="muted">当前没有可展示的爬虫记录。</p>'
    }
    <h2>${s.label}热门抓取页面</h2><p class="muted">内容路径筛选 · 2xx 响应${s.pathsTruncated ? " · 路径结果达到上限，榜单可能不完整" : ""}${s.days > 1 ? " · 基于每日成功页面记录汇总" : ""}</p>
    ${pathRows ? `<div class="scroll"><table><thead><tr><th>页面</th><th>成功请求</th></tr></thead><tbody>${pathRows}</tbody></table></div>` : `<p class="muted">${s.label}暂无可展示的页面记录。</p>`}
    ${s.notFound + s.blocked + s.serverError + s.other > 0 ? `<h2>${s.label}未成功访问最多的页面</h2><p class="muted">仅显示内容路径 · 4xx/5xx 响应${s.failedPathsTruncated ? " · 结果达到上限" : ""}</p>${failedRows ? `<div class="scroll"><table><thead><tr><th>页面</th><th>状态码</th><th>请求次数</th></tr></thead><tbody>${failedRows}</tbody></table></div>` : '<p class="muted">未成功请求未落在可展示的内容路径上。</p>'}` : ""}
    <h2>每天的记录</h2>${datedRows ? `<div class="scroll"><table><thead><tr><th>日期</th><th>全部爬虫</th><th>AI 服务</th><th>浏览器浏览量</th></tr></thead><tbody>${datedRows}</tbody></table></div>` : '<p class="muted">当前周期尚无可展示的每日记录。</p>'}
    <div class="foot"><p>爬虫数据最近成功读取：${esc(time(status.ai?.lastSuccess))}<br>浏览器数据最近成功读取：${state?.browserEnabled ? esc(time(status.readers?.lastSuccess)) : "未接入"}</p>
    <p>全量表示 Cloudflare Radar 当前目录中可通过 User-Agent 识别的已知机器人，并额外兜底名称明显的自动程序；不包括故意伪装成普通浏览器且没有可用识别信号的程序。User-Agent 名称可以伪造；verified 模式会优先使用可用的 Cloudflare 检测 ID。每个请求只进入一个主分类，不会重复计入总数。</p>
    <p>只记录经过本域名 Cloudflare 的请求。今日数据定时覆盖，不在当天重复计入累计；次日取得完整数据后才进入累计。有数据的零显示“0”。近 7/30 天在数据积累完整前仅为已取得日期的小计。抓取不代表内容已被训练、收录或引用；浏览器统计可能因脚本拦截而漏计。分类程序版本：2026-09-16。</p>
    <p><a href="${PREFIX}data.json" target="_blank" rel="noopener">下载近期汇总 JSON</a> · <a href="https://${esc(state?.hostname || "xiaoshizhanggui.com")}" target="_top">返回个人站</a></p></div>
  </main></body></html>`
}
export default {
  async scheduled(controller, env, ctx) {
    try {
      await collect(env, controller.scheduledTime || Date.now())
    } catch (e) {
      console.error(JSON.stringify({ event: "stats_job_failed", code: errorCode(e) }))
      throw new Error(errorCode(e))
    }
  },
  async fetch(request, env) {
    const url = new URL(request.url)
    // This Worker owns ONLY /_stats/*, never the site's article routes.
    if (!url.pathname.startsWith(PREFIX)) return new Response("Not found", { status: 404 })
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } })
    if (
      !["/_stats/", "/_stats/data.json", "/_stats/summary.json", "/_stats/health"].includes(
        url.pathname,
      )
    )
      return new Response("Not found", { status: 404 })
    const headers = {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      "Cache-Control": "public, max-age=60",
    }
    try {
      if (!env.STATS_KV) throw new StatsError("KV_BINDING")
      const state = await env.STATS_KV.get("state:v1", "json")
      let body
      let statusCode = 200
      if (url.pathname.endsWith("/health")) {
        headers["Content-Type"] = "application/json; charset=utf-8"
        headers["Cache-Control"] = "no-store"
        const yesterday = localDate(Date.now() - DAY)
        const sources = state?.browserEnabled ? ["ai", "readers"] : ["ai"]
        const healthy =
          !!state &&
          sources.every((s) => {
            const x = state.sourceStatus?.[s]
            return (
              (x?.latestDate || "") >= yesterday &&
              Date.now() - Date.parse(x.lastSuccess || "") < 26 * 3600000 &&
              !x.errors?.length
            )
          })
        statusCode = healthy ? 200 : 503
        body = JSON.stringify({
          healthy,
          sourceStatus: state?.sourceStatus || {},
          lastAttempt: state?.lastAttempt || null,
        })
      } else if (url.pathname.endsWith("/summary.json")) {
        headers["Content-Type"] = "application/json; charset=utf-8"
        body = JSON.stringify(publicSummary(state))
      } else if (url.pathname.endsWith("/data.json")) {
        headers["Content-Type"] = "application/json; charset=utf-8"
        body = JSON.stringify(state || { status: "waiting", days: {} })
      } else {
        headers["Content-Type"] = "text/html; charset=utf-8"
        const requestedRange = url.searchParams.get("range") || url.searchParams.get("days") || "30"
        body = render(state, normalizeRange(requestedRange))
      }
      return new Response(request.method === "HEAD" ? null : body, { status: statusCode, headers })
    } catch {
      headers["Content-Type"] = "text/plain; charset=utf-8"
      headers["Cache-Control"] = "no-store"
      return new Response(request.method === "HEAD" ? null : "统计暂时不可用，请稍后再试。", {
        status: 503,
        headers,
      })
    }
  },
}
