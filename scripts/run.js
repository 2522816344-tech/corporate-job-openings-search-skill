// 一键编排：登录准备/体检 → 逐平台抓取 → 汇总出 Excel
//
// 用法（在工作目录下，即放 companies.json 的地方）：
//   node <本文件> --login             先启动三平台登录页；登录完成后告知 Codex
//   node <本文件>                     全套跑一遍
//   node <本文件> --platforms zhilian  只跑指定平台
//   node <本文件> --only 星辰传动,云智动力   定点重跑某几家公司
//   node <本文件> --job-types 机器人算法,嵌入式软件
//   node <本文件> --limit 3            小样本试跑
//   node <本文件> --no-build           只抓数据，不出表
//
// 说明：数据是「断点续抓」的 —— 已成功的公司会被跳过，中断后重跑即可继续。
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const HERE = __dirname;
const DIR = process.env.SCRAPE_DIR || process.cwd();

const argv = process.argv.slice(2);
const has = k => argv.includes(k);
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };

/* ---------- 平台定义 ---------- */
const PLATFORMS = {
  liepin:  { label: '猎聘',     script: 'liepin.js', out: 'liepin_all.jsonl' },
  job51:   { label: '前程无忧', script: 'j51.js',    out: 'job51_all.jsonl' },
  zhilian: { label: '智联招聘', script: 'zp.js',     out: 'zhilian_all.jsonl' },
};

/* ---------- 读配置 ---------- */
function loadConfig() {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8')); } catch {}
  return cfg;
}
const CFG = loadConfig();

const platformArg = argOf('--platforms', null);
const rawWant = (platformArg || (CFG.platforms || Object.keys(PLATFORMS)).join(','))
  .split(',').map(s => s.trim()).filter(Boolean);
const bad = rawWant.filter(p => !PLATFORMS[p]);
if (bad.length && platformArg) {
  console.log('  ! 未知平台：' + bad.join(',') + '（可选：' + Object.keys(PLATFORMS).join(' / ') + '）');
  process.exit(1);
}
if (bad.length) console.log('  ! 配置中的已停用平台会被忽略：' + bad.join(','));
const want = rawWant.filter(p => PLATFORMS[p]);
if (!want.length) want.push(...Object.keys(PLATFORMS));

const loginOnly = has('--login');
const jobTypesArg = argOf('--job-types', null);
const cfgJobTypes = Array.isArray(CFG.jobTypes)
  ? CFG.jobTypes
  : String(CFG.jobTypes || '').split(/[,，、;；|/]+/);
const jobTypes = jobTypesArg
  ? jobTypesArg.split(/[,，、;；|/]+/).map(s => s.trim()).filter(Boolean)
  : cfgJobTypes.map(s => String(s).trim()).filter(Boolean);

// 正常抓取前名单必须存在；登录阶段不要求名单
if (!loginOnly && !fs.existsSync(path.join(DIR, 'companies.json'))) {
  console.log('  ! 工作目录 ' + DIR + ' 下找不到 companies.json');
  console.log('    可以照 companies.example.json 的格式准备一份（也支持 ["公司A","公司B"] 这种简写）。');
  process.exit(1);
}

const passthru = [];
for (const k of ['--only', '--jobs', '--limit', '--pages', '--pace']) {
  const v = argOf(k, null);
  if (v !== null) passthru.push(k, v);
}

const run = (script, label) => new Promise(res => {
  console.log('\n' + '─'.repeat(60));
  console.log('▶ ' + label + '  (' + script + ')');
  console.log('─'.repeat(60));
  const p = spawn(process.execPath, [path.join(HERE, script), ...passthru], {
    cwd: HERE,
    env: Object.assign({}, process.env, {
      SCRAPE_DIR: DIR,
      ...(jobTypes.length ? { SCRAPE_JOB_TYPES: JSON.stringify(jobTypes) } : {}),
    }),
    stdio: 'inherit',
  });
  p.on('exit', code => {
    console.log('◀ ' + label + ' 结束，退出码 ' + code);
    res(code);
  });
  p.on('error', e => { console.log('◀ ' + label + ' 启动失败：' + e.message); res(1); });
});

/* ---------- 进度汇总 ---------- */
function tally() {
  const rows = [];
  for (const p of Object.keys(PLATFORMS)) {
    const f = path.join(DIR, 'data', PLATFORMS[p].out);
    let total = 0, ok = 0;
    if (fs.existsSync(f)) {
      for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try { const d = JSON.parse(line); if (d && d.n) { total++; if (d.ok) ok++; } } catch {}
      }
    }
    rows.push({ p, label: PLATFORMS[p].label, total, ok });
  }
  return rows;
}

