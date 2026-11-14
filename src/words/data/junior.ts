/**
 * 单词卡 · 初中七～九年级（V5.2）。
 * 按《义务教育英语课程标准（2022 年版）》初中阶段常用词由本项目原创分组（按话题），**不对应某一版课本的单元**；
 * 中文意思和例句为本项目原创。音标由 tools/words/phonetics.py 从 CMU 发音词典生成。
 * 每行：单词|中文意思|例句|例句中文
 */
import type { RawUnit } from './types';

export const JUNIOR_WORDS: RawUnit[] = [
  /* ───── 七年级 ───── */
  {
    id: 'jh7-1', grade: 7, book: '七年级', title: 'School life',
    lines: `
subject|学科|Maths is my favourite subject.|数学是我最喜欢的学科。
timetable|课程表|Let's look at the timetable.|我们看看课程表吧。
lesson|一节课|We have six lessons today.|今天我们有六节课。
classmate|同班同学|Tom is my classmate.|汤姆是我的同班同学。
dictionary|词典|I look up new words in the dictionary.|我在词典里查生词。
homework|家庭作业|I finish my homework after dinner.|我晚饭后完成家庭作业。
library|图书馆|We borrow books from the library.|我们从图书馆借书。
playground|操场|They are running on the playground.|他们在操场上跑步。
uniform|校服|We wear school uniforms on Monday.|我们星期一穿校服。
practise|练习|I practise English every day.|我每天练习英语。
remember|记得|Remember to bring your book.|记得带上你的书。
forget|忘记|Don't forget your homework.|别忘了你的作业。`,
  },
  {
    id: 'jh7-2', grade: 7, book: '七年级', title: 'Me and my family', theme: 'family',
    lines: `
parent|父亲或母亲|My parents are teachers.|我的父母是老师。
cousin|堂（表）兄弟姐妹|My cousin lives in Beijing.|我的表哥住在北京。
uncle|叔叔；舅舅|My uncle is a doctor.|我叔叔是医生。
aunt|阿姨；姑姑|My aunt can cook very well.|我姑姑做饭很好吃。
grandparent|祖父母；外祖父母|I visit my grandparents on Sundays.|我星期天去看望祖父母。
age|年龄|What's your age?|你多大了？
hobby|爱好|My hobby is reading.|我的爱好是读书。
birthday|生日|Happy birthday to you!|祝你生日快乐！
friendly|友好的|Our neighbours are very friendly.|我们的邻居很友好。
outgoing|外向的|She is outgoing and likes to talk.|她很外向，喜欢说话。
quiet|安静的|My brother is a quiet boy.|我弟弟是个安静的男孩。
together|一起|We often have dinner together.|我们经常一起吃晚饭。`,
  },
  {
    id: 'jh7-3', grade: 7, book: '七年级', title: 'Food and health',
    lines: `
breakfast|早餐|I have milk and bread for breakfast.|我早餐吃面包、喝牛奶。
lunch|午餐|We have lunch at school.|我们在学校吃午饭。
dinner|晚餐|Dinner is ready!|晚饭好了！
vegetable|蔬菜|Eat more vegetables.|多吃蔬菜。
fruit|水果|Apples are my favourite fruit.|苹果是我最喜欢的水果。
healthy|健康的|Running keeps me healthy.|跑步让我保持健康。
habit|习惯|Getting up early is a good habit.|早起是个好习惯。
exercise|锻炼|I exercise for an hour every day.|我每天锻炼一个小时。
hungry|饥饿的|I'm hungry. Let's eat.|我饿了，我们吃饭吧。
thirsty|口渴的|I'm thirsty. Can I have some water?|我渴了，能喝点水吗？
delicious|美味的|The noodles are delicious.|这面条真好吃。
sugar|糖|Too much sugar is bad for your teeth.|吃太多糖对牙齿不好。`,
  },
  {
    id: 'jh7-4', grade: 7, book: '七年级', title: 'Animals and nature',
    lines: `
animal|动物|The panda is a lovely animal.|大熊猫是一种可爱的动物。
elephant|大象|The elephant has a long nose.|大象有长长的鼻子。
giraffe|长颈鹿|The giraffe is very tall.|长颈鹿很高。
dolphin|海豚|Dolphins are very clever.|海豚很聪明。
forest|森林|Many animals live in the forest.|很多动物生活在森林里。
river|河|There is a river near my home.|我家附近有一条河。
mountain|山|We climbed the mountain last week.|我们上周爬了山。
protect|保护|We should protect wild animals.|我们应该保护野生动物。
danger|危险|Some animals are in danger.|一些动物处在危险中。
wild|野生的|Tigers are wild animals.|老虎是野生动物。
plant|植物；种植|Let's plant some trees.|我们种些树吧。
nature|大自然|I love nature.|我热爱大自然。`,
  },
  {
    id: 'jh7-5', grade: 7, book: '七年级', title: 'Time and travel', theme: 'time',
    lines: `
calendar|日历|There is a calendar on the wall.|墙上有一本日历。
holiday|假期|We had a great holiday.|我们度过了一个很棒的假期。
weekend|周末|What do you do on weekends?|你周末做什么？
trip|旅行|We went on a school trip.|我们参加了学校组织的旅行。
station|车站|The train station is very big.|火车站很大。
airport|机场|My dad drove me to the airport.|爸爸开车送我去机场。
ticket|票|I bought two tickets for the film.|我买了两张电影票。
map|地图|Let's look at the map.|我们看看地图吧。
early|早的|I get up early every morning.|我每天早上起得很早。
late|晚的；迟的|Don't be late for school.|上学别迟到。
minute|分钟|Wait a minute, please.|请稍等一会儿。
hour|小时|It takes an hour to get there.|到那里要一个小时。`,
  },
  {
    id: 'jh7-6', grade: 7, book: '七年级', title: 'Places in town',
    lines: `
neighbourhood|街区；邻近地区|My neighbourhood is very quiet.|我住的街区很安静。
hospital|医院|My mother works in a hospital.|我妈妈在医院工作。
museum|博物馆|We visited the science museum.|我们参观了科学博物馆。
supermarket|超市|I buy fruit at the supermarket.|我在超市买水果。
restaurant|餐馆|Let's have dinner at a restaurant.|我们去餐馆吃晚饭吧。
bank|银行|The bank is next to the post office.|银行在邮局旁边。
street|街道|Walk along the street.|沿着这条街走。
corner|拐角|The shop is on the corner.|商店在拐角处。
cross|穿过|Cross the road carefully.|过马路要小心。
straight|一直；笔直地|Go straight and turn left.|一直走，然后左转。
between|在……之间|The park is between the bank and the school.|公园在银行和学校之间。
opposite|在……对面|The library is opposite the hospital.|图书馆在医院对面。`,
  },
  /* ───── 八年级 ───── */
  {
    id: 'jh8-1', grade: 8, book: '八年级', title: 'Festivals and culture',
    lines: `
festival|节日|The Spring Festival is very important in China.|春节在中国很重要。
celebrate|庆祝|We celebrate the festival with our family.|我们和家人一起庆祝节日。
tradition|传统|Eating dumplings is a tradition.|吃饺子是一种传统。
culture|文化|I want to learn about Chinese culture.|我想了解中国文化。
lantern|灯笼|There are red lanterns everywhere.|到处都是红灯笼。
dragon|龙|We watched the dragon boat race.|我们观看了龙舟赛。
moon|月亮|The moon is round tonight.|今晚月亮很圆。
gift|礼物|Thank you for the gift.|谢谢你的礼物。
custom|风俗|Every country has its own customs.|每个国家都有自己的风俗。
special|特别的|Today is a special day.|今天是个特别的日子。
invite|邀请|I want to invite you to my party.|我想邀请你来参加我的聚会。
wish|祝愿；希望|Best wishes to you!|向你致以最美好的祝愿！`,
  },
  {
    id: 'jh8-2', grade: 8, book: '八年级', title: 'Learning and growing',
    lines: `
improve|提高|I want to improve my English.|我想提高我的英语水平。
pronunciation|发音|Your pronunciation is very good.|你的发音很好。
grammar|语法|Grammar is not easy for me.|语法对我来说不容易。
patient|有耐心的|Our teacher is very patient.|我们的老师很有耐心。
progress|进步|You have made great progress.|你取得了很大的进步。
mistake|错误|Everyone makes mistakes.|每个人都会犯错。
advice|建议|Can you give me some advice?|你能给我一些建议吗？
confident|自信的|Be confident in yourself.|要对自己有信心。
review|复习|I review my lessons every evening.|我每天晚上复习功课。
note|笔记|Take notes in class.|上课要记笔记。
method|方法|This is a good learning method.|这是一个好的学习方法。
succeed|成功|If you work hard, you will succeed.|如果你努力，你会成功的。`,
  },
  {
    id: 'jh8-3', grade: 8, book: '八年级', title: 'Jobs and volunteering',
    lines: `
job|工作|What job do you want to do?|你想做什么工作？
engineer|工程师|My father is an engineer.|我爸爸是一名工程师。
scientist|科学家|I want to be a scientist.|我想成为一名科学家。
nurse|护士|The nurse is kind to the patients.|这位护士对病人很好。
volunteer|志愿者；自愿做|I volunteer at the library on Sundays.|我星期天在图书馆做志愿者。
community|社区|We help old people in our community.|我们帮助社区里的老人。
raise|筹集；举起|We raised money for the poor children.|我们为贫困儿童筹了款。
lonely|孤独的|The old man feels lonely.|那位老人感到孤独。
experience|经历；经验|It was a great experience.|那是一次很棒的经历。
skill|技能|Cooking is a useful skill.|做饭是一项有用的技能。
future|将来|What will you do in the future?|你将来要做什么？
dream|梦想|My dream is to be a teacher.|我的梦想是当老师。`,
  },
  {
    id: 'jh8-4', grade: 8, book: '八年级', title: 'Sports and safety',
    lines: `
match|比赛|We won the football match.|我们赢了足球比赛。
team|队|Our team is the best.|我们队是最棒的。
coach|教练|The coach is very strict.|教练很严格。
champion|冠军|She became the champion.|她成了冠军。
practice|练习|Practice makes perfect.|熟能生巧。
safety|安全|Safety comes first.|安全第一。
careful|小心的|Be careful when you cross the road.|过马路时要小心。
rule|规则|We must follow the rules.|我们必须遵守规则。
helmet|头盔|Wear a helmet when you ride a bike.|骑车时要戴头盔。
accident|事故|There was an accident on the road.|路上发生了一起事故。
injure|使受伤|He injured his leg in the game.|他在比赛中伤了腿。
fall|落下；摔倒|Be careful not to fall.|小心别摔倒。`,
  },
  {
    id: 'jh8-5', grade: 8, book: '八年级', title: 'The environment',
    lines: `
environment|环境|We should protect the environment.|我们应该保护环境。
pollution|污染|Air pollution is a big problem.|空气污染是个大问题。
rubbish|垃圾|Don't throw rubbish everywhere.|不要到处扔垃圾。
recycle|回收利用|We can recycle paper and bottles.|我们可以回收纸张和瓶子。
energy|能源；精力|Save energy by turning off the lights.|随手关灯，节约能源。
waste|浪费|Don't waste water.|不要浪费水。
plastic|塑料|Use fewer plastic bags.|少用塑料袋。
earth|地球|The earth is our home.|地球是我们的家园。
climate|气候|The climate is getting warmer.|气候正在变暖。
reduce|减少|We should reduce waste.|我们应该减少浪费。
clean|干净的；打扫|Let's keep the river clean.|让我们保持河流干净。
green|绿色的；环保的|Let's live a green life.|让我们过绿色环保的生活。`,
  },
  {
    id: 'jh8-6', grade: 8, book: '八年级', title: 'Natural wonders and disasters',
    lines: `
wonder|奇迹|The Great Wall is a wonder of the world.|长城是世界奇迹。
desert|沙漠|It is very dry in the desert.|沙漠里很干燥。
ocean|海洋|The Pacific is the biggest ocean.|太平洋是最大的海洋。
waterfall|瀑布|The waterfall is very beautiful.|这个瀑布很美。
earthquake|地震|An earthquake hit the city.|一场地震袭击了这座城市。
flood|洪水|The flood destroyed many houses.|洪水毁坏了很多房子。
storm|暴风雨|A big storm is coming.|一场大暴风雨就要来了。
rescue|营救|The workers rescued many people.|工人们营救了很多人。
survive|幸存|Luckily, everyone survived.|幸运的是，大家都活了下来。
calm|镇静的|Stay calm and listen to the teacher.|保持镇静，听老师的。
shake|摇动|The ground began to shake.|地面开始晃动。
deep|深的|The lake is very deep.|这个湖很深。`,
  },
  /* ───── 九年级 ───── */
  {
    id: 'jh9-1', grade: 9, book: '九年级', title: 'Health and feelings',
    lines: `
stress|压力|Exams can bring a lot of stress.|考试会带来很大压力。
relax|放松|Listening to music helps me relax.|听音乐帮助我放松。
nervous|紧张的|I was nervous before the exam.|考试前我很紧张。
worried|担心的|Don't be worried. You can do it.|别担心，你能做到的。
proud|自豪的|My parents are proud of me.|我父母为我感到自豪。
energetic|精力充沛的|He is always energetic.|他总是精力充沛。
balanced|均衡的|Have a balanced diet.|饮食要均衡。
sleep|睡眠；睡觉|Teenagers need enough sleep.|青少年需要充足的睡眠。
medicine|药|Take the medicine three times a day.|这药一天吃三次。
cough|咳嗽|I have a bad cough.|我咳嗽得很厉害。
fever|发烧|She has a high fever.|她发高烧了。
recover|康复|I hope you recover soon.|希望你早日康复。`,
  },
  {
    id: 'jh9-2', grade: 9, book: '九年级', title: 'Communication',
    lines: `
communicate|交流|We communicate by email.|我们通过电子邮件交流。
message|消息|Please leave a message.|请留言。
discuss|讨论|Let's discuss the problem.|我们讨论一下这个问题吧。
explain|解释|Can you explain this word?|你能解释一下这个词吗？
express|表达|It's hard to express my feelings.|我的感受很难表达出来。
opinion|看法|What's your opinion?|你的看法是什么？
agree|同意|I agree with you.|我同意你的看法。
argue|争论|Don't argue with your friends.|别和朋友争吵。
language|语言|English is a useful language.|英语是一门有用的语言。
conversation|对话|We had a long conversation.|我们聊了很久。
polite|有礼貌的|It's polite to say "thank you".|说“谢谢”是有礼貌的。
misunderstand|误解|Please don't misunderstand me.|请不要误解我。`,
  },
  {
    id: 'jh9-3', grade: 9, book: '九年级', title: 'Arts and literature',
    lines: `
art|艺术|Music is a kind of art.|音乐是一种艺术。
painting|绘画；油画|This painting is very famous.|这幅画很有名。
artist|艺术家|She wants to be an artist.|她想成为一名艺术家。
poem|诗|Li Bai wrote many poems.|李白写了很多诗。
novel|长篇小说|I'm reading an English novel.|我在读一本英文小说。
writer|作家|Lu Xun is a great writer.|鲁迅是一位伟大的作家。
character|人物；汉字|Who is your favourite character in the story?|故事里你最喜欢哪个人物？
imagination|想象力|Children have rich imagination.|孩子们有丰富的想象力。
perform|表演|We will perform a play.|我们将表演一个话剧。
concert|音乐会|We went to a concert last night.|我们昨晚去听了音乐会。
create|创造|Artists create beautiful works.|艺术家创造美丽的作品。
enrich|使丰富|Reading enriches our lives.|阅读丰富我们的生活。`,
  },
  {
    id: 'jh9-4', grade: 9, book: '九年级', title: 'Great people and inventions',
    lines: `
invent|发明|Who invented the telephone?|谁发明了电话？
invention|发明物|Paper is a great Chinese invention.|纸是中国的伟大发明。
inventor|发明家|Edison was a great inventor.|爱迪生是一位伟大的发明家。
discover|发现|Scientists discovered a new star.|科学家发现了一颗新星。
achieve|实现；达到|She achieved her dream.|她实现了自己的梦想。
brave|勇敢的|The firefighter was very brave.|那位消防员非常勇敢。
determined|坚定的|He was determined to succeed.|他决心要成功。
example|榜样；例子|She sets a good example for us.|她为我们树立了好榜样。
respect|尊敬|We should respect our teachers.|我们应该尊敬老师。
spirit|精神|We should learn from his spirit.|我们应该学习他的精神。
develop|发展|China is developing fast.|中国发展得很快。
technology|技术|Technology makes life easier.|技术让生活更便利。`,
  },
  {
    id: 'jh9-5', grade: 9, book: '九年级', title: 'Science and the future',
    lines: `
science|科学|I'm interested in science.|我对科学感兴趣。
experiment|实验|We did an experiment in class.|我们在课上做了一个实验。
research|研究|They are doing research on robots.|他们正在研究机器人。
space|太空|Astronauts live in space for months.|宇航员在太空生活好几个月。
planet|行星|The earth is a planet.|地球是一颗行星。
robot|机器人|Robots can do many jobs.|机器人能做很多工作。
computer|电脑|I use the computer to study.|我用电脑学习。
internet|互联网|We can find information on the internet.|我们可以在互联网上查找信息。
possible|可能的|Everything is possible.|一切皆有可能。
predict|预测|It's hard to predict the future.|未来很难预测。
improve|改善|Science improves our lives.|科学改善我们的生活。
truth|真理；真相|Scientists look for the truth.|科学家追求真理。`,
  },
  {
    id: 'jh9-6', grade: 9, book: '九年级', title: 'Money and choices',
    lines: `
money|钱|Don't waste your money.|别乱花钱。
spend|花费|I spend ten yuan on books every week.|我每周花十元买书。
save|节省；储蓄|I save money for a new bike.|我存钱买新自行车。
cost|花费；价钱|How much does it cost?|它多少钱？
price|价格|The price is too high.|价格太高了。
cheap|便宜的|These shoes are cheap.|这双鞋很便宜。
expensive|昂贵的|The phone is too expensive.|这部手机太贵了。
value|价值|Health has great value.|健康很有价值。
choice|选择|It's a hard choice.|这是个艰难的选择。
decide|决定|I decided to study harder.|我决定更加努力学习。
plan|计划|Make a plan before you start.|开始之前先做计划。
borrow|借（入）|Can I borrow your pen?|我能借你的笔吗？`,
  },
];
