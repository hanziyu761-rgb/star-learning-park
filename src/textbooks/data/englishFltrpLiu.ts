/**
 * 第五批（补）：外研社版小学英语（主编：刘兆义），8 册：三～六年级上册、三～四年级下册为修订版，五、六年级下册为未修订版——已核实目录（V4.1）。
 * 来源：国家中小学智慧教育平台“小学 → 英语 → 外研社版（主编：刘兆义）”电子课本 Contents 页；同一册平台有多个年度版本时取最新年度。录入方式见 platformToc.ts。
 * 与“外研社版（主编：孙有中）”（english.fltrp）是不同的书，单独登记。
 * 现有题库按人教 PEP 旧版整理，与这套教材单元不对应，不关联。
 */
import type { Volume } from '../types';
import { buildPlatformVolumes, type PlatformPlan } from './platformToc';

const PLANS: PlatformPlan[] = [
  {
    grade: 3, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级上册",
    toc: `
Welcome unit Let's begin! 2
Unit 1 Hello, hello! 6
Unit 2 Colourful world 14
Unit 3 Numbers are fun! 22
Unit 4 My school things 30
Unit 5 In my classroom 38
Unit 6 Meet my family 46
More activities 55
Plays 81
Words and expressions 86
Vocabulary 93
Proper nouns 100`,
  },
  {
    grade: 3, term: '下', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级下册",
    toc: `
Unit 1 All about feelings 2
Unit 2 Know your body 10
Unit 3 Looking good! 18
Unit 4 Rain or sun, it's fun 26
Unit 5 Days of the week 34
Unit 6 Time to eat! 42
More activities 51
Plays 77
Words and expressions 82
Vocabulary 89
Proper nouns 98`,
  },
  {
    grade: 4, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级上册",
    toc: `
Unit 1 I love sports! 2
Unit 2 In town 10
Unit 3 Cool jobs 18
Unit 4 Let's shop! 26
Unit 5 Shapes are fun! 34
Unit 6 Our animal friends 42
More activities 51
Plays 77
Words and expressions 82
Vocabulary 88
Proper nouns 96`,
  },
  {
    grade: 4, term: '下', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级下册",
    toc: `
Unit 1 Around the clock 2
Unit 2 All year round 10
Unit 3 That's my room 18
Unit 4 Friends for life 26
Unit 5 A great day out 34
Unit 6 Fun times 42
More activities 51
Plays 77
Words and expressions 82
Vocabulary 88
Proper nouns 94`,
  },
  {
    grade: 5, term: '上', tocPages: '7',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语五年级上册",
    toc: `
Unit 1 My school is cool 1
Unit 2 School activities are fun! 9
Unit 3 The ice world 17
Unit 4 I love the sea! 25
Unit 5 Work it out! 33
Unit 6 Big days 41
More activities 49
Plays 75
Words and expressions 82
Vocabulary 87
Proper nouns 94`,
  },
  {
    grade: 5, term: '下', legacy: true, tocPages: '6',
    title: "义务教育教科书·英语（三年级起点）五年级下册",
    toc: `
Starter unit Join in again 2
Unit 1 Phone calls 8
Unit 2 Life in the Arctic 14
Unit 3 Television 20
Revision 1 26
Unit 4 In town 32
Unit 5 On the beach 38
Unit 6 Adventures 44
Revision 2 50
Supplementary activities 58
Two plays 68
Word list 72
Vocabulary 76
Proper names 82`,
  },
  {
    grade: 6, term: '上', tocPages: '7',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语六年级上册",
    toc: `
Unit 1 Good food, good health 1
Unit 2 Let's travel! 9
Unit 3 Call of the wild 17
Unit 4 Time flies! 25
Unit 5 Powerful earth 33
Unit 6 Winter fun 41
More activities 49
Plays 75
Words and expressions 82
Vocabulary 86
Proper nouns 90`,
  },
  {
    grade: 6, term: '下', legacy: true, tocPages: '6',
    title: "义务教育教科书·英语（三年级起点）六年级下册",
    toc: `
Starter unit Join us 2
Unit 1 My cousins and I 8
Unit 2 Food and health 14
Unit 3 Mary's diary 20
Revision 1 26
Unit 4 My heroes 32
Unit 5 I love reading 38
Unit 6 The world of my dreams 44
Revision 2 50
Supplementary activities 58
A play 71
Word list 73
Vocabulary 77
Proper names 83`,
  },
];

export const ENGLISH_FLTRP_LIU: Volume[] = buildPlatformVolumes({"editionId": "english.fltrp-liu", "subject": "english", "publisher": "外语教学与研究出版社", "platformName": "外研社版（主编：刘兆义）", "subjectName": "英语", "checkedAt": "2026-11-09"}, PLANS, "目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归外语教学与研究出版社，不复制。");
