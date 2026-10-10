---
title: "workspace 長成系統：little-leo 的兩千個 commit"
date: 2026-04-23T19:30:00+08:00
draft: false
tags: ["ai", "agents", "claude-code", "infra"]
summary: "OpenClaw 是我寫的 personal agent，little-leo 本來只是它的 workspace。六十天、兩千零九十八個 commit 之後，workspace 長成了系統本身，OpenClaw 反過來變成它的客戶。"
featured: true
lang: zh-TW
---

OpenClaw 是我寫給自己的 personal agent——最早只是 Claude Code 的一層 wrapper，讓它能在我的 M3 MacBook 跟實驗室桌機上 24/7 跑研究工作流。`little-leo` 一開始純粹是它的 workspace：一個放記憶、實驗結果、每日規劃、暫存筆記的資料夾。一個 scratch dir，我甚至沒想過要把它 version-control。

兩個月之後我回頭看，這個資料夾跑出了 **2,098 個 commit**。而且它已經不是 workspace 了。

## 它從出生那天就不 naive

`git init` 打下去的時候是 **2026-02-22**，commit `ea63448`，subject 寫 *"initial commit — workspace under version control"*。那個 commit 裡面已經有 `AGENTS.md`、`MEMORY.md`（316 行）、`SOUL.md`、`IDENTITY.md`、`HEARTBEAT.md`、`memory/` 下一整棵財務/專案/生活年表的筆記樹。

**git 的 day 0 已經是系統的 day N**。scratch dir 的階段根本沒進 git，是我在 git 外面跑了一陣子、受不了每週重建兩次記憶之後，才決定要把它放進版本控制。隔天（2026-02-23）的第二個 commit 直接就是 `feat: add system-scanner skill`，修的是自動 heartbeat 已經發現的第一個 bug。

## 三月的失控加速

我沒預期它會這樣長。

- **Feb 22 → Apr 23**，六十一天
- **2,098 個 commit**
- 三月單月 **1,542 個**，平均 ~50/day
- 最猛的 10 天是 3/10–3/20，**592 個 commit**，59/day

這裡面有一大部分是 heartbeat job 把新記憶、新 schedule auto-commit 進來（單 `heartbeat` 相關就 ~307 個），但 skills / autodidact / memory / mailbox 的功能性 commit 也接近一千。三月那段沒有安靜期——連續 31 天的高輸出，沒有週末。

## 轉折點是那一天的那個 commit

回頭去找，workspace 變成系統的分水嶺是 **2026-02-26，commit `439f6b8`**：

> feat: autodidact system — self-directed learning skill, values, goals, knowledge graph

那天 little-leo 進來了一個 **autodidact loop**——每 30 分鐘跑一次，有階段（learn / build / plan / reflect），有 task queue，有自己的 values 跟 goals。在那之前它是「OpenClaw 放東西的地方」；在那之後它是「有自己目標、會自己推進的系統」。

commit log 之後 **612 個 commit** 觸到 autodidact，是全 repo 最大的一條主題線。其他都是支架——boot budget 是為了讓它啟動得快、mailbox 是為了讓它跨機器、skills framework 是為了它的工具管理。autodidact 是軸，其他都是繞著它長出來的。

## 兩個我沒預期會蓋的東西

**Boot budget（Mar 9, `ad6849e`：533 → 167 lines）。** Anthropic 的 prompt cache TTL 是 5 分鐘。如果我的 agent 每次啟動要讀 500 行 context，cache miss 一次就是又慢又貴。所以我寫了一個 boot budget 系統：靜態規則（`AGENTS.md`）跟動態內容分家、每個檔案有行數預算（`SESSION-STATE.md` ≤ 40 行、`MEMORY.md` 當索引用 ≤ 20 行），heartbeat 會跑 `boot_budget_check.py` 警告超限。這玩意完全是被 prompt cache 的經濟學逼出來的——不是 best practice，是被現實壓扁的。

**跨機器 mailbox（Mar 1, `b2763a7`）。** 我有兩台機器：M3 MacBook 跟實驗室桌機。一開始兩邊用 iCloud 同步 memory，打架打得很兇。後來寫了一個 durable mailbox：用編號 ticket（`MB-001`, `MB-002`, …）搭 ACK/SLA 協定，兩邊各自有分支（`macbook-m3` 和 `lab-desktop`），透過 mailbox 協調再 merge。到今天跑了 7 週、11 張票，還活著。兩個月前我完全沒想到「個人 agent」會需要自己實作一個分散式訊息系統。

