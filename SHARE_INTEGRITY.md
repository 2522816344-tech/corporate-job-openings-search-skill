# 分享包完整性说明

本 zip 由 `scripts/pack_for_share.js` 主动筛选生成，**不依赖 `.gitignore`**。

## 包含
- `SKILL.md`（Agent 自动加载的元描述与触发条件）
- `scripts/`（全部可执行代码，无 npm 依赖）
- `docs/`（ARCHITECTURE / COMPLIANCE / TROUBLESHOOTING / FAQ）
- `tests/`（paths / common / xlsx 的回归测试）
- `.github/`（Issue 模板 + CI 工作流）
- `*.md` / `LICENSE` / `*.example` 等元数据

## 主动排除（隐私/缓存/无关产物）
- `data/`（抓取原始数据 jsonl）、`*.jsonl`
- `chrome-profile/`（带登录态的浏览器 profile，**风险最高**）
- `config.json` / `companies.json`（真实用户名、公司名单和抓取参数）
- `.env` / `.env.*`（私密环境变量）
- `*.xlsx` / `*.xls` / `*.log`（结果与日志）
- `node_modules/` / `__pycache__/` / `.git/`
- `.vscode/` / `.idea/` / `dist/` / `build/`
- 编辑器临时文件 `*~` / `*.bak` / `Thumbs.db` / `.DS_Store`

## 使用前置
- Node.js ≥ 22（运行 `node scripts/run.js` 的同一前置）
- Python ≥ 3.10 + `openpyxl`（`pip install -r requirements.txt`）
- 系统已装 Chrome / Edge / Chrome Canary（CDP 调试模式）
