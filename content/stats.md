---
title: 网站访问记录
description: 小施掌柜个人站的可识别爬虫、AI 服务、搜索引擎与浏览器访问汇总，自动更新。
---

这里记录有哪些访问来到本站。Cloudflare Radar 目录中的已验证机器人和其他名称明显的自动程序，会按 AI、搜索、社交预览、订阅聚合、监控等用途分别展示，并与浏览器访问区分，数字自动更新。

<iframe id="xiaoshi-stats-frame" src="https://xiaoshizhanggui.com/_stats/" title="网站访问统计" width="100%" height="2100" loading="lazy" onload="try{const main=this.contentDocument.querySelector('main');if(main)this.style.height=Math.ceil(main.getBoundingClientRect().height)+'px'}catch(e){}" style="border:0;border-radius:12px;width:100%;"></iframe>

<script>
(() => {
  const frame = document.getElementById("xiaoshi-stats-frame")
  if (!frame) return

  const resizeStatsFrame = () => {
    try {
      const main = frame.contentDocument?.querySelector("main")
      if (!main) return
      const height = Math.ceil(main.getBoundingClientRect().height)
      if (height > 0 && height < 20000) frame.style.height = `${height}px`
    } catch {}
  }

  frame.addEventListener("load", resizeStatsFrame)
  window.addEventListener("resize", resizeStatsFrame)
})()
</script>

[在独立页面查看完整统计](https://xiaoshizhanggui.com/_stats/)

统计采用北京时间。“今日”为定时更新的未结束自然日，昨日及更长周期只采用完整自然日。每个爬虫请求只进入一个主分类，不重复计入总数；这里的“全量”指所有能够通过目录或名称识别的自动程序，不包括故意伪装成普通浏览器的未知程序。抓取不代表内容已被训练、收录或引用，访问次数也不等于独立人数。
