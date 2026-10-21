[DevPrep Launch Video.html](https://github.com/user-attachments/files/33755755/DevPrep.Launch.Video.html)# DevPrep

> AI-powered mock interview platform with real-time voice interviews,
> coding challenges, and personalized feedback.

## Demo

[![DevPrep Demo] : 

[Uploading DevPrep Launch Video.html<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>DevPrep Launch Video</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#F5F5F7;--sf:#fff;--ink:#1A1A1A;--mut:#666;--ac:#EB3A14;--ln:#E5E5E5;--ok:#22C55E;--sans:Inter,system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--e:cubic-bezier(.25,.8,.25,1)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#111;overflow:hidden;font-family:var(--sans);-webkit-font-smoothing:antialiased}
#stage{position:absolute;left:50%;top:50%;width:1280px;height:720px;background:var(--bg);color:var(--ink);overflow:hidden;transform-origin:center}
.scene{position:absolute;inset:0;display:none}.scene.on{display:flex}
.mono{font-family:var(--mono);text-transform:uppercase;letter-spacing:.1em}
.lg{width:26px;height:24px}
.nav{position:absolute;top:0;left:0;right:0;height:64px;border-bottom:1px solid var(--ln);display:flex;align-items:center;justify-content:space-between;padding:0 72px;font-weight:600;font-size:17px;font-family:var(--mono)}
.nav .l{display:flex;gap:10px;align-items:center}.nav .m{display:flex;gap:34px;font-size:11px;color:var(--mut);font-weight:500}
.btn{border-radius:999px;font-family:var(--mono);font-weight:700;font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:0 30px;height:52px;display:inline-flex;align-items:center;gap:10px}
.btn.d{background:var(--ink);color:#fff;height:38px;font-size:11px;padding:0 22px}.btn.a{background:var(--ac);color:#fff}.btn.w{background:#fff;color:var(--ink)}
/* S1 */
#s1{flex-direction:column;align-items:center;justify-content:center;gap:0;padding-top:30px}
.pill{display:inline-flex;align-items:center;gap:8px;background:#FBE6E1;color:var(--ac);border-radius:999px;font-family:var(--mono);font-size:11px;letter-spacing:.1em;padding:9px 18px;text-transform:uppercase;font-weight:500}
.pill i{width:6px;height:6px;border-radius:50%;background:var(--ac)}
h1{font-weight:700;letter-spacing:-.04em;line-height:.98;font-size:92px;text-align:center;margin:28px 0 24px}
h1 .ln{display:block;overflow:hidden;padding-bottom:6px}
h1 .ln span{display:inline-block;transform:translateY(110%);animation:mask .9s var(--e) forwards}
.g{color:var(--mut)}
#s1 .ln:nth-child(1) span{animation-delay:.5s}#s1 .ln:nth-child(2) span{animation-delay:.7s}#s1 .ln:nth-child(3) span{animation-delay:.9s}
@keyframes mask{to{transform:none}}
@keyframes up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}
#s1 .pill{animation:fade .6s .1s both}#s1 .sub{font-size:20px;color:var(--mut);letter-spacing:-.02em;animation:up .7s 1.5s both;text-align:center;line-height:1.5}
#s1 .bs{display:flex;gap:16px;margin-top:30px;animation:up .7s 2s both}#s1 .nav{animation:fade .8s 0s both}
/* S2 */
#s2{align-items:center;justify-content:center}
.panel{position:absolute;left:120px;top:150px;width:1040px;background:#FAFAFA;border:1px solid var(--ln);border-radius:12px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(0,0,0,.18);animation:up .8s both}
.ph{display:flex;justify-content:space-between;align-items:center;padding:0 32px;height:76px;border-bottom:1px solid var(--ln);font-weight:500;font-size:20px;letter-spacing:-.02em}
.sr{border:1px solid var(--ln);border-radius:8px;background:#fff;padding:11px 18px;font-size:14px;color:#999;width:270px;font-weight:400}
.grid{display:grid;grid-template-columns:repeat(4,1fr);background:#fff}
.rc{height:150px;padding:34px 30px;border-right:1px solid var(--ln);border-bottom:1px solid var(--ln);opacity:0;animation:up .6s both}
.rc:nth-child(4n){border-right:0}.rc:nth-child(n+5){border-bottom:0}
.rc small{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:#888;margin-bottom:10px;text-transform:uppercase}
.rc b{font-weight:500;font-size:20px;letter-spacing:-.02em}
.rc:nth-child(1){animation:up .6s .4s both,pick .4s 2.6s forwards}
.rc:nth-child(2){animation-delay:.5s}.rc:nth-child(3){animation-delay:.6s}.rc:nth-child(4){animation-delay:.7s}.rc:nth-child(5){animation-delay:.8s}.rc:nth-child(6){animation-delay:.9s}.rc:nth-child(7){animation-delay:1s}.rc:nth-child(8){animation-delay:1.1s}
@keyframes pick{to{background:var(--ac);color:#fff}}
.rc:nth-child(1) small{animation:sm .4s 2.6s forwards}@keyframes sm{to{color:#fff}}
.cur{position:absolute;width:44px;height:44px;left:0;top:0;border:2px solid var(--ink);border-radius:50%;margin:-22px 0 0 -22px;animation:cm 2s 1s var(--e) both;z-index:5;pointer-events:none}
.cur::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;background:var(--ink);border-radius:50%}
@keyframes cm{from{transform:translate(1060px,640px)}to{transform:translate(255px,365px)}}
#qs{position:absolute;inset:0;background:var(--bg);opacity:0;padding:90px 120px;transition:opacity .6s;pointer-events:none}
#qs.on{opacity:1}
#qs h2{font-size:56px;letter-spacing:-.04em;line-height:1;margin:22px 0 36px;font-weight:700}
.q{display:flex;gap:22px;align-items:center;background:#fff;border:1px solid var(--ln);border-radius:12px;padding:20px 24px;margin-bottom:12px;font-weight:500;font-size:19px;letter-spacing:-.02em;opacity:0}
.q em{font-style:normal;font-family:var(--mono);color:var(--ac);background:#FBE6E1;border-radius:4px;font-size:13px;font-weight:700;padding:7px 9px}
#qs.on .q{animation:up .6s both}#qs.on .q:nth-of-type(1){animation-delay:.4s}#qs.on .q:nth-of-type(2){animation-delay:.65s}#qs.on .q:nth-of-type(3){animation-delay:.9s}
/* S3 */
#s3{background:var(--bg);flex-direction:column}
.top{height:64px;background:#fff;border-bottom:1px solid var(--ln);display:flex;align-items:center;justify-content:space-between;padding:0 48px;font-size:15px;font-weight:600;flex:none}
.top .l{display:flex;gap:14px;align-items:center}.top .l span{font-weight:400;color:var(--mut);font-size:14px;display:flex;align-items:center;gap:8px;border-left:1px solid var(--ln);padding-left:14px}
.dot{width:8px;height:8px;border-radius:50%;background:var(--ok);display:inline-block}
.tabs{display:flex;gap:32px;font-size:13px;font-weight:400}.tab{width:150px}.tab div{height:4px;background:#ddd;border-radius:9px;margin-top:8px;overflow:hidden}.tab i{display:block;height:100%;background:var(--ac)}
.tm{border:1px solid var(--ln);background:var(--bg);border-radius:999px;padding:8px 18px;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums}
.body{flex:1;display:flex;gap:44px;padding:36px 170px 0}
.lc{width:440px}.rc2{width:520px}
.card{background:#fff;border:1px solid var(--ln);border-radius:14px}
.mic{display:flex;align-items:center;gap:12px;padding:0 20px;height:58px;font-weight:500;font-size:15px}
.wv{margin-left:auto;display:flex;gap:3px;align-items:center;height:26px}.wv i{width:4px;height:24px;background:var(--ac);border-radius:2px;animation:wv .7s ease-in-out infinite}
.wv i:nth-child(2){animation-delay:.1s}.wv i:nth-child(3){animation-delay:.25s}.wv i:nth-child(4){animation-delay:.05s}.wv i:nth-child(5){animation-delay:.3s}.wv i:nth-child(6){animation-delay:.18s}.wv i:nth-child(7){animation-delay:.4s}
@keyframes wv{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.cam{margin-top:16px;height:330px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;position:relative;font-weight:500;font-size:15px}
.cam .tg{position:absolute;left:16px;top:16px;border:1px solid var(--ln);border-radius:999px;padding:7px 14px;font-size:12px;font-weight:500}
.av{width:84px;height:84px;border-radius:50%;background:#E5E5E5}
.ih{display:flex;gap:14px;align-items:center;padding:4px 4px 18px}.ic{width:48px;height:48px;border-radius:50%;background:#EEE;display:grid;place-items:center;font-weight:700;font-size:18px}.ic b{color:var(--ac)}
.ih strong{display:block;font-size:15px;font-weight:600}.ih small{color:var(--ok);font-size:13px}
.bub{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:18px 20px;font-size:15.5px;line-height:1.45;max-width:440px;min-height:60px;margin-bottom:14px;display:none}
.bub.on{display:block;animation:up .4s both}.bub.me{margin-left:auto;background:var(--ink);color:#fff;border-color:var(--ink)}
.bub small{display:block;color:#999;font-size:11px;margin-top:8px}.me small{color:#999}
.qn{position:absolute;left:170px;bottom:36px;font-size:13px;color:var(--mut)}
.bot{height:58px;background:#fff;border-top:1px solid var(--ln);display:flex;align-items:center;justify-content:space-between;padding:0 48px;font-size:14px;color:var(--mut);flex:none}
.bot .r{display:flex;gap:12px}.bot .r span{border:1px solid var(--ln);border-radius:999px;padding:9px 20px;color:var(--ink);font-weight:500}
/* S4 */
#s4{align-items:center;justify-content:center;flex-direction:column;text-align:center}
.it{display:none;flex-direction:column;align-items:center;gap:20px}.it.on{display:flex}
.it .pill{animation:fade .5s both}.it h2{font-size:104px;letter-spacing:-.045em;line-height:.95;font-weight:700;overflow:hidden;padding-bottom:8px}
.it h2 span{display:inline-block;transform:translateY(110%);animation:mask .8s .1s var(--e) forwards}
.it p{font-size:22px;color:var(--mut);letter-spacing:-.02em;animation:up .6s .6s both}
/* S5 */
#s5{padding:36px;background:var(--bg)}
.dk{flex:1;background:var(--ink);border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;color:#fff}
.dk .lg{width:64px;height:59px;animation:up .8s both}
.dk .wm{font-family:var(--mono);font-weight:700;font-size:22px;margin:14px 0 30px;animation:up .8s .2s both}
.dk h2{font-size:84px;letter-spacing:-.045em;line-height:1;font-weight:700;text-align:center;animation:up .9s .5s both}.dk h2 .g{color:#8a8a8a}
.dk .btn{margin-top:36px;animation:up .8s 1.1s both}.dk small{margin-top:22px;color:#8a8a8a;font-size:11px;animation:up .8s 1.4s both}
#rp{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:none;background:#fff;color:var(--ink);border:0;border-radius:999px;padding:12px 26px;font:700 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
#rp:focus-visible{outline:3px solid var(--ac)}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute"><symbol id="lg" viewBox="0 0 109 100"><path d="M0 11H59A39 39 0 0 1 59 89H27" fill="none" stroke="currentColor" stroke-width="22" stroke-linejoin="round"/><rect x="0" y="53" width="27" height="25" rx="5" fill="currentColor"/></symbol></svg>
<div id="stage">

<section class="scene" id="s1">
  <div class="nav"><div class="l"><svg class="lg"><use href="#lg"/></svg>DevPrep</div><div class="m mono"><span>Features</span><span>How it works</span><span>Pricing</span><span>FAQ</span></div><span class="btn d">Start practicing</span></div>
  <span class="pill"><i></i>AI-powered mock interviews</span>
  <h1><span class="ln"><span>Walk into your next</span></span><span class="ln"><span>interview <span class="g" style="animation:none;transform:none">already knowing</span></span></span><span class="ln"><span class="g">what's coming.</span></span></h1>
  <p class="sub">Pick a role or upload your resume, practice with Zara your AI<br>interviewer, get instant feedback.</p>
  <div class="bs"><span class="btn a">Start practicing →</span><span class="btn w">See how it works</span></div>
</section>

<section class="scene" id="s2">
  <div class="panel">
    <div class="ph"><span>Choose Your Interview Role</span><span class="sr">Search roles...</span></div>
    <div class="grid">
      <div class="rc"><small>Engineering</small><b>Frontend Engineer</b></div>
      <div class="rc"><small>Engineering</small><b>Backend Engineer</b></div>
      <div class="rc"><small>Engineering</small><b>Full Stack Developer</b></div>
      <div class="rc"><small>Engineering</small><b>System Design</b></div>
      <div class="rc"><small>Data</small><b>ML Engineer</b></div>
      <div class="rc"><small>Data</small><b>Data Engineer</b></div>
      <div class="rc"><small>Product</small><b>Product Manager</b></div>
      <div class="rc"><small>Behavioral</small><b>Behavioral Round</b></div>
    </div>
  </div>
  <div class="cur"></div>
  <div id="qs">
    <span class="pill">20 mins practice interview</span>
    <h2>Front-End Developer<br><span class="g">interview questions &amp; AI practice.</span></h2>
    <div class="q"><em>01</em>What best practices should be followed for maintaining scalable CSS/JS codebases?</div>
    <div class="q"><em>02</em>How do you ensure cross-browser compatibility in complex front-end projects?</div>
    <div class="q"><em>03</em>What advanced JavaScript concepts should be mastered for efficient front-end development?</div>
  </div>
</section>

<section class="scene" id="s3">
  <div class="top"><div class="l"><svg class="lg"><use href="#lg"/></svg>DevPrep<span><i class="dot"></i>Front-End Developer</span></div>
    <div class="tabs"><div class="tab">HTML/CSS proficiency<div><i style="width:100%"></i></div></div><div class="tab">JavaScript expertise<div><i id="pg" style="width:12%"></i></div></div><div class="tab">React &amp; frameworks<div></div></div></div>
    <div class="tm" id="tm">00:28</div></div>
  <div class="body">
    <div class="lc"><div class="card mic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EB3A14" stroke-width="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>Mic active<div class="wv"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
      <div class="card cam"><span class="tg">● Camera preview</span><div class="av"></div>Camera is off</div></div>
    <div class="rc2"><div class="ih"><div class="ic">D<b>.</b></div><div><strong>DevPrep Interviewer</strong><small id="st">Zara is speaking...</small></div></div>
      <div class="bub" id="b1"><span id="t1"></span><small>15:22</small></div>
      <div class="bub me" id="b2"><span id="t2"></span><small>15:22</small></div></div>
  </div>
  <div class="qn">Question 2 of 10</div>
  <div class="bot"><span><i class="dot"></i>&nbsp; Live session · Front-End Developer</span><div class="r"><span>Having trouble?</span><span>End interview</span></div></div>
</section>

<section class="scene" id="s4">
  <div class="it"><span class="pill">One</span><h2><span>24+ roles.</span></h2><p>Engineering, data, design, product and behavioral.</p></div>
  <div class="it"><span class="pill">Two</span><h2><span>Zara asks.<span class="g"> You answer.</span></span></h2><p>A real voice conversation, not a quiz.</p></div>
  <div class="it"><span class="pill">Three</span><h2><span>Instant <span class="g">feedback.</span></span></h2><p>Know your gaps before the real interview.</p></div>
</section>

<section class="scene" id="s5"><div class="dk">
  <svg class="lg"><use href="#lg"/></svg><div class="wm">DevPrep</div>
  <h2>Practice like it's<br><span class="g">the real thing.</span></h2>
  <span class="btn a">Start practicing — it's free →</span><small class="mono">Free to start · No credit card required</small>
</div></section>
</div>
<button id="rp" type="button">Replay</button>
<script>
const $=s=>document.querySelector(s),sc=[...document.querySelectorAll('.scene')],st=$('#stage');
let T=[];
const at=(ms,f)=>T.push(setTimeout(f,ms));
const show=i=>sc.forEach((s,k)=>s.classList.toggle('on',k===i));
function fit(){const k=Math.min(innerWidth/1280,innerHeight/720);st.style.transform='translate(-50%,-50%) scale('+k+')'}
addEventListener('resize',fit);fit();
function typeIn(el,txt,start,cps){el.textContent='';[...txt].forEach((c,i)=>at(start+i*1000/cps,()=>el.textContent+=c))}
function play(){
  T.forEach(clearTimeout);T=[];
  $('#rp').style.display='none';$('#qs').classList.remove('on');
  $('#b1').classList.remove('on');$('#b2').classList.remove('on');
  $('#st').textContent='Zara is speaking...';$('#tm').textContent='00:28';$('#pg').style.width='12%';
  sc.forEach(s=>s.classList.remove('on'));
  void st.offsetWidth;
  show(0);
  at(5000,()=>show(1));
  at(9400,()=>$('#qs').classList.add('on'));
  at(11500,()=>{
    show(2);
    at0(300,()=>{$('#b1').classList.add('on');typeIn($('#t1'),"Hi, I'm Zara, your AI interviewer at DevPrep. Tell me about yourself.",0,34)});
    at0(2900,()=>{$('#st').textContent='Listening to your response...'});
    at0(4000,()=>{$('#b2').classList.add('on');typeIn($('#t2'),"I'm a full-stack developer. I build with TypeScript, Next.js and Node.",0,32)});
    for(let i=1;i<=9;i++)at0(i*1000,()=>{$('#tm').textContent='00:'+String(28+i).padStart(2,'0')});
    at0(7000,()=>$('#pg').style.width='45%');
  });
  at(20500,()=>{show(3);const it=[...document.querySelectorAll('.it')];it.forEach(e=>e.classList.remove('on'));
    it[0].classList.add('on');at0(2000,()=>{it[0].classList.remove('on');it[1].classList.add('on')});at0(4000,()=>{it[1].classList.remove('on');it[2].classList.add('on')})});
  at(26800,()=>show(4));
  at(33500,()=>$('#rp').style.display='block');
}
let base=0;
function at0(ms,f){T.push(setTimeout(f,ms))}
$('#rp').onclick=play;
addEventListener('keydown',e=>{if(e.key==='r'||e.key==='R')play()});
document.fonts.ready.then(()=>setTimeout(play,300));
</script>
</body>
</html>
…]()


## Architecture

![DevPrep Architecture](<img width="1940" height="1162" alt="image" src="https://github.com/user-attachments/assets/89457160-2594-4bc2-95ee-b62ef92381bf" />
)

### How It Works

1. The candidate speaks through the browser.
2. Silero VAD detects the end of the speech.
3. PCM audio is sent to the WebSocket server.
4. Groq Whisper converts speech to text.
5. Gemini generates the AI interviewer's response.
6. Deepgram converts the response into speech.
7. PCM audio is streamed back to the browser.
8. The interview continues in real time.

## Features

- Real-time AI voice interviews
- Context-aware follow-up questions
- Speech-to-text with Groq Whisper
- AI interviewer powered by Gemini
- Streaming TTS with Deepgram
- Browser-side voice activity detection
- Coding interview support
- AI-powered interview feedback
- Interview history and progress tracking

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Real-time | WebSocket, Web Audio API, PCM |
| AI | Groq Whisper, Gemini, Deepgram |
| VAD | Silero VAD, ONNX Runtime |
| Tooling | pnpm, Vercel, Railway |

## Project Structure

```text
apps/
├── web/          # Next.js frontend
├── ws-server/    # Real-time WebSocket server
└── http-server/  # REST API

packages/         # Shared packages
prisma/           # Database schema & migrations


git clone https://github.com/Furqan-7/devprep.git
cd devprep
pnpm install
cp .env.example .env
pnpm dev

DATABASE_URL=
GROQ_API_KEY=
GEMINI_API_KEY=
DEEPGRAM_API_KEY=


This keeps the README focused on **what DevPrep is, how it works, its architecture, features, and stack**, without turning it into technical documentation.
