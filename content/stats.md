---
title: 网站访问记录
description: 小施掌柜个人站的 AI 请求与浏览器访问汇总，自动更新。
---

这里记录有哪些访问来到本站。AI 服务请求与浏览器访问分别展示，数字自动更新。

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

      if (height > 0 && height < 20000) {
        frame.style.height = `${height}px`
      }
    } catch {}
  }

  frame.addEventListener("load", resizeStatsFrame)
  window.addEventListener("resize", resizeStatsFrame)
})()
</script>

[在独立页面查看完整统计](https://xiaoshizhanggui.com/_stats/)

统计采用北京时间。“今日”为每小时更新的未结束自然日，昨日及更长周期只采用完整自然日。抓取不代表内容已被训练、收录或引用；访问次数也不等于独立人数。
