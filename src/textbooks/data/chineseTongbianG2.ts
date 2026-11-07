/**
 * 统编版语文二年级上、下册（根据 2022 年版课程标准修订）目录——已核实（V4.0 第一批）。
 * 来源：国家中小学智慧教育平台 电子课本目录页，由 APP 所有者 2026-11-07 截图提供，逐条录入（单元名、课题名、页码）。
 * 单元与旧版题库单元按内容一一对应（见 bankUnitIds），不是教材内容。
 */
import type { SourceRef } from '../types';
import { build, G1_CHECKED } from './chineseTongbianG1';

export const SRC_G2A: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 二年级上册 电子课本 目录页（共 126 页，目录在第 4～5 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供；目录两页完整（从“目录”标题到“词语表”）。',
};
export const SRC_G2B: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 二年级下册 电子课本 目录页（共 130 页，目录在第 4～5 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供；截图从“第一单元”开始，到“词语表”结束。',
};

export const G2A_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元·阅读', kind: 'text', bank: ['chinese-g2a-u1'], rows: [[1, '小蝌蚪找妈妈', 1], [2, '我是什么', 5], [3, '植物妈妈有办法', 8], [null, '语文园地一', 11], [null, '快乐读书吧 读读童话故事', 15]] },
    { order: 2, title: '第二单元·识字', kind: 'literacy', bank: ['chinese-g2a-u2'], rows: [[1, '场景歌', 16], [2, '树之歌', 18], [3, '拍手歌', 20], [4, '田家四季歌', 23], [null, '语文园地二', 25]] },
    { order: 3, title: '第三单元·阅读', kind: 'text', bank: ['chinese-g2a-u3'], rows: [[4, '彩虹', 28], [5, '去外婆家', 30], [6, '数星星的孩子', 32], [null, '语文园地三', 35]] },
    { order: 4, title: '第四单元·阅读', kind: 'text', bank: ['chinese-g2a-u4'], rows: [[7, '古诗二首', 39, 'text', ['登鹳雀楼', '望庐山瀑布']], [8, '黄山奇石', 42], [9, '日月潭', 45], [10, '葡萄沟', 47], [null, '语文园地四', 50]] },
    { order: 5, title: '第五单元·阅读', kind: 'text', bank: ['chinese-g2a-u5'], rows: [[11, '坐井观天', 54], [12, '寒号鸟', 56], [13, '我要的是葫芦', 60], [null, '语文园地五', 63]] },
    { order: 6, title: '第六单元·阅读', kind: 'text', bank: ['chinese-g2a-u6'], rows: [[14, '八角楼上', 67], [15, '朱德的扁担', 69], [16, '难忘的泼水节', 72], [17, '刘胡兰', 75], [null, '语文园地六', 78]] },
    { order: 7, title: '第七单元·阅读', kind: 'text', bank: ['chinese-g2a-u7'], rows: [[18, '古诗二首', 81, 'text', ['江雪', '敕勒歌']], [19, '雾在哪里', 84], [20, '雪孩子', 87], [null, '语文园地七', 91]] },
    { order: 8, title: '第八单元·阅读', kind: 'text', bank: ['chinese-g2a-u8'], rows: [[21, '称赞', 95], [22, '纸船和风筝', 98], [23, '快乐的小河', 101], [null, '语文园地八', 104]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 108], [null, '写字表', 113], [null, '词语表', 116]] },
  ]);

export const G2B_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元·阅读', kind: 'text', bank: ['chinese-g2b-u1'], rows: [[1, '古诗二首', 1, 'text', ['咏柳', '村居']], [2, '找春天', 4], [3, '开满鲜花的小路', 6], [4, '邓小平爷爷植树', 9], [null, '语文园地一', 11]] },
    { order: 2, title: '第二单元·阅读', kind: 'text', bank: ['chinese-g2b-u2'], rows: [[5, '雷锋叔叔，你在哪里', 15], [6, '千人糕', 18], [7, '我不是最弱小的', 21], [null, '语文园地二', 24], [null, '快乐读书吧 读读儿童故事', 28]] },
    { order: 3, title: '第三单元·识字', kind: 'literacy', bank: ['chinese-g2b-u3'], rows: [[1, '神州谣', 29], [2, '传统节日', 31], [3, '“贝”的故事', 33], [4, '中国美食', 35], [null, '语文园地三', 37]] },
    { order: 4, title: '第四单元·阅读', kind: 'text', bank: ['chinese-g2b-u4'], rows: [[8, '彩色的梦', 42], [9, '一匹出色的马', 45], [10, '枫树上的喜鹊', 48], [null, '语文园地四', 51]] },
    { order: 5, title: '第五单元·阅读', kind: 'text', bank: ['chinese-g2b-u5'], rows: [[11, '寓言二则', 55, 'text', ['亡羊补牢', '揠苗助长']], [12, '画杨桃', 58], [13, '小马过河', 61], [null, '语文园地五', 65]] },
    { order: 6, title: '第六单元·阅读', kind: 'text', bank: ['chinese-g2b-u6'], rows: [[14, '古诗二首', 69, 'text', ['绝句', '晓出净慈寺送林子方']], [15, '雷雨', 72], [16, '要是你在野外迷了路', 74], [17, '太空生活趣事多', 77], [null, '语文园地六', 79]] },
    { order: 7, title: '第七单元·阅读', kind: 'text', bank: ['chinese-g2b-u7'], rows: [[18, '大象的耳朵', 84], [19, '蜘蛛开店', 87], [20, '青蛙卖泥塘', 90], [21, '小毛虫', 94], [null, '语文园地七', 97]] },
    { order: 8, title: '第八单元·阅读', kind: 'text', bank: ['chinese-g2b-u8'], rows: [[22, '羿射九日', 100], [23, '黄帝的传说', 103], [24, '大禹治水', 106], [null, '语文园地八', 109]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 113], [null, '写字表', 117], [null, '词语表', 120]] },
  ]);
