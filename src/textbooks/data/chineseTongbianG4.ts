/**
 * 统编版语文四年级（V4.0 第一批）——已核实目录：
 * - 四年级上册（根据 2022 年版课程标准修订）
 * - 四年级下册：平台目前提供的是未标注“根据2022年版课程标准修订”的版本（旧版），单独登记，不当作修订版
 * 来源：国家中小学智慧教育平台 电子课本目录页，由 APP 所有者 2026-11-07 截图提供，逐条录入。
 */
import type { SourceRef } from '../types';
import { build, G1_CHECKED } from './chineseTongbianG1';

export const SRC_G4A: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 四年级上册 电子课本 目录页（共 138 页，目录在第 4～5 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供（页面标注出版社：人民教育出版社）。第七单元开头（第七单元 87、20 牛和鹅 88）由补充截图核对。',
};
export const SRC_G4B_LEGACY: SourceRef = {
  title: '国家中小学智慧教育平台 义务教育教科书·语文 四年级下册 电子课本 目录页（共 151 页，目录在第 4～5 页；书名未标注“根据2022年版课程标准修订”）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供（页面标注出版社：人民教育出版社）。第六单元末行（语文园地 99）由补充截图核对。',
};

export const G4A_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g4a-u1'], rows: [[1, '观潮', 2], [2, '繁星', 5], ['3*', '现代诗二首', 7, 'text', ['秋晚的江上', '花牛歌']], [null, '口语交际 我们与环境', 9], [null, '习作 推荐一个好地方', 10], [null, '语文园地', 11]] },
    { order: 2, title: '第二单元', page: 13, kind: 'text', bank: ['chinese-g4a-u2'], rows: [[4, '一个豆荚里的五粒豆', 14], [5, '夜间飞行的秘密', 19], [6, '方帽子店', 23], ['7*', '田忌赛马', 28], [null, '习作 我的家人', 30], [null, '语文园地', 31]] },
    { order: 3, title: '第三单元', page: 33, kind: 'text', bank: ['chinese-g4a-u3'], rows: [[8, '古诗三首', 34, 'text', ['暮江吟', '题西林壁', '雪梅']], [9, '爬山虎的脚', 36], [10, '蟋蟀的住宅', 39], [null, '口语交际 爱护眼睛，保护视力', 43], [null, '习作 写观察日记', 44], [null, '语文园地', 45]] },
    { order: 4, title: '第四单元', page: 47, kind: 'text', bank: ['chinese-g4a-u4'], rows: [[11, '盘古开天地', 48], [12, '精卫填海', 50], [13, '普罗米修斯', 51], ['14*', '女娲补天', 54], [null, '习作 我和____过一天', 56], [null, '语文园地', 57], [null, '快乐读书吧 很久很久以前', 59]] },
    { order: 5, title: '第五单元', page: 61, kind: 'text', bank: ['chinese-g4a-u5'], rows: [[15, '麻雀', 62], [16, '爬天都峰', 65], [null, '习作 生活万花筒', 68], [null, '习作例文', 69, 'example', ['我家的杏熟了', '小木船']]] },
    { order: 6, title: '第六单元', page: 73, kind: 'text', bank: [], rows: [[17, '长城', 74], [18, '颐和园', 77], ['19*', '秦兵马俑', 80], [null, '口语交际 我是小小讲解员', 82], [null, '习作 中国的世界文化遗产', 83], [null, '语文园地', 84]] },
    { order: 7, title: '第七单元', page: 87, kind: 'text', bank: ['chinese-g4a-u6'], rows: [[20, '牛和鹅', 88], [21, '一只窝囊的大老虎', 93], ['22*', '陀螺', 98], [23, '王戎不取道旁李', 102], [null, '口语交际 安慰', 103], [null, '习作 我的心儿怦怦跳', 104], [null, '语文园地', 105]] },
    { order: 8, title: '第八单元', page: 107, kind: 'text', bank: ['chinese-g4a-u7'], rows: [[24, '我将无我，不负人民', 108], [25, '为中华之崛起而读书', 110], ['26*', '延安，我把你追寻', 115], [27, '古诗三首', 117, 'text', ['凉州词', '出塞', '夏日绝句']], [null, '习作 写信', 119], [null, '语文园地', 120]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 122], [null, '写字表', 125], [null, '词语表', 127]] },
  ]);

export const G4B_LEGACY_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g4b-u1'], rows: [[1, '古诗词三首', 2, 'text', ['四时田园杂兴（其二十五）', '宿新市徐公店', '清平乐·村居']], [2, '乡下人家', 4], [3, '天窗', 7], ['4*', '三月桃花水', 10], [null, '口语交际：转述', 11], [null, '习作：我的乐园', 12], [null, '语文园地', 13]] },
    { order: 2, title: '第二单元', page: 15, kind: 'text', bank: ['chinese-g4b-u2'], rows: [[5, '琥珀', 16], [6, '飞向蓝天的恐龙', 20], [7, '纳米技术就在我们身边', 24], ['8*', '千年梦圆在今朝', 26], [null, '口语交际：说新闻', 29], [null, '习作：我的奇思妙想', 30], [null, '语文园地', 31], [null, '快乐读书吧：探索科学的奥秘', 33]] },
    { order: 3, title: '第三单元', page: 35, kind: 'text', bank: ['chinese-g4b-u3'], rows: [[9, '短诗三首', 36, 'text', ['繁星（七一）', '繁星（一三一）', '繁星（一五九）']], [10, '绿', 38], [11, '白桦', 40], ['12*', '在天晴了的时候', 42], [null, '综合性学习：轻叩诗歌大门', 44, 'other'], [null, '语文园地', 45]] },
    { order: 4, title: '第四单元', page: 47, kind: 'text', bank: ['chinese-g4b-u4'], rows: [[13, '猫', 48], [14, '母鸡', 51], [15, '白鹅', 54], [null, '习作：我的动物朋友', 59], [null, '语文园地', 60]] },
    { order: 5, title: '第五单元', page: 63, kind: 'text', bank: ['chinese-g4b-u5'], rows: [[16, '海上日出', 64], [17, '记金华的双龙洞', 66], [null, '习作例文', 70, 'example', ['颐和园', '七月的天山']], [null, '习作：游____', 74]] },
    { order: 6, title: '第六单元', page: 75, kind: 'text', bank: ['chinese-g4b-u6'], rows: [[18, '文言文二则', 76, 'text', ['囊萤夜读', '铁杵成针']], [19, '小英雄雨来（节选）', 78], ['20*', '我们家的男子汉', 87], ['21*', '芦花鞋', 91], [null, '口语交际：朋友相处的秘诀', 97], [null, '习作：我学会了____', 98], [null, '语文园地', 99]] },
    { order: 7, title: '第七单元', page: 101, kind: 'text', bank: ['chinese-g4b-u7'], rows: [[22, '古诗三首', 102, 'text', ['芙蓉楼送辛渐', '塞下曲', '墨梅']], [23, '黄继光', 104], [24, '“诺曼底号”遇难记', 109], ['25*', '挑山工', 114], [null, '口语交际：自我介绍', 117], [null, '习作：我的“自画像”', 118], [null, '语文园地', 119]] },
    { order: 8, title: '第八单元', page: 121, kind: 'text', bank: ['chinese-g4b-u8'], rows: [[26, '宝葫芦的秘密（节选）', 122], [27, '巨人的花园', 125], ['28*', '海的女儿', 129], [null, '习作：故事新编', 134], [null, '语文园地', 135]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 137], [null, '写字表', 140], [null, '词语表', 142]] },
  ]);
