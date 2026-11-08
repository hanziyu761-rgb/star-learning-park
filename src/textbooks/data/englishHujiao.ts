/**
 * 第五批（补）：沪教版小学英语（三年级起点，平台版本名“沪教版”），8 册：三～六年级上册、三～四年级下册为修订版，五、六年级下册为未修订版——已核实目录（V4.1）。
 * 来源：国家中小学智慧教育平台“小学 → 英语 → 沪教版”电子课本 Contents 页；同一册平台有多个年度版本时取最新年度。录入方式见 platformToc.ts。
 * 修订版 Contents 每个单元只写 Big Question，没有单元名，这里按 Big Question 原文登记；未修订版 Module 是分组名，没有页码，不单独登记。
 * 现有题库按人教 PEP 旧版整理，与这套教材单元不对应，不关联。
 */
import type { Volume } from '../types';
import { buildPlatformVolumes, type PlatformPlan } from './platformToc';

const PLANS: PlatformPlan[] = [
  {
    grade: 3, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级上册",
    toc: `
Unit 1 How do we feel? 5
Unit 2 What's interesting about families? 15
Unit 3 What do we look like? 25
Unit 4 How do we have fun? 35
Unit 5 What do we eat? 45
Unit 6 What do we like about small animals? 55
Unit 7 What do we know about weather? 65
Unit 8 Why do we like birthdays? 75
Project 1 85
Project 2 87
Unit checklist 89
Word list 90`,
  },
  {
    grade: 3, term: '下', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级下册",
    toc: `
Unit 1 How do we spend our free time? 1
Unit 2 How do we make friends? 11
Unit 3 What do we wear? 21
Unit 4 What sounds can we hear? 31
Unit 5 Where can we see colours? 41
Unit 6 What are our homes like? 51
Unit 7 What do we do at school? 61
Unit 8 What do you do on Children's Day? 71
Project 1 81
Project 2 83
Unit checklist 85
Word list 86`,
  },
  {
    grade: 4, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级上册",
    toc: `
Unit 1 Where do people live? 1
Unit 2 Where do animals live? 11
Unit 3 How do we use numbers? 21
Unit 4 What do we buy? 31
Unit 5 How are the seasons different? 41
Unit 6 What's amazing about plants? 51
Unit 7 How do we keep safe on the road? 61
Unit 8 What do our grandparents do? 71
Project 1 81
Project 2 83
Unit checklist 85
Word list 86`,
  },
  {
    grade: 4, term: '下', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级下册",
    toc: `
Unit 1 What is your daily schedule? 1
Unit 2 What do we like about school? 11
Unit 3 What's great about jobs? 21
Unit 4 How can we make music? 31
Unit 5 How do we make art? 41
Unit 6 How do we measure time? 51
Unit 7 How do things change? 61
Unit 8 How do people get along with each other? 71
Project 1 81
Project 2 83
Unit checklist 85
Word list 86`,
  },
  {
    grade: 5, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语五年级上册",
    toc: `
Unit 1 What do we do at the weekend? 1
Unit 2 How do we stay healthy? 13
Unit 3 What do you know about different countries? 25
Unit 4 What's interesting about holidays? 37
Unit 5 What are living things? 49
Unit 6 Why should we take care of the Earth? 61
Unit 7 How do we celebrate festivals? 73
Unit 8 How does music make us feel? 85
Project 1 97
Project 2 99
Unit checklist 101
Word list 102`,
  },
  {
    grade: 5, term: '下', legacy: true, tocPages: '5～8',
    title: "义务教育教科书·英语（三年级起点）五年级下册",
    toc: `
Unit 1 Tidy up! 2
Unit 2 Our new home 8
Unit 3 In the future 14
Revision 1 20
Project 1 22
Unit 4 Reading is fun 24
Unit 5 At the weekend 30
Unit 6 Holidays 36
Revision 2 42
Project 2 44
Unit 7 Open Day 46
Unit 8 Buying clothes 52
Unit 9 Seeing the doctor 58
Revision 3 64
Project 3 66
Unit 10 Great inventions 68
Unit 11 Chinese festivals 74
Unit 12 The giant's garden 80
Project 4 86
Word list 1 88
Word list 2 91
Daily expressions 94
Proper nouns 94`,
  },
  {
    grade: 6, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语六年级上册",
    toc: `
Unit 1 Why do people move to new places? 1
Unit 2 Why do we make art? 13
Unit 3 How should we protect ourselves? 25
Unit 4 What makes things move? 37
Unit 5 How do inventions change our lives? 49
Unit 6 What is a city? 61
Project 1 73
Project 2 75
Unit checklist 77
Word list 78
Grammar review table 81`,
  },
  {
    grade: 6, term: '下', legacy: true, tocPages: '5～8',
    title: "义务教育教科书·英语（三年级起点）六年级下册",
    toc: `
Unit 1 You and me 2
Unit 2 Changes in our lives 8
Unit 3 Our school in the future 14
Project 1 20
Unit 4 Art 22
Unit 5 Crafts 28
Unit 6 PE lessons 34
Project 2 40
Unit 7 Helping others 42
Unit 8 Reading signs 48
Unit 9 Reusing things 54
Project 3 60
Unit 10 Great storybooks 62
Unit 11 Western festivals 68
Unit 12 The five peas 74
Project 4 80
Word list 1 82
Word list 2 85
Daily expressions 88
Proper nouns 88
Irregular verbs 89
Grammar review table 90`,
  },
];

export const ENGLISH_HUJIAO: Volume[] = buildPlatformVolumes({"editionId": "english.hujiao", "subject": "english", "publisher": "上海教育出版社", "platformName": "沪教版", "subjectName": "英语", "checkedAt": "2026-11-09"}, PLANS, "目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归上海教育出版社，不复制。");
