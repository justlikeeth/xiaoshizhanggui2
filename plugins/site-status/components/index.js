import { h } from "preact"

const SiteStatus = (userOptions = {}) => {
  const options = {
    siteSlug: "site",
    separator: " · ",
    ...userOptions,
  }

  const normalizedSiteSlug = String(options.siteSlug).replace(/^\/+|\/+$/g, "")

  const Component = ({ allFiles, fileData, displayClass }) => {
    const sitePage = allFiles.find((file) => {
      const slug = String(file.slug ?? "").replace(/^\/+|\/+$/g, "")
      return slug === normalizedSiteSlug
    })

    const frontmatter = sitePage?.frontmatter ?? {}
    const status =
      typeof frontmatter.site_status === "string"
        ? frontmatter.site_status.trim()
        : ""
    const thesis =
      typeof frontmatter.site_thesis === "string"
        ? frontmatter.site_thesis.trim()
        : ""

    if (!status && !thesis) return null

    const text = [status, thesis].filter(Boolean).join(options.separator)
    const pageSlug = String(fileData?.slug ?? "").replace(/^\/+|\/+$/g, "")
    const isHome = pageSlug === "" || pageSlug === "index"
    const className = [displayClass, "site-status-block"]
      .filter(Boolean)
      .join(" ")

    return h(
      "div",
      { class: className },
      h(
        "p",
        { class: "site-status" },
        h(
          "a",
          {
            class: "site-status-link",
            href: `/${normalizedSiteSlug}`,
            title: "查看本站自我定位",
          },
          text,
        ),
      ),
      isHome
        ? h(
            "a",
            {
              class: "site-stats-mini",
              href: "/stats",
              title: "查看网站访问记录",
              "data-site-stats": "",
            },
            h("span", null, "AI请求 "),
            h("strong", { "data-site-stats-ai": "" }, "—"),
            h("span", { "aria-hidden": "true" }, " · "),
            h("span", null, "浏览量 "),
            h("strong", { "data-site-stats-views": "" }, "—"),
          )
        : null,
    )
  }

  Component.css = `
.site-status-block {
  margin: 0.15rem 0 0.75rem;
}

.site-status {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.site-status-link {
  color: var(--darkgray);
  text-decoration: none;
}

.site-status-link:hover {
  color: var(--secondary);
}

.site-stats-mini {
  display: block;
  width: fit-content;
  margin-top: 0.28rem;
  color: var(--gray);
  font-size: 0.78rem;
  line-height: 1.4;
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}

.site-stats-mini strong {
  color: var(--darkgray);
  font-weight: 600;
}

.site-stats-mini:hover,
.site-stats-mini:hover strong {
  color: var(--secondary);
}
`

  Component.afterDOMLoaded = `
const loadSiteStats = async () => {
  const root = document.querySelector("[data-site-stats]")
  if (!root || root.dataset.loading === "true" || root.dataset.loaded === "true") return
  root.dataset.loading = "true"

  try {
    const response = await fetch("/_stats/summary.json", {
      headers: { Accept: "application/json" },
    })
    if (!response.ok) throw new Error("stats unavailable")

    const data = await response.json()

    if (!Number.isFinite(data.aiRequests) || data.aiRequests < 0) {
      throw new Error("invalid AI total")
    }

    if (!Number.isFinite(data.pageViews) || data.pageViews < 0) {
      throw new Error("invalid view total")
    }

    const formatter = new Intl.NumberFormat("zh-CN")
    const ai = root.querySelector("[data-site-stats-ai]")
    const views = root.querySelector("[data-site-stats-views]")

    if (ai) ai.textContent = formatter.format(data.aiRequests)
    if (views) views.textContent = formatter.format(data.pageViews)

    if (data.from && data.through) {
      root.title =
        data.from + " 至 " + data.through + "累计，点击查看详情"
    }

    root.dataset.loaded = "true"
  } catch {
    root.title = "统计暂时不可用，点击查看详情"
  } finally {
    delete root.dataset.loading
  }
}

document.addEventListener("nav", loadSiteStats)
document.addEventListener("render", loadSiteStats)
loadSiteStats()
`

  return Component
}

export { SiteStatus }
