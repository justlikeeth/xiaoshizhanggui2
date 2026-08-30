import { h } from "preact"

const SiteStatus = (userOptions = {}) => {
  const options = {
    siteSlug: "site",
    separator: " · ",
    ...userOptions,
  }

  const normalizedSiteSlug = String(options.siteSlug).replace(/^\/+|\/+$/g, "")

  const Component = ({ allFiles, displayClass }) => {
    const sitePage = allFiles.find((file) => {
      const slug = String(file.slug ?? "").replace(/^\/+|\/+$/g, "")
      return slug === normalizedSiteSlug
    })

    const frontmatter = sitePage?.frontmatter ?? {}
    const status = typeof frontmatter.site_status === "string" ? frontmatter.site_status.trim() : ""
    const thesis = typeof frontmatter.site_thesis === "string" ? frontmatter.site_thesis.trim() : ""

    if (!status && !thesis) return null

    const text = [status, thesis].filter(Boolean).join(options.separator)
    const className = [displayClass, "site-status"].filter(Boolean).join(" ")

    return h(
      "p",
      { class: className },
      h(
        "a",
        {
          class: "site-status-link",
          href: `/${normalizedSiteSlug}`,
          title: "查看本站自我定位",
        },
        text,
      ),
    )
  }

  Component.css = `
.site-status {
  margin: 0.15rem 0 0.75rem;
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
`

  return Component
}

export { SiteStatus }
