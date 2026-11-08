/**
 * 第五批（补）：外研社版小学英语（主编：张祖春），平台目前列出 5 册：三～四年级上下册、五年级上册（都是修订版）——已核实目录（V4.1）。
 * 来源：国家中小学智慧教育平台“小学 → 英语 → 外研社版（主编：张祖春）”电子课本 Contents 页；同一册平台有多个年度版本时取最新年度。录入方式见 platformToc.ts。
 * 与“外研社版（主编：孙有中）”（english.fltrp）是不同的书，单独登记。平台版本名写作“外研社版(主编：张祖春）”。
 * 现有题库按人教 PEP 旧版整理，与这套教材单元不对应，不关联。
 */
import type { Volume } from '../types';
import { buildPlatformVolumes, type PlatformPlan } from './platformToc';

const PLANS: PlatformPlan[] = [
  {
    grade: 3, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级上册",
    toc: `
Welcome 2
Unit 1 Hello! 5
Unit 2 It's my schoolbag 17
Unit 3 This is my school 29
Unit 4 I love my family 41
Unit 5 Sweet home 53
Unit 6 Know our body 65
More activities 77
Words and expressions 101
Word list 104
Proper nouns 108`,
  },
  {
    grade: 3, term: '下', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级下册",
    toc: `
Unit 1 You're talented! 1
Unit 2 What do we eat? 13
Unit 3 Lovely animals 25
Unit 4 My daily activities 37
Unit 5 What do we wear? 49
Unit 6 Fun time 61
More activities 73
Words and expressions 97
Word list 101
Proper nouns 106`,
  },
  {
    grade: 4, term: '上', tocPages: '7',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级上册",
    toc: `
Unit 1 Plan your money 1
Unit 2 Around the clock 13
Unit 3 Find your way 25
Unit 4 Follow the rules 37
Unit 5 Know our feelings 49
Unit 6 Let's celebrate! 61
More activities 73
Words and expressions 97
Word list 101
Proper nouns 106`,
  },
  {
    grade: 4, term: '下', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级下册",
    toc: `
Unit 1 A trip of learning 1
Unit 2 Take care of ourselves 13
Unit 3 Good habits 25
Unit 4 All about weather 37
Unit 5 Different jobs 49
Unit 6 My happy week 61
Extra activities 73
Words and expressions 97
Word list 101
Proper nouns 105`,
  },
  {
    grade: 5, term: '上', tocPages: '6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语五年级上册",
    toc: `
Unit 1 Helping at home 1
Unit 2 I love art! 13
Unit 3 A green life 25
Unit 4 China's space dream 37
Unit 5 Around the world 49
Unit 6 Look into the future 61
More activities 73
Words and expressions 97
Word list 101
Proper nouns 105`,
  },
];

export const ENGLISH_FLTRP_ZHANG: Volume[] = buildPlatformVolumes({"editionId": "english.fltrp-zhang", "subject": "english", "publisher": "外语教学与研究出版社", "platformName": "外研社版（主编：张祖春）", "subjectName": "英语", "checkedAt": "2026-11-09"}, PLANS, "目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归外语教学与研究出版社，不复制。");
