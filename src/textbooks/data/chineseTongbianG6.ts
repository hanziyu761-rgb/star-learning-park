/**
 * 统编版语文六年级（V4.0 第一批）——已核实目录：
 * - 六年级上册（根据 2022 年版课程标准修订）
 * - 六年级下册：平台目前提供的是未标注“根据2022年版课程标准修订”的版本（旧版），单独登记
 * 来源：国家中小学智慧教育平台 电子课本目录页，由 APP 所有者 2026-11-07 截图提供，逐条录入。
 */
import type { SourceRef } from '../types';
import { build, G1_CHECKED } from './chineseTongbianG1';

export const SRC_G6A: SourceRef = {
  title: '国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·语文 六年级上册 电子课本 目录页（共 138 页，目录在第 4～5 页）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供。截图到“词语表 128”为止，其后若还有内容未录入。',
};
export const SRC_G6B_LEGACY: SourceRef = {
  title: '国家中小学智慧教育平台 义务教育教科书·语文 六年级下册 电子课本 目录页（共 130 页，目录在第 4～5 页；书名未标注“根据2022年版课程标准修订”）',
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: G1_CHECKED,
  note: 'APP 所有者登录平台后截图提供。第六单元“回忆往事 98”在截图底部，其下若还有内容未显示，待补。目录页说明：标*的是略读课文。',
};

export const G6A_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g6a-u1'], rows: [[1, '草原', 2], [2, '丁香结', 5], [3, '古诗词三首', 8, 'text', ['宿建德江', '六月二十七日望湖楼醉书', '西江月·夜行黄沙道中']], [null, '习作 变形记', 10], [null, '语文园地', 11]] },
    { order: 2, title: '第二单元', page: 13, kind: 'text', bank: ['chinese-g6a-u2'], rows: [[4, '七律·长征', 14], [5, '狼牙山五壮士', 16], [6, '开国大典', 19], [7, '我的战友邱少云', 24], [null, '口语交际 演讲', 27], [null, '习作 多彩的活动', 28], [null, '语文园地', 29]] },
    { order: 3, title: '第三单元', page: 31, kind: 'text', bank: ['chinese-g6a-u3'], rows: [[8, '竹节人', 32], [9, '宇宙生命之谜', 36], ['10*', '故宫博物院', 40], [null, '习作 ____让生活更美好', 46], [null, '语文园地', 47]] },
    { order: 4, title: '第四单元', page: 49, kind: 'text', bank: ['chinese-g6a-u4'], rows: [[11, '桥', 50], [12, '穷人', 53], ['13*', '金色的鱼钩', 58], [null, '口语交际 请你支持我', 63], [null, '习作 笔尖流出的故事', 64], [null, '语文园地', 65], [null, '快乐读书吧 笑与泪，经历与成长', 67]] },
    { order: 5, title: '第五单元', page: 69, kind: 'text', bank: ['chinese-g6a-u5'], rows: [[14, '灯光', 70], [15, '盼', 73], [null, '习作 围绕中心意思写', 77], [null, '习作例文', 78, 'example', ['爸爸的计划', '小站']]] },
    { order: 6, title: '第六单元', page: 81, kind: 'text', bank: ['chinese-g6a-u6'], rows: [[16, '只有一个地球', 82], ['17*', '青山不老', 84], ['18*', '三黑和土地', 86], [19, '古诗三首', 91, 'text', ['浪淘沙（其一）', '江南春', '书湖阴先生壁']], [null, '口语交际 意见不同怎么办', 93], [null, '习作 学写倡议书', 94], [null, '语文园地', 95]] },
    { order: 7, title: '第七单元', page: 97, kind: 'text', bank: ['chinese-g6b-u5'], rows: [[20, '文言文二则', 98, 'text', ['两小儿辩日', '曹冲称象']], [21, '表里的生物', 100], ['22*', '他们那时候多有趣啊', 103], [null, '习作 插上科学的翅膀飞', 106], [null, '语文园地', 107]] },
    { order: 8, title: '第八单元', page: 109, kind: 'text', bank: ['chinese-g6a-u8'], rows: [[23, '少年闰土', 110], [24, '好的故事', 114], ['25*', '我的伯父鲁迅先生', 117], ['26*', '有的人——纪念鲁迅有感', 121], [null, '习作 传承好家风', 123], [null, '语文园地', 124]] },
    { order: 9, title: '附录', kind: 'other', bank: [], rows: [[null, '写字表', 126], [null, '词语表', 128]] },
  ]);

export const G6B_LEGACY_UNITS = (volId: string) =>
  build(volId, [
    { order: 1, title: '第一单元', page: 1, kind: 'text', bank: ['chinese-g6b-u1'], rows: [[1, '北京的春节', 2], [2, '腊八粥', 8], [3, '古诗三首', 11, 'text', ['寒食', '迢迢牵牛星', '十五夜望月']], ['4*', '藏戏', 13], [null, '口语交际：即兴发言', 15], [null, '习作：家乡的风俗', 16], [null, '语文园地', 17]] },
    { order: 2, title: '第二单元', page: 19, kind: 'text', bank: ['chinese-g6b-u2'], rows: [[5, '鲁滨逊漂流记（节选）', 20], ['6*', '骑鹅旅行记（节选）', 27], ['7*', '汤姆·索亚历险记（节选）', 33], [null, '口语交际：同读一本书', 37], [null, '习作：写作品梗概', 38], [null, '语文园地', 39], [null, '快乐读书吧：漫步世界名著花园', 41]] },
    { order: 3, title: '第三单元', page: 43, kind: 'text', bank: ['chinese-g6b-u3'], rows: [[8, '匆匆', 44], [9, '那个星期天', 46], [null, '习作例文', 51, 'example', ['别了，语文课', '阳光的两种用法']], [null, '习作：让真情自然流露', 56]] },
    { order: 4, title: '第四单元', page: 57, kind: 'text', bank: ['chinese-g6b-u4'], rows: [[10, '古诗三首', 58, 'text', ['马诗', '石灰吟', '竹石']], [11, '十六年前的回忆', 60], [12, '为人民服务', 64], ['13*', '董存瑞舍身炸暗堡', 66], [null, '综合性学习：奋斗的历程', 68, 'other'], [null, '语文园地', 77]] },
    { order: 5, title: '第五单元', page: 79, kind: 'text', bank: ['chinese-g6b-u5'], rows: [[14, '文言文二则', 80, 'text', ['学弈', '两小儿辩日']], [15, '真理诞生于一百个问号之后', 82], [16, '表里的生物', 87], ['17*', '他们那时候多有趣啊', 90], [null, '口语交际：辩论', 93], [null, '习作：插上科学的翅膀飞', 94], [null, '语文园地', 95]] },
    { order: 6, title: '第六单元', page: 97, kind: 'other', bank: ['chinese-g6b-u6'], rows: [[null, '综合性学习：难忘小学生活', 98], [null, '回忆往事', 98, undefined, undefined, '截图底部，其下若还有内容未显示，待补'], [null, '依依惜别', 105]] },
    { order: 7, title: '古诗词诵读', kind: 'poem', bank: [], rows: [[1, '采薇（节选）', 111], [2, '送元二使安西', 112], [3, '春夜喜雨', 113], [4, '早春呈水部张十八员外', 114], [5, '江上渔者', 115], [6, '泊船瓜洲', 116], [7, '游园不值', 117], [8, '卜算子·送鲍浩然之浙东', 118], [9, '浣溪沙', 119], [10, '清平乐', 120]] },
    { order: 8, title: '附录', kind: 'other', bank: [], rows: [[null, '写字表', 121], [null, '词语表', 122]] },
  ]);
