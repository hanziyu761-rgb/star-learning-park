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
  '国家中小学智慧教育平台“小学 → 语文”下只有统编版（2026-11-09 查看平台版本列表），这一版本没有官方电子课本可核对目录。一般认为义务教育语文已全国统一使用统编教材，此版本应为历史版本；停用时间和是否还有地区使用，需官方来源核实后再写。';

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
    statusNote: '国家中小学智慧教育平台提供人教版小学数学修订版（一～三年级上下册、四～六年级上册已核对目录；四～六年级下册平台现为未修订版）；各地是否选用以当地为准。现有题库按旧版（2012 版）单元整理。',
    sources: [
      {
        title: '国家中小学智慧教育平台 人教版小学数学（根据2022年版课程标准修订）电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: CHECKED,
        note: 'APP 所有者登录平台查看并截图一～六年级目录页。',
      },
    ],
  },
  {
    id: 'math.bsd',
    subject: 'math',
    name: '北师大版',
    aliases: ['北师版'],
    publisher: '北京师范大学出版社',
    priority: 1,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供北师大版小学数学修订版电子课本（第三批已核对：一～三年级上下册、四～六年级上册修订版；平台现有四～六年级下册为未修订版，另行登记）；修订版各册启用时间和使用地区待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 北师大版小学数学（根据2022年版课程标准修订）电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: CHECKED,
        note: 'APP 所有者登录平台查看并截图目录页；页面显示出版社“北京师范大学出版社”。',
      },
    ],
  },
  {
    id: 'math.sujiao',
    subject: 'math',
    name: '苏教版',
    aliases: [],
    publisher: '江苏凤凰教育出版社',
    priority: 2,
    status: 'current',
    statusNote: '江苏小学数学使用苏教版（报道举例）。国家中小学智慧教育平台提供苏教版修订版电子课本（第四批核对中：一～三年级上下册、四～六年级上册目录已核对；平台现有四～六年级下册为未修订版，另行登记，另行登记）；其余各册待核实。',
    sources: [
      SRC_ROLLOUT,
      {
        title: '国家中小学智慧教育平台 苏教版小学数学（根据2022年版课程标准修订）电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: CHECKED,
        note: 'APP 所有者登录平台选择“苏教版”后截图目录页；截图页面上没有显示出版社名称。',
      },
    ],
  },
  {
    id: 'math.jijiao',
    subject: 'math',
    name: '冀教版',
    aliases: [],
    publisher: '河北教育出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供冀教版小学数学电子课本（出版社：河北教育出版社）。第四批已核对：一～三年级上下册、四～六年级上册修订版；平台现有四～六年级下册为未修订版，另行登记。目录含小节，已一并录入。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 冀教版小学数学电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: CHECKED,
        note: '在 APP 所有者已登录的浏览器里逐册打开目录页查看并录入；教材详情页显示出版社“河北教育出版社”。',
      },
    ],
  },
  {
    id: 'math.qingdao',
    subject: 'math',
    name: '青岛版',
    aliases: [],
    publisher: '青岛出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供青岛版小学数学电子课本 12 册（六三学制；平台没有单独列出五四学制）。已核对：一～六年级上册、一～三年级下册修订版；四～六年级下册平台现有为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 青岛版小学数学电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照目录页录入。',
      },
    ],
  },
  {
    id: 'math.xishi',
    subject: 'math',
    name: '西师版',
    aliases: ['西师大版', '西南大学版'],
    publisher: '西南大学出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供西南大学版（西师版）小学数学电子课本 12 册。已核对：一～六年级上册、一～三年级下册修订版；四～六年级下册平台现有为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 西南大学版小学数学电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照目录页录入。',
      },
    ],
  },
  {
    id: 'math.beijing',
    subject: 'math',
    name: '北京版',
    aliases: [],
    publisher: '北京出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供北京版小学数学电子课本（出版社：北京出版社；北京教育科学研究院 编）。第四批已核对：一～三年级上下册、四～六年级上册修订版；平台现有四～六年级下册为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 北京版小学数学电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-08',
        note: '在 APP 所有者已登录的浏览器里逐册打开目录页查看并录入；教材详情页显示出版社“北京出版社”。',
      },
    ],
  },
  { id: 'math.hujiao', subject: 'math', name: '沪教版', aliases: [], publisher: '上海教育出版社', priority: 2, ...pending('国家中小学智慧教育平台“小学 → 数学”下没有沪教版（2026-11-09 查看平台版本列表），暂时无法按官方电子课本核对；上海为五四学制。') },

  /* ───── 英语 ───── */
  {
    id: 'english.pep',
    subject: 'english',
    name: '人教PEP版',
    aliases: ['PEP', '人教版英语（三年级起点）'],
    publisher: '人民教育出版社',
    priority: 1,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供人教版（主编：吴欣）小学英语电子课本，书名页印“英语（PEP）”。第五批已核对：三～四年级上下册、五～六年级上册修订版；平台现有五、六年级下册为未修订版，另行登记。现有题库按旧版（2012 版）单元整理，只与未修订版五、六年级下册单元名一致。',
    sources: [
      {
        title: '国家中小学智慧教育平台 人教版（主编：吴欣）小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-08',
        note: '在 APP 所有者已登录的浏览器里逐册打开 Contents 页查看并录入；教材详情页显示出版社“人民教育出版社”。',
      },
      SRC_ROLLOUT,
    ],
  },
  {
    id: 'english.fltrp',
    subject: 'english',
    name: '外研版（新标准）',
    aliases: ['外研社版', '新标准英语'],
    publisher: '外语教学与研究出版社',
    priority: 1,
    status: 'unknown',
    statusNote: '本条目指国家中小学智慧教育平台上的“外研社版（主编：孙有中）”三年级起点修订版（外语教学与研究出版社）。第五批已核对平台列出的 7 册：三～五年级上下册、六年级上册；六年级下册平台尚未列出。平台另有“外研社版（主编：刘兆义）”“外研社版（主编：张祖春）”两套，是不同的书，另行登记。',
    sources: [
      {
        title: '国家中小学智慧教育平台 外研社版（主编：孙有中）小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-08',
        note: '在 APP 所有者已登录的浏览器里逐册打开 Contents 页查看并录入；教材详情页显示出版社“外语教学与研究出版社”。',
      },
    ],
  },
  {
    id: 'english.fltrp-liu',
    subject: 'english',
    name: '外研社版（刘兆义主编）',
    aliases: ['外研社版（主编：刘兆义）'],
    publisher: '外语教学与研究出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台“外研社版（主编：刘兆义）”小学英语电子课本，与孙有中主编的外研社版是不同的书。已核对 8 册：三～六年级上册、三～四年级下册修订版；五、六年级下册平台现有为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 外研社版（主编：刘兆义）小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照 Contents 页录入。',
      },
    ],
  },
  {
    id: 'english.fltrp-zhang',
    subject: 'english',
    name: '外研社版（张祖春主编）',
    aliases: ['外研社版（主编：张祖春）'],
    publisher: '外语教学与研究出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台“外研社版（主编：张祖春）”小学英语电子课本，与孙有中主编的外研社版是不同的书。平台目前列出 5 册（三～四年级上下册、五年级上册），已全部核对；其余册次平台尚未列出。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 外研社版（主编：张祖春）小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照 Contents 页录入。',
      },
    ],
  },
  {
    id: 'english.yilin',
    subject: 'english',
    name: '译林版',
    aliases: ['牛津译林版'],
    publisher: '译林出版社',
    priority: 1,
    status: 'current',
    statusNote: '江苏英语使用译林版（报道举例）。国家中小学智慧教育平台提供译林版小学英语电子课本，已核对 8 册：三～六年级上册、三～四年级下册修订版；五、六年级下册平台现有为未修订版，另行登记。',
    sources: [
      SRC_ROLLOUT,
      {
        title: '国家中小学智慧教育平台 译林版小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照 Contents 页录入。',
      },
    ],
  },
  {
    id: 'english.bsd',
    subject: 'english',
    name: '北师大版',
    aliases: [],
    publisher: '北京师范大学出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供北师大版小学英语（三年级起点）电子课本。已核对 8 册：三～六年级上册、三～四年级下册修订版；五、六年级下册平台现有为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 北师大版小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照 Contents 页录入。',
      },
    ],
  },
  {
    id: 'english.hujiao',
    subject: 'english',
    name: '沪教版',
    aliases: ['牛津上海版'],
    publisher: '上海教育出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供沪教版小学英语（三年级起点）电子课本。已核对 8 册：三～六年级上册、三～四年级下册修订版；五、六年级下册平台现有为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 沪教版小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照 Contents 页录入。',
      },
    ],
  },
  {
    id: 'english.jijiao',
    subject: 'english',
    name: '冀教版',
    aliases: [],
    publisher: '河北教育出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供冀教版小学英语（三年级起点）电子课本。已核对 8 册：三～六年级上册、三～四年级下册修订版；五、六年级下册平台现有为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 冀教版小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照 Contents 页录入。',
      },
    ],
  },
  {
    id: 'english.xiangshao',
    subject: 'english',
    name: '湘少版',
    aliases: [],
    publisher: '湖南少年儿童出版社',
    priority: 2,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供湘少版小学英语（三年级起点）电子课本。已核对 8 册：三～六年级上册、三～四年级下册修订版；五、六年级下册平台现有为未修订版，另行登记。各地选用情况待核实。',
    sources: [
      {
        title: '国家中小学智慧教育平台 湘少版小学英语电子课本',
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-09',
        note: '在 APP 所有者已登录的浏览器里查看平台电子课本页面，逐册对照 Contents 页录入。',
      },
    ],
  },
];

export const EDITION_BY_ID: Record<string, Edition> = Object.fromEntries(EDITIONS.map((e) => [e.id, e]));
