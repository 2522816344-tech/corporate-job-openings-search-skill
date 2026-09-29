// 回归测试：scripts/pack_for_share.js 的"隐私剔除"行为不能退化
//
// 跑法：
//   node tests/test_pack_for_share.js
//
// 检查点：
//   1. 打出来的 zip 不含任何隐私敏感条目（data/ chrome-profile/ .env *.jsonl *.xlsx *.log）
//   2. 应当保留 SKILL.md / README.md / .env.example 等样板文件
//   3. 不会因脚本自删除而崩溃（已修：summarize 不 stat 临时清理文件）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '..');
const PACK = path.join(ROOT, 'scripts', 'pack_for_share.js');

function fail(msg) {
  console.error('  ✗ ' + msg);
  process.exit(1);
}
function ok(msg) { console.log('  ✓ ' + msg); }

if (!fs.existsSync(PACK)) fail('找不到 ' + PACK);

console.log('── pack_for_share 黑名单回归 ──');

// 1. 在系统临时目录造一份"含隐私敏感文件的完整 demo"，模拟用户已经跑过一次
const os = require('os');
const sandbox = path.join(os.tmpdir(), 'recruit-pack-test-' + Date.now());
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(sandbox, { recursive: true });

// 把 skill 主体放进 sandbox；优先 symlink，Windows 无权限时自动退回复制。
function expose(src, dest, type) {
  try {
    fs.symlinkSync(src, dest, type);
  } catch {
    fs.cpSync(src, dest, { recursive: type === 'dir' });
  }
}
expose(path.join(ROOT, 'scripts'),      path.join(sandbox, 'scripts'),      'dir');
expose(path.join(ROOT, '.github'),      path.join(sandbox, '.github'),      'dir');
expose(path.join(ROOT, 'docs'),         path.join(sandbox, 'docs'),         'dir');
expose(path.join(ROOT, 'tests'),        path.join(sandbox, 'tests'),        'dir');
expose(path.join(ROOT, 'SKILL.md'),     path.join(sandbox, 'SKILL.md'),     'file');
expose(path.join(ROOT, 'README.md'),    path.join(sandbox, 'README.md'),    'file');
expose(path.join(ROOT, 'LICENSE'),      path.join(sandbox, 'LICENSE'),      'file');
expose(path.join(ROOT, '.env.example'), path.join(sandbox, '.env.example'),'file');
expose(path.join(ROOT, '.gitignore'),   path.join(sandbox, '.gitignore'),   'file');

// 在 sandbox 里额外制造"应该被剔除"的样本
const probePrivate = [
  { abs: path.join(sandbox, 'data', 'liepin_all.jsonl'),         content: '{"_":"隐私1"}\n' },
  { abs: path.join(sandbox, 'chrome-profile', 'Default', 'Cookies'), content: '隐私 cookie' },
  { abs: path.join(sandbox, '.env'),                             content: 'SECRET=leaked' },
  { abs: path.join(sandbox, '.env.local'),                       content: 'LOCAL=leaked' },
  { abs: path.join(sandbox, '.env.production'),                  content: 'PROD=leaked' },
  { abs: path.join(sandbox, 'config.json'),                      content: '{"userName":"PLACEHOLDER"}' },
  { abs: path.join(sandbox, 'companies.json'),                   content: '["真实公司名单"]' },
  { abs: path.join(sandbox, 'result.xlsx'),                      content: 'fake xlsx bytes' },
  { abs: path.join(sandbox, 'app.log'),                          content: '2026-09-17 leaked log' },
  { abs: path.join(sandbox, 'node_modules', 'leftpad', 'index.js'), content: 'should be skipped' },
];
for (const f of probePrivate) {
  fs.mkdirSync(path.dirname(f.abs), { recursive: true });
  fs.writeFileSync(f.abs, f.content);
}

// 2. 在 sandbox 跑 pack_for_share.js
const sandboxOut = path.join(sandbox, 'test-out.zip');
try {
  execSync(`"${process.execPath}" "${PACK}" --out "${sandboxOut}"`, {
    cwd: sandbox,
    stdio: 'pipe',
  });
} catch (e) {
  fs.rmSync(sandbox, { recursive: true, force: true });
  fail('pack_for_share.js 执行失败：' + e.message);
}
const zipBuf = fs.readFileSync(sandboxOut);

// 3. 解析 zip 内每个 entry 的名字
const names = [];
let off = 0;
while (off < zipBuf.length) {
  const sig = zipBuf.readUInt32LE(off);
  if (sig !== 0x04034b50) break;
  const namelen = zipBuf.readUInt16LE(off + 26);
  const exlen   = zipBuf.readUInt16LE(off + 28);
  names.push(zipBuf.slice(off + 30, off + 30 + namelen).toString('utf8'));
  off += 30 + namelen + exlen + zipBuf.readUInt32LE(off + 18);
  if (off > zipBuf.length) break;
}

// 4. 断言：必须剔除 / 必须保留
// 严格黑名单：明确到具体变体，避免误杀样板文件
const deny = [
  /^\.env$/,                                              // .env（无后缀）
  /^\.env\.(local|production|development|test|staging|dev|prod)$/i,
  /(^|\/)data\//,                                         // 任何 data/ 路径
  /(^|\/)chrome-profile/,                                 // 任何 chrome-profile 路径
  /(^|\/)config\.json$/,                                  // 真实配置（可能含 userName）
  /(^|\/)companies\.json$/,                               // 真实公司名单
  /\.jsonl$/,                                             // 抓取原始数据
  /\.xlsx?$/,                                             // xlsx / xls 结果
  /\.log$/,                                               // 日志
  /(^|\/)node_modules\//,                                 // 依赖
];
const require_ = [
  'SKILL.md',
  'README.md',
  'LICENSE',
  '.env.example',
];

for (const re of deny) {
  const hit = names.filter(n => re.test(n));
  if (hit.length) fail('应剔除但仍存在：' + hit.join(', '));
}
if (new Set(names).size !== names.length) fail('ZIP 中存在重复条目');
ok('8 条黑名单全数剔除（共 ' + names.length + ' 个 entry 通过）');

for (const fname of require_) {
  if (!names.includes(fname)) fail('应保留但缺失：' + fname);
}
ok('4 条样板文件全部保留');

// 5. 清理 sandbox
fs.rmSync(sandbox, { recursive: true, force: true });

console.log('── 全部通过 ──');
