/**
 * 第五批（补）：冀教版小学英语（三年级起点），8 册：三～六年级上册、三～四年级下册为修订版，五、六年级下册为未修订版——已核实目录（V4.1）。
 * 来源：国家中小学智慧教育平台“小学 → 英语 → 冀教版”电子课本 Contents 页；同一册平台有多个年度版本时取最新年度。录入方式见 platformToc.ts。
 * 修订版 Contents 是表格：每个单元列出页码范围，这里录起始页；单元下的课名不录。
 * 现有题库按人教 PEP 旧版整理，与这套教材单元不对应，不关联。
 */
import type { Volume } from '../types';
import { buildPlatformVolumes, type PlatformPlan } from './platformToc';

const PLANS: PlatformPlan[] = [
  {
    grade: 3, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级上册",
    toc: `
Unit 1 Hello! 1
Unit 2 My school 13
Unit 3 Colours and letters 25
Unit 4 My friends 37
Unit 5 About me 49
Unit 6 My family 61
Words in each unit 73
Vocabulary 75
Reading for fun 80`,
  },
  {
    grade: 3, term: '下', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级下册",
    toc: `
Unit 1 Food we like 1
Unit 2 Good food, good health 13
Unit 3 My day 25
Unit 4 On the farm 37
Unit 5 At the zoo 49
Unit 6 My week 61
Words in each unit 73
Vocabulary 75
Reading for fun 80`,
  },
  {
    grade: 4, term: '上', tocPages: '4～5',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级上册",
    toc: `
Unit 1 School life 1
Unit 2 School rules 13
Unit 3 Sports 25
Unit 4 Jobs 37
Unit 5 Meet my family 49
Unit 6 More about me 61
Words in each unit 73
Vocabulary 76
Reading for fun 81`,
  },
  {
    grade: 4, term: '下', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级下册",
    toc: `
Unit 1 I love nature! 1
Unit 2 Weather 13
Unit 3 Seasons 25
Unit 4 Festivals and holidays 37
Unit 5 My community 49
Unit 6 Safety first 61
Words in each unit 73
Vocabulary 76
Reading for fun 81`,
  },
  {
    grade: 5, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语五年级上册",
    toc: `
Unit 1 School clubs 1
Unit 2 Sports games and safety 15
Unit 3 A better me 29
Unit 4 Countries 43
Unit 5 Cities and hometowns 57
Unit 6 What a wonderful trip! 71
Project time 85
Words in each unit 90
Vocabulary 92
Reading for fun 97`,
  },
  {
    grade: 5, term: '下', legacy: true, tocPages: '5',
    title: "义务教育教科书·英语（三年级起点）五年级下册",
    toc: `
Unit 1 Going to Beijing 1
Unit 2 In Beijing 19
Unit 3 Writing Home 37
Unit 4 Did You Have a Nice Trip? 55
Words in Each Unit 73
Vocabulary 75
Reading for Fun 80`,
  },
  {
    grade: 6, term: '上', tocPages: '4～5',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语六年级上册",
    toc: `
Unit 1 Pocket money 1
Unit 2 How to solve problems 15
Unit 3 Volunteering 29
Unit 4 Going green 43
Unit 5 Holiday fun 57
Unit 6 Chinese festivals 71
Project time 85
Words in each unit 90
Vocabulary 92
Reading for fun 96`,
  },
  {
    grade: 6, term: '下', legacy: true, tocPages: '5',
    title: "义务教育教科书·英语（三年级起点）六年级下册",
    toc: `
Unit 1 Sports 1
Unit 2 Good Health to You! 19
Unit 3 What Will You Do This Summer? 37
Unit 4 Li Ming Comes Home 55
Words in Each Unit 73
Vocabulary 75
Reading for Fun 80`,
  },
];

export const ENGLISH_JIJIAO: Volume[] = buildPlatformVolumes({"editionId": "english.jijiao", "subject": "english", "publisher": "河北教育出版社", "platformName": "冀教版", "subjectName": "英语", "checkedAt": "2026-11-09"}, PLANS, "目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归河北教育出版社，不复制。");
