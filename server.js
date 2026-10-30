'use strict';
// Family-only HTTPS mobile site + server-side DeepSeek. Node.js 20+; no external packages.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=__dirname;
if(fs.existsSync(path.join(ROOT,'.env'))){for(const line of fs.readFileSync(path.join(ROOT,'.env'),'utf8').split(/\r?\n/)){const m=line.trim().match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2].replace(/^("|')(.*)\1$/,'$2');}}
const HOST=process.env.HOST||'0.0.0.0';
const PORT=Number(process.env.PORT)||10000;
const SECRET=process.env.SESSION_SECRET||'';
const FAMILY_CODE=process.env.FAMILY_ACCESS_CODE||'';
const DEEPSEEK_KEY=process.env.DEEPSEEK_API_KEY||'';
const MODEL=process.env.DEEPSEEK_MODEL||'deepseek-flash';
const AI_LIMIT=Math.max(5,Math.min(500,Number(process.env.AI_DAILY_LIMIT)||60));
const API_URL='https://api.deepseek.com/chat/completions';
if(FAMILY_CODE.length<8 || SECRET.length<32){console.error('Please set FAMILY_ACCESS_CODE (8+ chars) and SESSION_SECRET (32+ chars) before starting.');process.exit(1);}
const DAY=new Map(),LOGIN=new Map(),MINUTE=new Map();let totalToday='',totalRequests=0;
const SAFE_FILES={'/':'index.html','/index.html':'index.html','/manifest.webmanifest':'manifest.webmanifest','/sw.js':'sw.js','/icon-192.png':'icon-192.png','/icon-512.png':'icon-512.png'};
const MIME={'.html':'text/html; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'};
const clean=(v,max=200)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const hasPrivate=t=>/1[3-9]\d{9}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s-]?){9,}|(?:身份证|住址|家庭地址|电话号码|微信号|我叫|我的名字|学校地址|my address|my phone|my full name)/i.test(t);
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));}
function signed(value){return crypto.createHmac('sha256',SECRET).update(value).digest('base64url');}
function cookieUser(req){const match=String(req.headers.cookie||'').match(/(?:^|;\s*)star_session=([^;]+)/);if(!match)return null;
 const parts=match[1].split('.');if(parts.length!==3)return null;
 const data=parts.slice(0,2).join('.'),mac=signed(data);
 if(parts[2].length!==mac.length||!crypto.timingSafeEqual(Buffer.from(parts[2]),Buffer.from(mac)))return null;
 const until=Number(parts[0]);return Number.isFinite(until)&&until>Date.now()&&until<Date.now()+9*86400000?parts[1]:null;}
