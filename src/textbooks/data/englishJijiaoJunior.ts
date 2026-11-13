/**
 * 第七批：冀教版初中英语（七～九年级），5 册修订版：七年级上下册、八年级上下册、九年级上册——已核实目录（V4.3）。
 * 平台“初中 → 英语 → 冀教版”目前没有九年级下册（2026-11-13 查看），不登记。
 * 来源：国家中小学智慧教育平台电子课本 Contents 页；同一册有多个年度版本时取最新年度。录入方式见 platformToc.ts。
 * Contents 是表格：每个单元列出页码范围，这里录单元名和起始页；单元下的课名不录。只有目录，没有课程和练习。
 */
import type { Volume } from '../types';
import { buildPlatformVolumes, type PlatformPlan } from './platformToc';

const PLANS: PlatformPlan[] = [
  {
    grade: 7, term: '上', tocPages: '5～7',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语七年级上册",
    toc: `
Unit 1 New school, new beginning! 1
Unit 2 Learning English is fun! 15
Unit 3 All about me 29
Unit 4 My family 43
Unit 5 Animal friends 57
Unit 6 Let's go! 71
Unit 7 Days and months 85
Unit 8 Knowing the world 99`,
  },
  {
    grade: 7, term: '下', tocPages: '5～7',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语七年级下册",
    toc: `
Unit 1 A trip to the Silk Road 1
Unit 2 School life 15
Unit 3 After-school activities 29
Unit 4 My friends 43
Unit 5 Our neighbourhood 57
Unit 6 Being creative 71
Unit 7 Ways to be healthy 85
Unit 8 I love nature! 99`,
  },
  {
    grade: 8, term: '上', tocPages: '5～7',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语八年级上册",
    toc: `
Unit 1 Me and my class 1
Unit 2 Festivals and holidays 15
Unit 3 Better you, better me! 29
Unit 4 Being a good learner 43
Unit 5 Work education 57
Unit 6 Natural wonders of the world 71
Unit 7 Let's volunteer! 85
Unit 8 Protecting the environment 99`,
  },
  {
    grade: 8, term: '下', tocPages: '5～7',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语八年级下册",
    toc: `
Unit 1 Spring is coming! 1
Unit 2 Safety 15
Unit 3 Amazing sports 29
Unit 4 Rules make for a better life! 43
Unit 5 Great inventions 57
Unit 6 I love literature! 71
Unit 7 The value of money 85
Unit 8 Natural disasters 99`,
  },
  {
    grade: 9, term: '上', tocPages: '4～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语九年级上册",
    toc: `
Unit 1 Staying healthy 1
Unit 2 Communication 17
Unit 3 Arts enrich our life 33
Unit 4 Great people 49
Unit 5 Culture shapes us! 65
Unit 6 Looking into science 81`,
  },
];

export const ENGLISH_JIJIAO_JUNIOR: Volume[] = buildPlatformVolumes({"editionId": "english.jijiao-jh", "subject": "english", "publisher": "河北教育出版社", "platformName": "冀教版", "subjectName": "英语", "checkedAt": "2026-11-13", "stage": "初中"}, PLANS, "教材正文、插图、例题、习题版权归出版社所有；这里只录入目录上的单元名、课名和页码，不复制教材内容。");
