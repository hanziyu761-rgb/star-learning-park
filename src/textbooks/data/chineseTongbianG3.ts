/**
 * 统编版语文三年级上、下册（根据 2022 年版课程标准修订）目录——已核实（V4.0 第一批）。
 * 来源：国家中小学智慧教育平台 电子课本目录页，由 APP 所有者 2026-11-07 截图提供，逐条录入（单元、课题、页码、略读课文 *）。
 * 单元与旧版题库单元按内容对应（见 bankUnitIds），不是教材内容。
 */
import type { SourceRef } from '../types';
import { build, G1_CHECKED } from './chineseTongbianG1';

export const SRC_G3A: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 三年级上册 电子课本 目录页（共 123 页，目录在第 4～5 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供。第七单元《古诗三首》第三首（饮湖上初晴后雨 85）由补充截图核对。目录页说明：标*的是略读课文；第三单元是阅读策略单元，第五单元是习作单元。',
};
export const SRC_G3B: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 三年级下册 电子课本 目录页（共 126 页，目录在第 4～5 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供。目录页说明：标*的是略读课文；第五单元是习作单元。',
};

export const G3A_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g3a-u1'], rows: [[1, '大青树下的小学', 2], [2, '花的学校', 5], ['3*', '不懂就要问', 7], [null, '口语交际 我的暑假生活', 9], [null, '习作 猜猜他是谁', 10], [null, '语文园地', 11]] },
    { order: 2, title: '第二单元', page: 13, kind: 'text', bank: ['chinese-g3a-u2'], rows: [[4, '古诗三首', 14, 'text', ['望洞庭', '山行', '夜书所见']], [5, '铺满金色巴掌的水泥道', 16], [6, '秋天的雨', 19], ['7*', '听听，秋的声音', 22], [null, '习作 写日记', 24], [null, '语文园地', 25]] },
    { order: 3, title: '第三单元', page: 27, note: '阅读策略单元', kind: 'text', bank: ['chinese-g3a-u4'], rows: [[8, '总也倒不了的老屋', 28], ['9*', '犟龟', 32], ['10*', '小狗学叫', 36], [null, '口语交际 名字里的故事', 41], [null, '习作 续写故事', 42], [null, '语文园地', 43]] },
    { order: 4, title: '第四单元', page: 45, kind: 'text', bank: ['chinese-g3a-u3'], rows: [[11, '宝葫芦的秘密（节选）', 46], [12, '在牛肚子里旅行', 49], ['13*', '一块奶酪', 52], [null, '习作 我来编童话', 54], [null, '语文园地', 55], [null, '快乐读书吧 在那奇妙的王国里', 57]] },
    { order: 5, title: '第五单元', page: 59, note: '习作单元', kind: 'text', bank: ['chinese-g3a-u5'], rows: [[14, '搭船的鸟', 60], [15, '金色的草地', 62], [null, '习作 我们眼中的缤纷世界', 65], [null, '习作例文', 66, 'example', ['我家的小狗', '我爱故乡的杨梅']]] },
    { order: 6, title: '第六单元', page: 69, kind: 'text', bank: ['chinese-g3a-u6'], rows: [[16, '富饶的西沙群岛', 70], [17, '海滨小城', 73], [18, '美丽的小兴安岭', 75], ['19*', '香港，璀璨的明珠', 78], [null, '习作 这儿真美', 80], [null, '语文园地', 81]] },
    { order: 7, title: '第七单元', page: 83, kind: 'text', bank: ['chinese-g3a-u7'], rows: [[20, '古诗三首', 84, 'text', ['鹿柴', '望天门山', '饮湖上初晴后雨']], [21, '大自然的声音', 86], [22, '读不完的大书', 89], [null, '口语交际 身边的“小事”', 91], [null, '习作 我有一个想法', 92], [null, '语文园地', 93]] },
    { order: 8, title: '第八单元', page: 95, kind: 'text', bank: ['chinese-g3a-u8'], rows: [[23, '司马光', 96], [24, '一定要争气', 97], [25, '手术台就是阵地', 100], ['26*', '一个粗瓷大碗', 103], [null, '口语交际 请教', 105], [null, '习作 那次经历真难忘', 106], [null, '语文园地', 107]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 109], [null, '写字表', 112], [null, '词语表', 114]] },
  ]);

export const G3B_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g3b-u1'], rows: [[1, '古诗三首', 2, 'text', ['绝句', '惠崇春江晚景', '三衢道中']], [2, '燕子', 4], [3, '荷花', 6], ['4*', '昆虫备忘录', 8], [null, '口语交际 春游去哪里', 11], [null, '习作 我的植物朋友', 12], [null, '语文园地', 13]] },
    { order: 2, title: '第二单元', page: 15, kind: 'text', bank: ['chinese-g3b-u2'], rows: [[5, '守株待兔', 16], [6, '会摇尾巴的狼', 18], [7, '鹿角和鹿腿', 21], ['8*', '池子与河流', 23], [null, '口语交际 劝告', 27], [null, '习作 看图画，写一写', 28], [null, '语文园地', 29], [null, '快乐读书吧 小故事大道理', 31]] },
    { order: 3, title: '第三单元', page: 33, kind: 'text', bank: ['chinese-g3b-u4'], rows: [[9, '海底世界', 34], [10, '石蜂', 36], ['11*', '小虾', 38], [null, '习作 我做了一项小实验', 40], [null, '语文园地', 41]] },
    { order: 4, title: '第四单元', page: 43, kind: 'text', bank: ['chinese-g3b-u3'], rows: [[12, '古诗三首', 44, 'text', ['元日', '清明', '九月九日忆山东兄弟']], [13, '纸的发明', 47], [14, '赵州桥', 50], ['15*', '一幅名扬中外的画', 52], [null, '专题学习活动 中华传统节日', 54, 'other'], [null, '语文园地', 55]] },
    { order: 5, title: '第五单元', page: 57, note: '习作单元', kind: 'text', bank: ['chinese-g3b-u5'], rows: [[16, '胡萝卜先生的长胡子', 58], [17, '我变成了一棵树', 61], [null, '习作 奇妙的想象', 65], [null, '习作例文', 66, 'example', ['一支铅笔的梦想', '尾巴它有一只猫']]] },
    { order: 6, title: '第六单元', page: 69, kind: 'text', bank: ['chinese-g3b-u6'], rows: [[18, '童年的水墨画', 70], [19, '肥皂泡', 72], [20, '灰雀', 75], ['21*', '我不能失信', 77], [null, '口语交际 应该怎样安排座位', 79], [null, '习作 身边那些有特点的人', 80], [null, '语文园地', 81]] },
    { order: 7, title: '第七单元', page: 83, kind: 'text', bank: ['chinese-g3b-u7'], rows: [[22, '火烧云', 84], [23, '暴风雨来临之前', 87], [24, '我们奇妙的世界', 89], [null, '习作 国宝大熊猫', 92], [null, '语文园地', 93]] },
    { order: 8, title: '第八单元', page: 95, kind: 'text', bank: ['chinese-g3b-u8'], rows: [[25, '慢性子裁缝和急性子顾客', 96], [26, '漏', 100], ['27*', '枣核', 104], [null, '口语交际 趣味故事会', 107], [null, '习作 这样想象真有趣', 108], [null, '语文园地', 109]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 111], [null, '写字表', 114], [null, '词语表', 116]] },
  ]);