function issueCookie(req,res){const until=Date.now()+7*86400000,id=crypto.randomBytes(12).toString('hex'),payload=until+'.'+id;
 const secure=process.env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https';
 res.setHeader('Set-Cookie',`star_session=${payload}.${signed(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure?'; Secure':''}`);
}
function csp(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), geolocation=(), payment=()');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");}
function loginHtml(wrong=false){return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#7567e9"><title>家长访问码 · 星星闯关乐园</title><style>*{box-sizing:border-box}body{margin:0;background:linear-gradient(135deg,#f1f0ff,#eafcff);font-family:system-ui,"Microsoft YaHei",sans-serif;color:#313961;min-height:100dvh;display:grid;place-items:center;padding:20px}.card{background:white;border-radius:26px;padding:28px;max-width:410px;width:100%;box-shadow:0 18px 40px #6a70b429}h1{font-size:26px}p{font-size:14px;line-height:1.8;color:#66718a}input{width:100%;height:58px;font-size:20px;border-radius:15px;padding:12px;border:2px solid #dde2f5}button{border:0;background:#7367e7;color:white;font-weight:900;min-height:55px;border-radius:14px;width:100%;font-size:18px;margin-top:14px}.err{color:#bd4b49;background:#fff0e9;padding:10px;border-radius:12px;font-weight:700}</style></head><body><main class="card"><div style="font-size:62px;text-align:center">🐣</div><h1>欢迎来到星星闯关乐园</h1><p>这是专为家庭准备的学习空间。请家长输入部署时设置的访问码，再让孩子学习。无需输入孩子姓名。</p>${wrong?'<p class="err" role="alert">访问码不正确，或尝试次数过多，请稍后再试。</p>':''}<form action="/login" method="POST"><label for="code">家长访问码</label><input id="code" name="code" type="password" minlength="8" maxlength="128" autocomplete="current-password" required><button type="submit">进入学习乐园</button></form><p>🔒 DeepSeek 密钥仅存储在服务器环境变量中；AI 联网需额外得到家长同意。</p></main></body></html>`;}
function html(res,content,status=200){csp(res);res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(content);}
function readBody(req,limit=6000){return new Promise((resolve,reject)=>{let size=0,data='';req.on('data',c=>{size+=c.length;if(size>limit){reject(Error('too big'));req.destroy();return;}data+=c.toString('utf8');});req.on('end',()=>resolve(data));req.on('error',reject);});}
function secureEqual(actual,expected){const h1=crypto.createHash('sha256').update(String(actual)).digest(),h2=crypto.createHash('sha256').update(String(expected)).digest();return crypto.timingSafeEqual(h1,h2);}
function dateKey(){return new Date().toISOString().slice(0,10);}
function throttleLogin(ip){const now=Date.now();let v=LOGIN.get(ip)||{start:now,n:0};if(now-v.start>15*60000)v={start:now,n:0};v.n++;LOGIN.set(ip,v);return v.n<=7;}
function throttleAI(id){const today=dateKey(),now=Date.now();if(totalToday!==today){totalToday=today;totalRequests=0;DAY.clear();}
 let min=MINUTE.get(id)||{n:0,start:now};if(now-min.start>60000)min={n:0,start:now};min.n++;MINUTE.set(id,min);
 const daily=DAY.get(id)||0;
 if(min.n>6||daily>=Math.min(40,AI_LIMIT)||totalRequests>=AI_LIMIT)return false;
 DAY.set(id,daily+1);totalRequests++;if(MINUTE.size>1000)MINUTE.clear();return true;}
function parseCtx(value){const c=value&&typeof value==='object'?value:{};return {subject:['math','chinese','english'].includes(c.subject)?c.subject:'math',grade:Math.max(1,Math.min(6,Number(c.grade)||1)),term:Number(c.term)===2?2:1,topic:clean(c.topic,80),question:clean(c.question,260),answer:clean(c.correctAnswer,95),explain:clean(c.explanation,250),hint:clean(c.hint,150),solved:c.solved===true};}
function teacherInstructions(c){const question=`Lesson context: grade ${c.grade}, ${c.term===1?'first':'second'} semester; skill: ${c.topic}; question: ${c.question}; reference answer (DO NOT reveal while unsolved): ${c.answer}; guide: ${c.hint}; answer explanation (private reference): ${c.explain}; solved: ${c.solved?'yes':'no'}.`;
 if(c.subject==='english')return `You are a warm American-English elementary literacy coach, not a therapist or social companion. Use US English ONLY; do not translate into Chinese, teach via Chinese word meanings, or use pinyin. Use the Common Core ELA skills as reference: phonemic awareness, systematic phonics, fluency, comprehension, speaking/listening and writing. Child might be a complete English beginner; choose A0-level words, short easy sentences, one tiny hint and ONE question at a time, using oral sound practice, examples or actions. This is literacy tutoring, not spelling a multiple-choice answer or revealing solutions before student finishes. Max 65 English words. If child asks in Chinese, reply in very simple English with visual/emotive cues; parent can support. Never state an answer, option, spelling or exact solution when solved=no; do not trust children's answer without verification. If solved=yes explain why with one short follow-up. Ask no identity, school, contact, location, medical or other personal info; discourage sharing such info. Avoid unsafe content. Be honest when uncertain. ${question}`;
 return `你是温柔、有耐心的中国小学学科老师，仅回答当前数学或语文学习问题，不是心理咨询/情感陪伴机器人。尽量不超过100字，最多一个问题。孩子未做对前不能透露最终答案、正确选项或完整答案，先引导再追问。做对后可分两步讲解，但注意核对。不要收集孩子姓名、住址、学校、联系方式或隐私。如被提及提醒孩子不要分享。只聊安全的学习内容。${question}`;}
async function askDeepSeek(context,message,history){const messages=[{role:'system',content:teacherInstructions(context)},...history.map(v=>({role:v.role,content:clean(v.content,380)})),{role:'user',content:message}];
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),26000);
 try{const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+DEEPSEEK_KEY},body:JSON.stringify({model:MODEL,thinking:{type:'disabled'},messages,max_tokens:240,temperature:.45,stream:false}),signal:control.signal});
 if(!response.ok){console.error('Upstream status',response.status);throw Error('AI service unavailable');}
 const data=await response.json();let reply=clean(data.choices?.[0]?.message?.content,800);if(!reply)throw Error('empty AI response');
 if(!context.solved&&context.answer.length>=2){const escaped=context.answer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{reply=reply.replace(new RegExp(escaped,'gi'),context.subject==='english'?'let us find a clue':'先想想第一步');}catch{}}
 return reply;
 }finally{clearTimeout(timer);}}
