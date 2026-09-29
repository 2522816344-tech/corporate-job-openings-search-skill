// 查看当前抓取进度和岗位样本，适合在主任务运行时打开另一个终端执行。
// 用法：node status.js [--sample 8]
const fs = require('fs');
const P = require('./paths.js');

const PLATFORMS = {
  liepin: { label: '猎聘', out: 'liepin_all.jsonl' },
  job51: { label: '前程无忧', out: 'job51_all.jsonl' },
  zhilian: { label: '智联招聘', out: 'zhilian_all.jsonl' },
};

const argv = process.argv.slice(2);
const sampleIdx = argv.indexOf('--sample');
const sample = sampleIdx >= 0 ? Math.max(0, +(argv[sampleIdx + 1] || 8)) : 8;

function readJSONL(file) {
  if (!fs.existsSync(file)) return [];
  const rows = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch {}
  }
  return rows;
}

console.log('工作目录: ' + P.DIR);
console.log('岗位类型: ' + ((P.loadConfig().jobTypes || []).join(' / ') || '未限定'));

let total = 0;
for (const [key, pf] of Object.entries(PLATFORMS)) {
  const rows = readJSONL(P.out(pf.out));
  const ok = rows.filter(r => r && r.ok);
  const miss = rows.filter(r => r && r.notFound);
  const err = rows.filter(r => r && !r.ok && !r.notFound);
  total += rows.length;

  let progress = '';
  try {
    const p = JSON.parse(fs.readFileSync(P.progress(key), 'utf8'));
    progress = ` | 当前 ${p.done || 0}/${p.total || 0}，最后 ${p.last || '-'}`;
  } catch {}

  console.log(`\n[${pf.label}] 记录 ${rows.length}，命中 ${ok.length}，未命中 ${miss.length}，异常 ${err.length}${progress}`);
  const examples = [];
  for (const rec of ok) {
    for (const job of (rec.jobs || [])) {
      examples.push(`${rec.n} -> ${job.jobName || '-'} | ${job.city || '-'} | ${job.salary || '-'}`);
      if (examples.length >= sample) break;
    }
    if (examples.length >= sample) break;
  }
  if (examples.length) examples.forEach((line, i) => console.log(`  ${i + 1}. ${line}`));
  else console.log('  暂无命中样本');
}

if (!total) console.log('\n还没有抓取记录。先完成登录，再准备 companies.json 和 config.json 后运行 run.js。');