## 四月：收斂，分家

三月那股狂熱到四月明顯慢下來——掉到 ~17 commit/day。重點不是產能下降，是工作性質變了：

- **Apr 8 的 phase-3 refactor** 把 7 個 skills 從 little-leo 拉出去變成**獨立 repo**——它們已經成熟、被別的地方拿去用了，不需要再跟本體綁在一起
- 很多 commit 變成 dead weight cleanup、rename 收尾
- daily schedule 的節奏穩下來

一個 repo 開始把自己孵出來的小孩推出去，就是它長大的訊號。

## Rename：外部事件踩了一腳油門

Rename 本來可以不急。主角換人我心裡有數，但我沒打算四月就動工。

真正把油門踩到底的是 **2026-04-04**：Anthropic 切斷 Claude Pro/Max 訂閱對第三方 AI 代理框架的無限制存取，理由是 token 套利，前面幾個月累積的一串安全事件（2026/01 的 Claude Code CLI 原始碼外洩、代理被拿去當攻擊面）是背景。OpenClaw 這套框架的整個生態系當天被踢下車。我的個人 agent 原本就建在它上面，沒得選：一邊得把技術棧從「單押一家 provider」改成**路由可切換**（同一個 task，本地能跑就本地跑、雲端哪家便宜往哪送），一邊得把 repo 從「OpenClaw 的 workspace」改名成可以獨立存在的東西，因為它靠的那個品牌跟生態現在是負資產。

於是四月上旬那週有一次壓縮的 rename sprint：4 個主要 commit、18 個收尾 commit，一天內全部寫完。`LITTLE_LEO_*` 環境變數上線，同時保留 `OPENCLAW_*` 當 fallback（`9ef26d5`）。不能把正在跑的 heartbeat 一刀切，必須熱遷移。

事情過了回看才發現：這個被迫 rename 把一件我本來會拖延的認知壓縮到一週——**OpenClaw 不再是這個專案的主角，真正的主角是那個本來只是它 workspace 的 little-leo**。OpenClaw 現在是它的客戶之一，不是核心；session 背後的 skills、memory、schedules、cross-machine 協調，全部是 little-leo 的。

這件事真正的副作用不是 rename，而是它強迫我把整個 agent system **去中心化到 provider**。以前假設 Claude 永遠在，壞起來才會發現一整包東西都綁死在一家訂閱上。現在 little-leo 的 skills 跟 memory 層完全不假設 provider，哪家 API、哪個本地模型，都可以當成底層。

## 什麼時候一個資料夾會變成系統

事後歸納，讓我認出它已經不是 workspace 的那幾件事：

- 它有自己的**循環**（autodidact 每 30 分鐘）
- 它有**跨機器的協定**（mailbox）
- 它有**經濟學**（boot budget——什麼能進 context、什麼要撤）
- 它會**孵出 child repo**（phase-3 分家）
- 它的 rename 需要**向後相容**，因為它已經在 production 上跑
- 它不能**單押一家 provider**——上游一天就能把你的基底打掉

而我從來沒有哪個禮拜的 roadmap 寫著「我要蓋一個 agent system」。每週只是解當下最煩的那個問題——記憶爆掉、兩台機器打架、啟動慢、tool 太多擠爆 prompt。解完一個，系統就多一塊。兩千個 commit 之後回頭看，它看起來像是被設計出來的，但實際上每一步都是在補漏。

大概個人 agent 就是這樣長出來的吧。你不是在「設計」它，你是在一邊用一邊擋住它掉下去。等你回過神，workspace 已經不是 workspace 了。

## 接下來

little-leo 目前停在 v1 的穩定態：autodidact、mailbox、schedule 三個在背景跑著。接下來兩個比較大的方向是把 skills 的 registry 再收一收（目前 ~33 個、有重疊），還有把 autodidact 的 reflect 階段接上一個更認真的 knowledge graph，讓它不只學新的，還能主動淘汰已經過期的 topic 檔案。

目前它還是自用，不是給別人跑的東西。但如果你也在寫個人 agent、也在跟 prompt cache 的經濟學打架，我之後會把 boot budget 那一塊單獨寫一篇更深的。
