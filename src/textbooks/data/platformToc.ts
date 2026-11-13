/**
 * 第六批起通用：把对照国家中小学智慧教育平台电子课本目录页逐条录入的目录文本转成册次（V4.1）。
 *
 * 录入方式：2026-11-09 起，Claude 在 APP 所有者已登录的浏览器里打开平台教材列表，
 * 逐册查看电子课本的页面预览图（平台提供的同一份电子课本，图片编号 = 电子课本页序），找到目录页逐条录入。
 * 同一年级同一学期平台有多个“年度”版本时，取最新年度。
 *
 * 目录文本写法（每行一条，行尾是课本页码）：
 * - “单元名 页码”：单元、主题活动、综合与实践、总复习等，按目录原样
 * - “◎栏目名 页码”：目录里的小栏目（智慧广场、你知道吗、数学游戏等），没有单元序号
 * - 子标题用“——”连接，按目录原样，例如“一 快乐的课堂——1～5数的认识和加减法 7”
 * 只录单元名和页码；教材正文、插图、例题、习题版权归出版社，不复制。
 */
import type { SourceRef, Term, Unit, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export interface PlatformPlan {
  grade: number;
  term: Term;
  /** 未修订版：平台现有的是这一版（书名没有“根据2022年版课程标准修订”） */
  legacy?: boolean;
  /** 平台上的书名（核对用） */
  title: string;
  /** 目录在电子课本第几页，例如 “6～7” */
  tocPages: string;
  toc: string;
}

export interface PlatformEditionInfo {
  editionId: string;
  subject: Volume['subject'];
  /** 例如“青岛出版社” */
  publisher: string;
  /** 平台上的版本名，例如“青岛版”“西南大学版” */
  platformName: string;
  /** 科目中文名 */
  subjectName: string;
  checkedAt: string;
  /** 学段，不填是小学（V4.3 起有初中） */
  stage?: '小学' | '初中';
}

/** 把目录文本转成单元；格式不对直接报错（测试会发现） */
export function parsePlatformToc(volId: string, toc: string): Unit[] {
  const lines = toc.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!lines.length) throw new Error(`目录为空：${volId}`);
  return lines.map((raw, i) => {
    const m = raw.match(/^(◎)?(.+?) (\d+)$/);
    if (!m || !m[2].trim()) throw new Error(`目录行格式不对：${raw}`);
    return {
      id: `${volId}.u${i}`,
      order: i,
      title: m[2].trim(),
      page: Number(m[3]),
      ...(m[1] ? { note: '小栏目（目录上没有单元序号）' } : {}),
      provenance: 'verified' as const,
      lessons: [],
      kpIds: [],
      bankUnitIds: [],
    };
  });
}

function source(info: PlatformEditionInfo, p: PlatformPlan): SourceRef {
  return {
    title: `国家中小学智慧教育平台 ${p.title}（${info.publisher}）电子课本 目录页（第 ${p.tocPages} 页）`,
    url: 'https://basic.smartedu.cn/tchMaterial',
    kind: 'official',
    checkedAt: info.checkedAt,
    note: `在平台“教材 → ${info.stage ?? '小学'} → ${info.subjectName} → ${info.platformName}”下查看电子课本页面，逐条对照目录页录入（APP 所有者的已登录浏览器，Claude 查看）。`,
  };
}

export function buildPlatformVolumes(info: PlatformEditionInfo, plans: PlatformPlan[], copyright: string): Volume[] {
  return plans.map((p) => {
    const id = `${info.editionId}.${p.legacy ? 'legacy' : '2024'}.g${p.grade}${p.term === '上' ? 'a' : 'b'}`;
    return {
      id,
      editionId: info.editionId,
      subject: info.subject,
      grade: p.grade,
      term: p.term,
      officialName: p.legacy
        ? `义务教育教科书·${info.subjectName} ${CN[p.grade]}年级${p.term}册（未修订版）`
        : `（根据2022年版课程标准修订）义务教育教科书·${info.subjectName} ${CN[p.grade]}年级${p.term}册`,
      revision: p.legacy ? null : 2024,
      status: 'unknown',
      statusNote: p.legacy
        ? '国家中小学智慧教育平台目前提供的是这一版；修订版启用后会成为历史版本（启用时间待核实）。'
        : '国家中小学智慧教育平台提供这一册；修订版启用时间和使用地区待核实。',
      regions: [],
      tocProvenance: 'verified',
      sources: [source(info, p)],
      units: parsePlatformToc(id, p.toc),
      copyright,
    };
  });
}
