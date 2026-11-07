/**
 * 教材数据导入（V4.0）：检查 JSON，通过后写入 src/textbooks/data/imported/ 并更新清单。
 * 用法：TEXTBOOK_JSON=路径1.json,路径2.json npx jest --testMatch '<rootDir>/tools/textbooks/*.review.ts'
 * 加 DRY_RUN=1 只检查不写入。
 * 检查内容：必填字段、学科与版本一致、年级册次、编号唯一且层级正确（册 → 单元 → 课时）、顺序号、
 * “已核实”必须有官方来源和核对日期、同一册不能登记两次、版本名称查重。
 */
import fs from 'fs';
import path from 'path';
import { allVolumes, validateAll } from '@/textbooks/registry';
import type { Volume } from '@/textbooks/types';

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'src/textbooks/data/imported');

it('导入教材 JSON', () => {
  const files = (process.env.TEXTBOOK_JSON ?? '').split(',').filter(Boolean);
  if (!files.length) throw new Error('请用 TEXTBOOK_JSON 指定要导入的文件');
  const incoming: Volume[] = files.map((f: string) => {
    const v = JSON.parse(fs.readFileSync(f, 'utf8')) as Volume & { _说明?: string };
    delete v._说明;
    return v;
  });
  // 同 id 的视为更新（替换旧数据）
  const ids = new Set(incoming.map((v) => v.id));
  const merged = [...allVolumes().filter((v) => !ids.has(v.id)), ...incoming];
  const problems = validateAll(merged).filter((p) => p.level === 'error');
  if (problems.length) {
    console.log(problems.map((p) => `✗ ${p.where}：${p.msg}`).join('\n'));
    throw new Error(`检查没通过：${problems.length} 个问题，未导入`);
  }
  if (process.env.DRY_RUN) {
    console.log(`检查通过（DRY_RUN，未写入）：${incoming.map((v) => v.id).join('、')}`);
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const v of incoming) fs.writeFileSync(path.join(OUT, `${v.id}.json`), JSON.stringify(v, null, 1) + '\n');
  const all = fs.readdirSync(OUT).filter((f) => f.endsWith('.json')).sort();
  const lines = [
    '// 自动生成：tools/textbooks/import.review.ts。通过检查后导入的教材数据（JSON），请勿手改。',
    "import type { Volume } from '../../types';",
    '',
    ...all.map((f, i) => `import v${i} from './${f}';`),
    '',
    `export const IMPORTED: Volume[] = [${all.map((_, i) => `v${i} as Volume`).join(', ')}];`,
    '',
  ];
  fs.writeFileSync(path.join(OUT, 'index.ts'), lines.join('\n'));
  console.log(`已导入：${incoming.map((v) => v.id).join('、')}（共 ${all.length} 册导入数据）`);
});
