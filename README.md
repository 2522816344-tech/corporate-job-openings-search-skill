# 招聘岗位批量抓取

一个用于**批量收集企业招聘岗位信息**的工具。

支持从以下平台抓取：

- 猎聘
- 前程无忧
- 智联招聘

按公司名单和岗位类型搜索，抓取岗位信息并生成 Excel。

> 仅供个人调研使用，不得商用。  
> 不支持 Boss 直聘。

## 功能

- 按公司名单批量抓取招聘岗位
- 按岗位类型筛选
- 获取公司、岗位、城市、经验、学历、薪资、JD、福利等信息
- 支持断点续抓
- 可查看抓取进度和岗位样本
- 自动生成 Excel

## 使用环境

使用前需要自行准备：

1. Windows、macOS 或 Linux
2. Node.js 22 或更高版本
3. Python 3.10 或更高版本，并安装 `openpyxl`
4. Chrome、Edge 或 Chromium

如果手动安装 Python 依赖：

```bash
cd <技能目录>
pip install -r requirements.txt
```

### 不想自己安装？直接让 WorkBuddy 帮你配置

把下面内容直接复制给 WorkBuddy：

```text
请帮我准备这个项目的运行环境。

需要检查并安装：

1. Node.js 22 或更高版本
2. Python 3.10 或更高版本
3. Python 的 openpyxl 包
4. Chrome、Edge 或 Chromium 浏览器

如果已经安装且版本符合要求，不要重复安装。
安装完成后，请检查环境是否正常，并告诉我检查结果。

验证命令：

node --version
python --version
python -c "import openpyxl; print(openpyxl.__version__)"

如果系统只有 python3，请把上面的 python 换成 python3。
不要读取、上传或发送浏览器 profile、Cookie、账号密码或抓取数据。
```

环境配置完成后，再按照下面的「快速开始」操作。

## 快速开始

### 1. 准备配置

准备一个工作目录，例如 `my-recruit-work`。

复制模板：

```text
<技能目录>/scripts/companies.example.json -> my-recruit-work/companies.json
<技能目录>/scripts/config.example.json    -> my-recruit-work/config.json
```

然后填写公司名单和岗位相关配置。

### 2. 登录招聘网站

在工作目录运行：

```bash
node <技能目录>/scripts/run.js --login
```

脚本会打开：

- 猎聘
- 前程无忧
- 智联招聘

使用自己的账号登录即可。

登录完成后，告诉 WorkBuddy：

```text
已经登录好了。
公司名单：公司A、公司B、公司C
岗位类型：技术岗、财务、招聘、供应链
```

### 3. 开始抓取

在工作目录运行：

```bash
node <技能目录>/scripts/run.js
```

程序会自动完成：

```text
检查登录状态
↓
按公司名单搜索岗位
↓
抓取岗位信息和 JD
↓
生成 Excel
```

## 常用命令

只抓猎聘：

```bash
node <技能目录>/scripts/run.js --platforms liepin
```

只抓指定公司：

```bash
node <技能目录>/scripts/run.js --only 公司A,公司B
```

每家公司抓 6 个岗位：

```bash
node <技能目录>/scripts/run.js --jobs 6
```

查看进度：

```bash
node <技能目录>/scripts/status.js --sample 10
```

已有数据，只重新生成 Excel：

```bash
python <技能目录>/scripts/build_xlsx.py
```

## Excel 输出

通常包含：

- 岗位汇总
- 本地岗位
- 公司概览
- 全部在招岗位
- 原始 JD
- 说明与未匹配

## 注意事项

- 不需要在配置文件中填写账号密码
- 登录状态保存在本地浏览器环境
- 不上传账号、Cookie 和抓取结果
- 遇到验证码需要人工处理
- 不要把自己的 `chrome-profile/`、`data/`、`config.json`、`companies.json`、`.env` 和 Excel 数据分享给别人

## WorkBuddy

如果使用 WorkBuddy，可以直接导入技能目录。

首次使用时，让 WorkBuddy：

```text
读取 <技能目录>/SKILL.md，并按照其中的步骤执行。

技能目录：<技能目录>
抓取工作目录：<自己的工作目录>

第一步只运行：
<技能目录>/scripts/run.js --login

打开猎聘、前程无忧、智联招聘登录页面。
等我登录完成后，再开始抓取。
不要读取、上传或发送浏览器 profile、Cookie、账号密码、公司名单或抓取数据。
```

给朋友分享或配置 WorkBuddy 时，参考 [`WORKBUDDY_SHARE.md`](./WORKBUDDY_SHARE.md)。

## 更多说明

- [SKILL.md](./SKILL.md) - 技能说明
- [FAQ.md](./docs/FAQ.md) - 常见问题
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - 故障排查
- [SECURITY.md](./SECURITY.md) - 安全说明
- [COMPLIANCE.md](./docs/COMPLIANCE.md) - 使用边界
- [LICENSE](./LICENSE) - 开源许可
