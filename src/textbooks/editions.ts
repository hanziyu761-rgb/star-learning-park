/**
 * 教材版本清单（V4.0）：用户需求中列出的全部候选版本。
 * 这里只登记“有这套教材候选”，状态、版次、适用地区都要有来源才写；没有来源的一律 unknown（待核实）。
 * 同一套教材的不同叫法写进 aliases，validate() 会检查不能重复登记。
 */
import type { Edition, SourceRef } from './types';

export const CHECKED = '2026-11-07';

export const SRC_ROLLOUT: SourceRef = {
  title: '川观新闻（四川日报）《2026年秋季中小学教材全面改版！小学四五六、初中九年级影响较大！》',
  url: 'https://cbgc.scol.com.cn/news/7858849',
  kind: 'secondary',
  checkedAt: CHECKED,
  note: '报道：2024 秋小学一年级、2025 秋二三年级启用新修订教材；2026 秋小学语文、数学四至六年级，英语五六年级换用新教材。报道未列出各地所用版本（举例江苏：语文统编、数学苏教、英语译林）。',
};

const pending = (note: string) => ({ status: 'unknown' as const, statusNote: note, sources: [] as SourceRef[] });
const NOTE_ZH_OTHER =
  '待核实：一般认为义务教育语文已全国统一使用统编教材，此版本应为历史版本；停用时间和是否还有地区使用，需官方来源核实后再写。';

export const EDITIONS: Edition[] = [
  /* ───── 语文 ───── */
  {
    id: 'chinese.tongbian',
    subject: 'chinese',
    name: '统编版',
    aliases: ['部编版', '部编人教版', '人教统编版', '统编版（人教社）'],
    publisher: '人民教育出版社',
    priority: 1,
    status: 'current',
    statusNote: '2026 秋起小学一至六年级（上册）均使用根据 2022 年版课程标准修订的统编教材；四至六年级下册修订版预计 2027 春启用（推算，待核实）。',
    sources: [SRC_ROLLOUT],
  },
  {
    id: 'chinese.pep-legacy',
    subject: 'chinese',
    name: '人教版（课标实验教科书，统编版之前）',
    aliases: ['人教版语文（旧）'],
    publisher: '人民教育出版社',
    priority: 2,
    ...pending(`现行“人教版语文”即统编版，不重复登记；这里只指统编版之前的人教版课标实验教科书。${NOTE_ZH_OTHER}`),
  },
  { id: 'chinese.bsd', subject: 'chinese', name: '北师大版', aliases: [], publisher: '北京师范大学出版社', priority: 2, ...pending(NOTE_ZH_OTHER) },
  { id: 'chinese.sujiao', subject: 'chinese', name: '苏教版', aliases: [], publisher: '江苏凤凰教育出版社', priority: 2, ...pending(NOTE_ZH_OTHER) },
  { id: 'chinese.beijing', subject: 'chinese', name: '北京版', aliases: [], publisher: '北京出版社', priority: 2, ...pending(NOTE_ZH_OTHER) },
  { id: 'chinese.hujiao', subject: 'chinese', name: '沪教版', aliases: [], publisher: '上海教育出版社', priority: 2, ...pending(NOTE_ZH_OTHER) },

  /* ───── 数学 ───── */
  {
    id: 'math.pep',
    subject: 'math',
    name: '人教版',
    aliases: ['人教版数学'],
    publisher: '人民教育出版社',
    priority: 1,
    status: 'current',
    statusNote: '国家中小学智慧教育平台提供人教版小学数学修订版（一～三年级上下册、四五年级上册已核对目录；四五年级下册平台现为未修订版）；各地是否选用以当地为准。现有题库按旧版（2012 版）单元整理。',
    sources: [
      {
        title: '国家中小学智慧教育平台 人教版小学数学（根据2022年版课程标准修订）电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: CHECKED,
        note: 'APP 所有者登录平台查看并截图一～五年级目录页。',
      },
    ],
  },
  { id: 'math.bsd', subject: 'math', name: '北师大版', aliases: [], publisher: '北京师范大学出版社', priority: 1, ...pending('第三批核实。') },
  {
    id: 'math.sujiao',
    subject: 'math',
    name: '苏教版',
    aliases: [],
    publisher: '江苏凤凰教育出版社',
    priority: 2,
    status: 'current',
    statusNote: '江苏小学数学使用苏教版（报道举例）；各册版次待核实。',
    sources: [SRC_ROLLOUT],
  },
  { id: 'math.jijiao', subject: 'math', name: '冀教版', aliases: [], publisher: '河北教育出版社', priority: 2, ...pending('第四批核实。') },
  { id: 'math.qingdao', subject: 'math', name: '青岛版', aliases: [], publisher: '青岛出版社', priority: 2, ...pending('第四批核实（注意有六三制、五四制两套）。') },
  { id: 'math.xishi', subject: 'math', name: '西师版', aliases: ['西师大版'], publisher: '西南大学出版社', priority: 2, ...pending('第四批核实。') },
  { id: 'math.beijing', subject: 'math', name: '北京版', aliases: [], publisher: '北京出版社', priority: 2, ...pending('第四批核实。') },
  { id: 'math.hujiao', subject: 'math', name: '沪教版', aliases: [], publisher: '上海教育出版社', priority: 2, ...pending('第四批核实（上海为五四学制）。') },

  /* ───── 英语 ───── */
  {
    id: 'english.pep',
    subject: 'english',
    name: '人教PEP版',
    aliases: ['PEP', '人教版英语（三年级起点）'],
    publisher: '人民教育出版社',
    priority: 1,
    ...pending('现有题库按旧版（2012 版）单元整理；2026 秋起五、六年级英语换用修订版（报道），三、四年级修订版启用时间待核实。'),
  },
  {
    id: 'english.fltrp',
    subject: 'english',
    name: '外研版（新标准）',
    aliases: ['外研社版', '新标准英语'],
    publisher: '外语教学与研究出版社',
    priority: 1,
    ...pending('第五批核实（注意有一年级起点、三年级起点两套）。'),
  },
  {
    id: 'english.yilin',
    subject: 'english',
    name: '译林版',
    aliases: ['牛津译林版'],
    publisher: '译林出版社',
    priority: 1,
    status: 'current',
    statusNote: '江苏英语使用译林版（报道举例）；各册版次待核实。',
    sources: [SRC_ROLLOUT],
  },
  { id: 'english.bsd', subject: 'english', name: '北师大版', aliases: [], publisher: '北京师范大学出版社', priority: 2, ...pending('第五批核实。') },
  { id: 'english.hujiao', subject: 'english', name: '沪教版', aliases: ['牛津上海版'], publisher: '上海教育出版社', priority: 2, ...pending('第五批核实。') },
  { id: 'english.jijiao', subject: 'english', name: '冀教版', aliases: [], publisher: '河北教育出版社', priority: 2, ...pending('第五批核实。') },
  { id: 'english.xiangshao', subject: 'english', name: '湘少版', aliases: [], publisher: '湖南少年儿童出版社', priority: 2, ...pending('第五批核实。') },
];

export const EDITION_BY_ID: Record<string, Edition> = Object.fromEntries(EDITIONS.map((e) => [e.id, e]));
