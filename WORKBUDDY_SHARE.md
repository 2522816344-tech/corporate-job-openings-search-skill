# WorkBuddy 分享使用说明

## 发送什么

只发送 `recruit-platform-cdp-scrape-share.zip`。

不要发送以下任一内容：

- `chrome-profile/`：包含浏览器登录状态的 Cookies，风险最高。
- `data/` 或 `*.jsonl`：包含抓取过程和结果数据。
- `config.json`：可能包含真实姓名、城市、岗位类型和筛选参数。
- `companies.json`：包含真实公司名单。
- `.env` 或任何账号、密码、Token、Cookie 文本。
- `*.xlsx`：本次抓取结果。

分享包由 `scripts/pack_for_share.js` 主动筛选生成，不依赖 `.gitignore`。它会排除上述文件，
只保留 `SKILL.md`、代码、模板、测试和说明文档。

## 朋友如何使用

朋友需要具备：

- Node.js 22 或更高版本。
- Python 3.10 或更高版本，并安装 `openpyxl`。
- 本机安装 Chrome、Edge 或 Chromium。
- WorkBuddy 能执行本地命令，并能打开本机浏览器。

使用步骤：

1. 解压 ZIP 到任意本地目录，例如 `C:\recruit-platform-cdp-scrape`。
2. 为抓取数据另外建一个空目录，例如 `C:\recruit-work`。
3. 如果 WorkBuddy 支持导入技能目录，把解压目录导入；如果只支持工作区，就在 WorkBuddy
   中打开解压目录，或把解压路径和抓取工作目录路径提供给它。
4. 第一次只要求 WorkBuddy 按 `SKILL.md` 打开三个平台的登录页，不要提前提供公司名单。

首次提示词：

```text
读取 <解压目录>/SKILL.md，并严格按其中的“强制交互顺序”执行。
技能目录：<解压目录>
抓取工作目录：<自己新建的抓取数据目录>

第一步只运行 run.js --login，打开猎聘、前程无忧、智联招聘的登录页，然后停下来等我确认。
不要读取、上传或发送任何浏览器 profile、Cookie、账号密码、公司名单或抓取数据。
```

用户在 WorkBuddy 打开的浏览器里自行登录自己的账号，确认后发送：

```text
已经好了。
公司名单：公司A、公司B、公司C
岗位类型：技术岗、财务、招聘、供应链
```

后续由 WorkBuddy 按 `SKILL.md` 执行抓取、抽样检查和 Excel 输出。

## 账号隔离保证

- 分享包不含 `chrome-profile/`，因此不含登录 Cookie、浏览历史、已登录标签页状态或浏览器缓存。
- 分享包不含 `config.json`，因此不含姓名、城市和岗位筛选配置。
- 分享包不含 `companies.json` 和 `data/`，因此不含公司名单和已抓数据。
- 代码只在朋友自己的电脑上运行，登录态来自朋友自己的浏览器；不会连接你的账号或浏览器。
- 不要为了“节省登录时间”发送自己的 `chrome-profile/`。那会等于交出招聘账号的登录状态。
