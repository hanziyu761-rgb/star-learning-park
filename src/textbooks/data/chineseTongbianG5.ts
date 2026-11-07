/**
 * 统编版语文五年级（V4.0 第一批）——已核实目录：
 * - 五年级上册（根据 2022 年版课程标准修订）
 * - 五年级下册：平台目前提供的是未标注“根据2022年版课程标准修订”的版本（旧版），单独登记
 * 来源：国家中小学智慧教育平台 电子课本目录页，由 APP 所有者 2026-11-07 截图提供，逐条录入。
 */
import type { SourceRef } from '../types';
import { build, G1_CHECKED } from './chineseTongbianG1';

export const SRC_G5A: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 五年级上册 电子课本 目录页（共 130 页，目录在第 4～5 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供。目录页说明：标*的是略读课文；第二单元是阅读策略单元，第五单元是习作单元。',
};
export const SRC_G5B_LEGACY: SourceRef = {
  title: '国家中小学智慧教育平台 义务教育教科书·语文 五年级下册 电子课本 目录页（共 131 页，目录在第 4～5 页；书名未标注“根据2022年版课程标准修订”）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供。目录页说明：标*的是略读课文。',
};

export const G5A_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g5a-u1'], rows: [[1, '桂花雨', 2], [2, '落花生', 5], ['3*', '珍珠鸟', 7], [null, '口语交际 制定班级公约', 9], [null, '习作 我的心爱之物', 10], [null, '语文园地', 11]] },
    { order: 2, title: '第二单元', page: 13, note: '阅读策略单元', kind: 'text', bank: ['chinese-g5a-u2'], rows: [[4, '冀中的地道战', 14], [5, '将相和', 17], [6, '什么比猎豹的速度更快', 22], [7, '“诺曼底号”遇难记', 25], [null, '习作 “漫画”老师', 30], [null, '语文园地', 31]] },
    { order: 3, title: '第三单元', page: 33, kind: 'text', bank: ['chinese-g5a-u3'], rows: [[8, '猎人海力布', 34], [9, '牛郎织女（一）', 37], ['10*', '牛郎织女（二）', 42], [null, '口语交际 讲民间故事', 45], [null, '习作 故事新编', 46], [null, '语文园地', 47], [null, '快乐读书吧 从前有座山', 49]] },
    { order: 4, title: '第四单元', page: 51, kind: 'text', bank: ['chinese-g5a-u4'], rows: [[11, '古诗三首', 52, 'text', ['示儿', '题临安邸', '己亥杂诗']], [12, '少年中国说（节选）', 54], [13, '圆明园的毁灭', 56], ['14*', '梅兰芳蓄须明志', 59], [null, '习作 二十年后的家乡', 62], [null, '语文园地', 63]] },
    { order: 5, title: '第五单元', page: 65, note: '习作单元', kind: 'text', bank: ['chinese-g5a-u5'], rows: [[15, '太阳', 66], [16, '金字塔', 68], [null, '习作 介绍一种事物', 71], [null, '习作例文', 72, 'example', ['鲸', '风向袋的制作']]] },
    { order: 6, title: '第六单元', page: 75, kind: 'text', bank: ['chinese-g5a-u6'], rows: [[17, '慈母情深', 76], [18, '父爱之舟', 80], ['19*', '航天员写给孩子的信', 84], [null, '口语交际 父母之爱', 87], [null, '习作 我想对您说', 88], [null, '语文园地', 89]] },
    { order: 7, title: '第七单元', page: 91, kind: 'text', bank: ['chinese-g5a-u7'], rows: [[20, '古诗三首', 92, 'text', ['山居秋暝', '枫桥夜泊', '早春呈水部张十八员外']], [21, '第一场雪', 94], [22, '白鹭', 96], [null, '习作 我最喜爱的季节', 98], [null, '语文园地', 99]] },
    { order: 8, title: '第八单元', page: 101, kind: 'text', bank: ['chinese-g5a-u8'], rows: [[23, '古人谈读书', 102], [24, '忆读书', 104], ['25*', '走遍天下书为侣', 109], [null, '习作 推荐一本书', 111], [null, '语文园地', 112]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 115], [null, '写字表', 118], [null, '词语表', 120]] },
  ]);

export const G5B_LEGACY_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g5b-u1'], rows: [[1, '古诗三首', 2, 'text', ['四时田园杂兴（其三十一）', '稚子弄冰', '村晚']], [2, '祖父的园子', 4], ['3*', '月是故乡明', 8], ['4*', '梅花魂', 10], [null, '口语交际：走进他们的童年岁月', 13], [null, '习作：那一刻，我长大了', 14], [null, '语文园地', 15]] },
    { order: 2, title: '第二单元', page: 17, kind: 'text', bank: ['chinese-g5b-u2'], rows: [[5, '草船借箭', 18], [6, '景阳冈', 22], ['7*', '猴王出世', 28], ['8*', '红楼春趣', 31], [null, '口语交际：怎么表演课本剧', 35], [null, '习作：写读后感', 36], [null, '语文园地', 37], [null, '快乐读书吧：读古典名著，品百味人生', 39]] },
    { order: 3, title: '第三单元', page: 41, kind: 'other', bank: ['chinese-g5b-u3'], rows: [[null, '综合性学习：遨游汉字王国', 42], [null, '汉字真有趣', 43], [null, '我爱你，汉字', 47]] },
    { order: 4, title: '第四单元', page: 53, kind: 'text', bank: ['chinese-g5b-u4'], rows: [[9, '古诗三首', 54, 'text', ['从军行', '秋夜将晓出篱门迎凉有感', '闻官军收河南河北']], [10, '青山处处埋忠骨', 56], [11, '军神', 59], ['12*', '清贫', 63], [null, '习作：他____了', 65], [null, '语文园地', 66]] },
    { order: 5, title: '第五单元', page: 69, kind: 'text', bank: ['chinese-g5b-u5'], rows: [[13, '人物描写一组', 70, 'text', ['摔跤', '他像一棵挺脱的树', '两茎灯草']], [14, '刷子李', 74], [null, '习作例文', 78, 'example', ['我的朋友容容', '小守门员和他的观众们']], [null, '习作：形形色色的人', 82]] },
    { order: 6, title: '第六单元', page: 83, kind: 'text', bank: ['chinese-g5b-u6'], rows: [[15, '自相矛盾', 84], [16, '田忌赛马', 85], [17, '跳水', 87], [null, '习作：神奇的探险之旅', 89], [null, '语文园地', 90]] },
    { order: 7, title: '第七单元', page: 93, kind: 'text', bank: ['chinese-g5b-u7'], rows: [[18, '威尼斯的小艇', 94], [19, '牧场之国', 97], ['20*', '金字塔', 99, 'text', ['金字塔夕照', '不可思议的金字塔']], [null, '口语交际：我是小小讲解员', 103], [null, '习作：中国的世界文化遗产', 104], [null, '语文园地', 105]] },
    { order: 8, title: '第八单元', page: 107, kind: 'text', bank: ['chinese-g5b-u8'], rows: [[21, '杨氏之子', 108], [22, '手指', 109], ['23*', '童年的发现', 112], [null, '口语交际：我们都来讲笑话', 115], [null, '习作：漫画的启示', 116], [null, '语文园地', 117]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '识字表', 119], [null, '写字表', 121], [null, '词语表', 123]] },
  ]);