function findPython() {
  if (process.env.PYTHON) return process.env.PYTHON;
  const cands = process.platform === 'win32'
    ? ['python.exe', 'python3.exe', 'py']
    : ['python3', 'python'];
  for (const c of cands) {
    try {
      const r = spawnSync(c, ['-c', 'import openpyxl'], { encoding: 'utf8' });
      if (r.status === 0) return c;
    } catch {}
  }
  return null;
}

(async () => {
  console.log('工作目录: ' + DIR);
  console.log('待跑平台: ' + want.map(p => PLATFORMS[p].label).join(' / '));
  if (jobTypes.length) console.log('岗位类型: ' + jobTypes.join(' / '));
  if (passthru.length) console.log('透传参数: ' + passthru.join(' '));

  fs.mkdirSync(path.join(DIR, 'data'), { recursive: true });

  // 1) 浏览器
  if (!has('--skip-chrome')) {
    const HOME = {
      liepin: 'https://www.liepin.com/',
      job51: 'https://we.51job.com/',
      zhilian: 'https://www.zhaopin.com/',
    };
    const { launch, initProfile } = require('./chrome.js');
    const UD = process.env.CHROME_PROFILE || path.join(DIR, 'chrome-profile', 'User Data');
    if (!fs.existsSync(UD)) initProfile();
    const loginOrder = ['job51', 'zhilian', 'liepin'].filter(p => want.includes(p));
    const ok = await launch(loginOrder.map(p => HOME[p]).filter(Boolean));
    if (!ok) {
      console.log('\n浏览器没起来，先解决这一步。可以手动执行：node ' + path.join(HERE, 'chrome.js'));
      process.exit(1);
    }
  }

  // 2) 登录态体检
  if (!has('--no-verify')) {
    const r = spawnSync(process.execPath, [path.join(HERE, 'verify.js')], {
      cwd: HERE, env: Object.assign({}, process.env, { SCRAPE_DIR: DIR }), stdio: 'inherit',
    });
    if (r.status === 2) {
      console.log('\n有平台未登录。在浏览器窗口里手动登录后重跑；确实不需要该平台就把它从 --platforms 里去掉。');
      process.exit(2);
    }
  }

  if (loginOnly) {
    console.log('\n登录准备完成。请用户确认三平台都已登录，然后收集公司名单和岗位类型。');
    return;
  }

  // 3) 抓取
  if (has('--parallel')) {
    await Promise.all(want.map(p => run(PLATFORMS[p].script, PLATFORMS[p].label)));
  } else {
    for (const p of want) await run(PLATFORMS[p].script, PLATFORMS[p].label);
  }

  // 4) 汇总
  console.log('\n' + '─'.repeat(60));
  console.log('抓取结果汇总');
  console.log('─'.repeat(60));
  let anyOk = false;
  for (const r of tally()) {
    console.log('  ' + r.label.padEnd(8, ' ') + ' 命中公司 ' + String(r.ok).padStart(3) + ' / 记录 ' + String(r.total).padStart(3));
    if (r.ok) anyOk = true;
  }

  if (has('--no-build') || !anyOk) {
    console.log(has('--no-build') ? '\n按参数跳过出表。' : '\n还没有任何命中数据，先不出表。');
    return;
  }

  const py = findPython();
  if (!py) {
    console.log('\n  ! 找不到带 openpyxl 的 Python，跳过出表。');
    console.log('    安装后重跑：pip install openpyxl && python ' + path.join(HERE, 'build_xlsx.py'));
    return;
  }
  console.log('\n' + '─'.repeat(60));
  console.log('▶ 生成 Excel');
  console.log('─'.repeat(60));
  const r = spawnSync(py, [path.join(HERE, 'build_xlsx.py')], {
    cwd: HERE,
    env: Object.assign({}, process.env, {
      SCRAPE_DIR: DIR,
      ...(jobTypes.length ? { SCRAPE_JOB_TYPES: JSON.stringify(jobTypes) } : {}),
    }),
    stdio: 'inherit',
  });
  if (r.status !== 0) console.log('  ! 出表失败，可单独重跑：' + py + ' ' + path.join(HERE, 'build_xlsx.py'));
})();
