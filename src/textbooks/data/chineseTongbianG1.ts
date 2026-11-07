/**
 * 统编版语文一年级上、下册（根据 2022 年版课程标准修订）目录——已核实（V4.0 第一批）。
 *
 * 来源：国家中小学智慧教育平台 电子课本目录页（页眉“人民教育出版社”），由 APP 所有者 2026-11-07 截图提供，逐条录入。
 * 只录单元名、课题名和页码；课文正文、插图、习题版权归人民教育出版社，不复制。
 * 单元关联的知识点、题库单元是本项目按内容对应的（不是教材内容），见 bankUnitIds / kpIds。
 */
import { UNIT_TO_KP } from '@/knowledge/graph';
import type { LessonEntry, SourceRef, Unit } from '../types';

export const G1_CHECKED = '2026-11-07';

export const SRC_G1A: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 一年级上册 电子课本 目录页（共 118 页，目录在第 4～6 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供；逐条核对单元名、课题名、页码。截图最后一行“写字表”页码被截断，其后的附录未录入。',
};
export const SRC_G1B: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 一年级下册 电子课本 目录页（共 127 页，目录在第 4～6 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供；逐条核对单元名、课题名、页码。截图从“第一单元”开始，其上方若有内容未录入。',
};

export type Row = [no: number | null, title: string, page: number, kind?: LessonEntry['kind'], parts?: string[]];
export interface U {
  order: number;
  title: string;
  kind: LessonEntry['kind'];
  rows: Row[];
  bank: string[];
}

export function build(volId: string, units: U[]): Unit[] {
  return units.map((u) => {
    const uid = `${volId}.u${u.order}`;
    const lessons: LessonEntry[] = u.rows.map(([no, title, page, kind, parts], i) => ({
      id: `${uid}.l${i + 1}`,
      order: i + 1,
      ...(no ? { no } : {}),
      title,
      kind: kind ?? (title.startsWith('语文园地') ? 'garden' : title.startsWith('快乐读书吧') ? 'reading' : u.kind),
      ...(parts ? { parts } : {}),
      page,
      provenance: 'verified' as const,
    }));
    const kpIds = [...new Set(u.bank.map((b) => UNIT_TO_KP[b]).filter(Boolean))];
    return { id: uid, order: u.order, title: u.title, provenance: 'verified' as const, lessons, kpIds, bankUnitIds: u.bank };
  });
}

/** 一年级上册：开篇“我上学了” + 八个单元 + 识字表等附录 */
export const G1A_UNITS = (volId: string) =>
  build(volId, [
    { order: 0, title: '我上学了', kind: 'other', bank: ['chinese-g1a-u1'], rows: [[null, '我是中国人', 2], [null, '我爱我们的祖国', 4], [null, '我是小学生', 6], [null, '我爱学语文', 7]] },
    { order: 1, title: '第一单元·识字', kind: 'literacy', bank: ['chinese-g1a-u2'], rows: [[1, '天地人', 8], [2, '金木水火土', 9], [3, '口耳目手足', 11], [4, '日月山川', 13], [null, '语文园地一', 15], [null, '快乐读书吧 读书真快乐', 19]] },
    { order: 2, title: '第二单元·汉语拼音', kind: 'pinyin', bank: ['chinese-g1a-u3'], rows: [[1, 'ɑ o e', 20], [2, 'i u ü', 22], [3, 'b p m f', 24], [4, 'd t n l', 26], [null, '语文园地二', 28]] },
    { order: 3, title: '第三单元·汉语拼音', kind: 'pinyin', bank: ['chinese-g1a-u3'], rows: [[5, 'g k h', 32], [6, 'j q x', 34], [7, 'z c s', 36], [8, 'zh ch sh r', 38], [9, 'y w', 40], [null, '语文园地三', 42]] },
    { order: 4, title: '第四单元·汉语拼音', kind: 'pinyin', bank: ['chinese-g1a-u4'], rows: [[10, 'ai ei ui', 45], [11, 'ao ou iu', 47], [12, 'ie üe er', 49], [13, 'an en in un ün', 51], [14, 'ang eng ing ong', 54], [null, '语文园地四', 56]] },
    { order: 5, title: '第五单元·阅读', kind: 'text', bank: ['chinese-g1a-u5'], rows: [[1, '秋天', 60], [2, '江南', 62], [3, '雪地里的小画家', 64], [4, '四季', 66], [null, '语文园地五', 68]] },
    { order: 6, title: '第六单元·识字', kind: 'literacy', bank: ['chinese-g1a-u6'], rows: [[5, '对韵歌', 73], [6, '日月明', 74], [7, '小书包', 76], [8, '升国旗', 78], [null, '语文园地六', 80]] },
    { order: 7, title: '第七单元·阅读', kind: 'text', bank: ['chinese-g1a-u7'], rows: [[5, '小小的船', 84], [6, '影子', 86], [7, '两件宝', 88], [null, '语文园地七', 90]] },
    { order: 8, title: '第八单元·阅读', kind: 'text', bank: ['chinese-g1a-u7'], rows: [[8, '比尾巴', 95], [9, '乌鸦喝水', 97], [10, '雨点儿', 99], [null, '语文园地八', 101]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 105]] },
  ]);

/** 一年级下册：八个单元 + 附录 */
export const G1B_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元·识字', kind: 'literacy', bank: ['chinese-g1b-u1'], rows: [[1, '春夏秋冬', 2], [2, '姓氏歌', 4], [3, '小青蛙', 6], [4, '猜字谜', 8], [null, '语文园地一', 10], [null, '快乐读书吧 读读童谣和儿歌', 15]] },
    { order: 2, title: '第二单元·阅读', kind: 'text', bank: ['chinese-g1b-u2'], rows: [[1, '热爱中国共产党', 16], [2, '吃水不忘挖井人', 18], [3, '我多想去看看', 20], [null, '语文园地二', 22]] },
    { order: 3, title: '第三单元·阅读', kind: 'text', bank: ['chinese-g1b-u3'], rows: [[4, '小公鸡和小鸭子', 26], [5, '树和喜鹊', 29], [6, '怎么都快乐', 31], [null, '语文园地三', 34]] },
    { order: 4, title: '第四单元·阅读', kind: 'text', bank: ['chinese-g1b-u4'], rows: [[7, '静夜思', 39], [8, '夜色', 40], [9, '端午粽', 42], [null, '语文园地四', 44]] },
    { order: 5, title: '第五单元·识字', kind: 'literacy', bank: ['chinese-g1b-u5'], rows: [[5, '动物儿歌', 48], [6, '古对今', 50], [7, '操场上', 52], [8, '人之初', 54], [null, '语文园地五', 56]] },
    { order: 6, title: '第六单元·阅读', kind: 'text', bank: ['chinese-g1b-u6'], rows: [[10, '古诗二首', 61, 'text', ['池上', '小池']], [11, '浪花', 64], [12, '荷叶圆圆', 66], [13, '要下雨了', 69], [null, '语文园地六', 73]] },
    { order: 7, title: '第七单元·阅读', kind: 'text', bank: ['chinese-g1b-u7'], rows: [[14, '文具的家', 78], [15, '一分钟', 81], [16, '动物王国开大会', 84], [17, '小猴子下山', 90], [null, '语文园地七', 93]] },
    { order: 8, title: '第八单元·阅读', kind: 'text', bank: ['chinese-g1b-u8'], rows: [[18, '棉花姑娘', 98], [19, '咕咚', 102], [20, '小壁虎借尾巴', 105], [null, '语文园地八', 109]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 114], [null, '写字表', 117], [null, '常用偏旁名称表', 120]] },
  ]);