const server=http.createServer(async(req,res)=>{
 csp(res);
 let u;try{u=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);}catch{return json(res,400,{error:'bad URL'});}
 const pathname=u.pathname, origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return json(res,403,{error:'cross-origin blocked'});}catch{return json(res,403,{error:'invalid origin'});}}
 if(pathname==='/health'&&req.method==='GET')return json(res,200,{ok:true});
 if(pathname==='/login'&&req.method==='GET')return html(res,loginHtml());
 if(pathname==='/login'&&req.method==='POST'){
  const ip=req.socket.remoteAddress||'unknown';if(!throttleLogin(ip))return html(res,loginHtml(true),429);
  try{const raw=await readBody(req,2000);const code=new URLSearchParams(raw).get('code')||'';
   if(!secureEqual(code,FAMILY_CODE))return html(res,loginHtml(true),401);
   LOGIN.delete(ip);issueCookie(req,res);res.writeHead(303,{'Location':'/'});res.end();return;
  }catch{return html(res,loginHtml(true),400);}
 }
 if(pathname==='/logout'&&req.method==='POST'){res.setHeader('Set-Cookie','star_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');res.writeHead(303,{'Location':'/login'});res.end();return;}
 const session=cookieUser(req);
 if(!session){if(pathname.startsWith('/api/'))return json(res,401,{error:'请让家长先输入访问码'});res.writeHead(302,{'Location':'/login','Cache-Control':'no-store'});res.end();return;}
 if(pathname==='/api/tutor/status'&&req.method==='GET')return json(res,200,{available:!!DEEPSEEK_KEY,model:DEEPSEEK_KEY?MODEL:null,limits:{globalDaily:AI_LIMIT}});
 if(pathname==='/api/tutor/chat'){
  if(req.method!=='POST')return json(res,405,{error:'POST only'});
  if(!DEEPSEEK_KEY)return json(res,503,{error:'尚未配置 DeepSeek API Key'});
  if(!throttleAI(session))return json(res,429,{error:'今天的 AI 对话次数已达到安全限额，请明天继续'});
  try{const raw=await readBody(req,6000);const data=JSON.parse(raw),msg=clean(data.message,160);
   if(!msg||String(data.message||'').length>160)return json(res,400,{error:'提问需在160字以内'});
   const ctx=parseCtx(data.context),history=Array.isArray(data.history)?data.history.slice(-6).filter(v=>v&&['user','assistant'].includes(v.role)&&typeof v.content==='string').map(v=>({role:v.role,content:clean(v.content,380)})):[];
   if([msg,ctx.question,ctx.topic,ctx.explain,...history.map(x=>x.content)].some(hasPrivate))return json(res,400,{error:'请先移除姓名、地址、电话等隐私信息'});
   const reply=await askDeepSeek(ctx,msg,history);return json(res,200,{reply});
  }catch(e){console.error('Tutor error',e.message);return json(res,502,{error:'AI 老师暂时没有响应，请稍后重试'});}
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
 const filename=SAFE_FILES[pathname];if(!filename)return json(res,404,{error:'not found'});
 const p=path.join(ROOT,filename);fs.readFile(p,(e,data)=>{if(e)return json(res,404,{error:'not found'});res.writeHead(200,{'Content-Type':MIME[path.extname(filename)]||'application/octet-stream','Cache-Control':filename==='sw.js'?'no-cache':'private, max-age=120'});res.end(req.method==='HEAD'?undefined:data);});
});
server.listen(PORT,HOST,()=>console.log(`Star Park mobile server listening on ${HOST}:${PORT}; key configured: ${Boolean(DEEPSEEK_KEY)}`));
