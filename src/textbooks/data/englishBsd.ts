/**
 * 第五批（补）：北师大版小学英语（三年级起点），8 册：三～六年级上册、三～四年级下册为修订版，五、六年级下册为未修订版（单元从 Unit 7 编起，照原样）——已核实目录（V4.1）。
 * 来源：国家中小学智慧教育平台“小学 → 英语 → 北师大版”电子课本 Contents 页；同一册平台有多个年度版本时取最新年度。录入方式见 platformToc.ts。

 * 现有题库按人教 PEP 旧版整理，与这套教材单元不对应，不关联。
 */
import type { Volume } from '../types';
import { buildPlatformVolumes, type PlatformPlan } from './platformToc';

const PLANS: PlatformPlan[] = [
  {
    grade: 3, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级上册",
    toc: `
Unit 1 Family 1
Unit 2 Going to school 13
Unit 3 Learning 25
Unit 4 Friends 37
Unit 5 My home 49
Unit 6 Review 61
Wonderful world 71
Word bank 76
Stick or match 79`,
  },
  {
    grade: 3, term: '下', tocPages: '5',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级下册",
    toc: `
Unit 1 More about me 1
Unit 2 We are different 13
Unit 3 Going outdoors 25
Unit 4 Travelling around 37
Unit 5 I love China 49
Unit 6 Review 61
Wonderful world 70
Word bank 75
Stick or match 79`,
  },
  {
    grade: 4, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级上册",
    toc: `
Unit 1 Back to school 1
Unit 2 The animal world 13
Unit 3 Playing and having fun 25
Unit 4 Places around us 37
Unit 5 My holiday 49
Unit 6 Review 61
Wonderful world 70
Word bank 75`,
  },
  {
    grade: 4, term: '下', tocPages: '5',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级下册",
    toc: `
Unit 1 People I love 1
Unit 2 Sports 13
Unit 3 We can do it 25
Unit 4 Using the time 37
Unit 5 Weather and us 49
Unit 6 Review 61
Wonderful world 70
Word bank 75`,
  },
  {
    grade: 5, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语五年级上册",
    toc: `
Unit 1 Welcoming seasons 1
Unit 2 Staying healthy 13
Unit 3 A better me 25
Unit 4 Doing chores 37
Unit 5 Living in a community 49
Unit 6 Review 61
Wonderful world 70
Word bank 75`,
  },
  {
    grade: 5, term: '下', legacy: true, tocPages: '3',
    title: "义务教育教科书·英语（三年级起点）五年级下册",
    toc: `
Unit 7 Days of the Week 3
Unit 8 Time 17
Unit 9 Day and Night 31
Unit 10 Activities 45
Unit 11 Weather 59
Unit 12 Review 73
Progress Check 82
Vocabulary 86
Word List 88`,
  },
  {
    grade: 6, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语六年级上册",
    toc: `
Unit 1 Growing 1
Unit 2 Changes 13
Unit 3 Into space 25
Unit 4 Travelling 37
Unit 5 Feeling the art 49
Unit 6 Review 61
Wonderful world 70
Word bank 75
Table of verbs 78`,
  },
  {
    grade: 6, term: '下', legacy: true, tocPages: '3',
    title: "义务教育教科书·英语（三年级起点）六年级下册",
    toc: `
Unit 7 Vacation 3
Unit 8 Music 17
Unit 9 The Year 2050 31
Unit 10 Review 1 45
Unit 11 Review 2 53
Unit 12 Review 3 61
Vocabulary 69
Word List 71
Verb Forms 73`,
  },
];

export const ENGLISH_BSD: Volume[] = buildPlatformVolumes({"editionId": "english.bsd", "subject": "english", "publisher": "北京师范大学出版社", "platformName": "北师大版", "subjectName": "英语", "checkedAt": "2026-11-09"}, PLANS, "目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归北京师范大学出版社，不复制。");
