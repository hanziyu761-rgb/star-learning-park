/**
 * 第五批（补）：湘少版小学英语（三年级起点），8 册：三～六年级上册、三～四年级下册为修订版，五、六年级下册为未修订版——已核实目录（V4.1）。
 * 来源：国家中小学智慧教育平台“小学 → 英语 → 湘少版”电子课本 Contents 页；同一册平台有多个年度版本时取最新年度。录入方式见 platformToc.ts。
 * 修订版 Contents 是表格，Pages 栏为页码范围，这里录起始页。
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
Unit 2 What's your name? 6
Unit 3 How old are you? 11
Let's Know More 16
Assessment I 18
Unit 4 This is my family 21
Unit 5 Is this your pen? 26
Unit 6 Touch your head 31
Let's Know More 36
Assessment II 38
Unit 7 What colour is it? 41
Unit 8 What's this? 46
Unit 9 I like apples 51
Unit 10 Happy birthday! 56
Let's Know More 61
Assessment III 63
Vocabulary 66
Word List 69
Structures 73
Some Common Animals 76
Alphabet 78
Classroom Language 80
Formative Assessment 81`,
  },
  {
    grade: 3, term: '下', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语三年级下册",
    toc: `
Unit 1 How are you? 1
Unit 2 What time is it? 6
Unit 3 What's the weather like? 11
Let's Know More 16
Assessment I 18
Unit 4 Do you like the dress? 21
Unit 5 How many kites are there? 26
Unit 6 There is an egg here 31
Let's Know More 36
Assessment II 38
Unit 7 Wash your hands 41
Unit 8 Children's Day 46
Unit 9 I go there by bus 51
Unit 10 Is she a driver? 56
Let's Know More 61
Assessment III 63
Vocabulary 66
Word List 69
Structures 73
Some Common Fruit 76
Time 78
Jobs 79
Vowels 80
Formative Assessment 81`,
  },
  {
    grade: 4, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级上册",
    toc: `
Unit 1 This is our school 1
Unit 2 What time do you get up? 6
Unit 3 I like dumplings 11
Let's Know More 16
Assessment I 18
Unit 4 Look at the elephant 21
Unit 5 Can you play basketball? 26
Unit 6 What are those? 31
Let's Know More 36
Assessment II 38
Unit 7 Whose watch is this? 41
Unit 8 Don't talk in the library 46
Unit 9 Welcome to my home! 51
Unit 10 What's her job? 56
Let's Know More 61
Assessment III 63
Let's Read More 66
Vocabulary 68
Word List 71
Structures 75
Things at Home 79
Some Common Food 80
Formative Assessment 81`,
  },
  {
    grade: 4, term: '下', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语四年级下册",
    toc: `
Unit 1 It's on your head 1
Unit 2 What classes do you have this morning? 6
Unit 3 Today is Wednesday 11
Let's Know More 16
Assessment I 18
Unit 4 Class One gets 54 points 21
Unit 5 She helps students 26
Unit 6 What's your favourite season? 31
Let's Know More 36
Assessment II 38
Unit 7 What can you see? 41
Unit 8 He is cleaning the window 46
Unit 9 The Dragon Boat Festival 51
Unit 10 What does that sign mean? 56
Let's Know More 61
Assessment III 63
Let's Read More 66
Vocabulary 68
Word List 71
Structures 75
Months of the Year 79
Days of the Week 79
Numbers 80
Formative Assessment 81`,
  },
  {
    grade: 5, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语五年级上册",
    toc: `
Unit 1 What does she look like? 1
Unit 2 I'd like a sandwich 6
Unit 3 I can email my friends with the computer 11
Let's Know More 16
Assessment I 18
Unit 4 Can I use your pencil, please? 21
Unit 5 May I have a pet? 26
Unit 6 Which one do you want? 31
Let's Know More 36
Assessment II 38
Unit 7 What chores do you do at home? 41
Unit 8 What's your hobby? 46
Unit 9 I'm sorry 51
Unit 10 The Spring Festival 56
Let's Know More 61
Assessment III 63
Let's Read More 66
Vocabulary 68
Word List 71
Structures 75
Animals and Their Young 79
Songs 80
Formative Assessment 81`,
  },
  {
    grade: 5, term: '下', legacy: true, tocPages: '6～7',
    title: "义务教育教科书·英语（三年级起点）五年级下册",
    toc: `
Unit 1 We're going to read stories 1
Unit 2 We're going to do some research 5
Unit 3 Let's make a kite 9
Let's Know More 13
Assessment I 14
Unit 4 Don't talk here 17
Unit 5 When's your birthday? 21
Unit 6 I'll make a beautiful card 25
Let's Know More 29
Assessment II 30
Unit 7 There's a post office near my school 33
Unit 8 Can you show me the way to the Xinhua Hotel? 37
Unit 9 He's kind to children 41
Let's Know More 45
Assessment III 46
Unit 10 Where were you yesterday? 49
Unit 11 Who was first? 53
Unit 12 Where did you go? 57
Let's Know More 61
Assessment IV 62
Let's Read More 65
Word List I 67
Word List II 70
Structures 74
Past Form/Full Form and Short Form 80
Countries of the World 81
Self-Assessment 82`,
  },
  {
    grade: 6, term: '上', tocPages: '5～6',
    title: "（根据2022年版课程标准修订）义务教育教科书·英语六年级上册",
    toc: `
Unit 1 What did you do during the holidays? 1
Unit 2 Beibei always gets up early 6
Unit 3 The Mid-Autumn Festival 11
Let's Know More 16
Assessment I 18
Unit 4 It will be sunny and cool tomorrow 21
Unit 5 I will bring a bottle of orange juice 26
Unit 6 What can I do? 31
Let's Know More 36
Assessment II 38
Unit 7 We shouldn't waste water 41
Unit 8 This bird is bigger than the first one 46
Unit 9 I don't feel well 51
Unit 10 Festivals bring families together 56
Let's Know More 61
Assessment III 63
Let's Read More 66
Vocabulary 68
Word List 71
Structures 75
Verbs 79
Songs 80
Formative Assessment 81`,
  },
  {
    grade: 6, term: '下', legacy: true, tocPages: '6～7',
    title: "义务教育教科书·英语（三年级起点）六年级下册",
    toc: `
Unit 1 A family outing 1
Unit 2 Some stories are more interesting 5
Unit 3 We should learn to take care of ourselves 9
Let's Know More 13
Assessment I 14
Unit 4 Planting trees is good for us 17
Unit 5 Our Earth looks like this in space 21
Unit 6 Anne wanted to dance 25
Let's Know More 29
Assessment II 30
Unit 7 I'm not afraid! 33
Unit 8 International Children's Day 37
Unit 9 Look at these beautiful places in the world 41
Let's Know More 45
Assessment III 46
Let's Read More 49
General Revision I 57
General Revision II 62
Word List I 70
Word List II 71
Structures 73
Actions 78
Opposites 80
Singular and Plural 81
Self-Assessment 82`,
  },
];

export const ENGLISH_XIANGSHAO: Volume[] = buildPlatformVolumes({"editionId": "english.xiangshao", "subject": "english", "publisher": "湖南少年儿童出版社", "platformName": "湘少版", "subjectName": "英语", "checkedAt": "2026-11-09"}, PLANS, "目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归湖南少年儿童出版社，不复制。");
