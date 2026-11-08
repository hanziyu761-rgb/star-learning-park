/**
 * 第五批（补）：译林版小学英语（三年级起点），8 册：三～六年级上册、三～四年级下册为修订版，五、六年级下册为未修订版——已核实目录（V4.1）。
 * 来源：国家中小学智慧教育平台“小学 → 英语 → 译林版”电子课本 Contents 页；同一册平台有多个年度版本时取最新年度。录入方式见 platformToc.ts。
 * 修订版 Contents 是表格：单元页码取表中该单元第一项（Lead-in）的页码；Module 是表格侧栏的分组名，没有页码，不单独登记。
 * 现有题库按人教 PEP 旧版整理，与这套教材单元不对应，不关联。
 */
import type { Volume } from '../types';
import { buildPlatformVolumes, type PlatformPlan } from './platformToc';

const PLANS: PlatformPlan[] = [
  {
    grade: 3, term: '上', tocPages: '7～8',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级上册",
    toc: `
Unit 1 Hello! 9
Unit 2 What's your name? 17
Unit 3 Are you Su Hai? 25
Unit 4 This is my friend 33
Project 1 Making friends 40
Unit 5 She's my mother 43
Unit 6 Is he your grandpa? 51
Unit 7 Happy Birthday! 59
Unit 8 I can do this for you 67
Project 2 My family poster 74
Learning tips 76
Word lists 78
The English alphabet 83
The alphabet song 84`,
  },
  {
    grade: 3, term: '下', tocPages: '7～8',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级下册",
    toc: `
Unit 1 School things 9
Unit 2 Clean our classroom 17
Unit 3 School rules 25
Unit 4 Have fun after class 33
Project 1 A good student 40
Unit 5 Fruit 43
Unit 6 On the farm 51
Unit 7 Animals 59
Unit 8 Colours 67
Project 2 My nature park 74
Learning tips 76
Word lists 78`,
  },
  {
    grade: 4, term: '上', tocPages: '7～8',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级上册",
    toc: `
Unit 1 Our school subjects 9
Unit 2 My day 17
Unit 3 My week 25
Unit 4 I like sport 33
Project 1 My weekly plan 40
Unit 5 Different toys, same fun 43
Unit 6 Weather 51
Unit 7 Seasons 59
Unit 8 What we wear 67
Project 2 A puppet show 74
Learning tips 76
Word lists 78`,
  },
  {
    grade: 4, term: '下', tocPages: '7～8',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级下册",
    toc: `
Unit 1 We're friends 9
Unit 2 Helping others at school 17
Unit 3 Road safety 25
Unit 4 Caring about others 33
Project 1 My school model 40
Unit 5 Eating out 43
Unit 6 Jobs 51
Unit 7 Doing chores at home 59
Unit 8 In the kitchen 67
Project 2 A good helper 74
Learning tips 76
Word lists 78`,
  },
  {
    grade: 5, term: '上', tocPages: '7～8',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语五年级上册",
    toc: `
Unit 1 Good habits 9
Unit 2 I feel good 21
Unit 3 Hobbies 33
Unit 4 Safety first 45
Project 1 A happy life poster 56
Unit 5 At weekends 59
Unit 6 Getting along with others 71
Unit 7 Shopping smart 83
Unit 8 We love festivals! 95
Project 2 An invitation card 106
Learning tips 108
Word lists 110`,
  },
  {
    grade: 5, term: '下', legacy: true, tocPages: '7～8',
    title: "义务教育教科书·英语（三年级起点）五年级下册",
    toc: `
Unit 1 Cinderella 6
Unit 2 How do you come to school? 16
Unit 3 Asking the way 26
Unit 4 Seeing the doctor 36
Project 1 Around our city 46
Unit 5 Helping our parents 48
Unit 6 In the kitchen 58
Unit 7 Chinese festivals 68
Unit 8 Birthdays 78
Project 2 My important days 88
Learning tips 90
Word lists 92`,
  },
  {
    grade: 6, term: '上', tocPages: '7～8',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语六年级上册",
    toc: `
Unit 1 Try your best 9
Unit 2 Honesty 21
Unit 3 Great people 33
Unit 4 Getting together 45
Project 1 A better me 56
Unit 5 Keeping our city clean 59
Unit 6 Going green 71
Unit 7 Old things, new life 83
Unit 8 Then and now 95
Project 2 A better home 106
Learning tips 108
Word lists 110`,
  },
  {
    grade: 6, term: '下', legacy: true, tocPages: '7～8',
    title: "义务教育教科书·英语（三年级起点）六年级下册",
    toc: `
Unit 1 The lion and the mouse 6
Unit 2 Good habits 16
Unit 3 A healthy diet 26
Unit 4 Road safety 36
Project 1 Being a good student 46
Unit 5 A party 48
Unit 6 An interesting country 58
Unit 7 Summer holiday plans 68
Unit 8 Our dreams 78
Project 2 A travel book 88
Learning tips 90
Word lists 92`,
  },
];

export const ENGLISH_YILIN: Volume[] = buildPlatformVolumes({"editionId": "english.yilin", "subject": "english", "publisher": "译林出版社", "platformName": "译林版", "subjectName": "英语", "checkedAt": "2026-11-09"}, PLANS, "目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归译林出版社，不复制。");
