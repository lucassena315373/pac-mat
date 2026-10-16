const COLS=21,ROWS=15;
const DIFFICULTIES={
  facil:{label:"Fácil",ghostInterval:760,chaseChance:.45,randomChance:.55},
  medio:{label:"Médio",ghostInterval:560,chaseChance:.72,randomChance:.28},
  dificil:{label:"Difícil",ghostInterval:390,chaseChance:.92,randomChance:.08}
};
const MAZE_TEMPLATE=["#####################","#...................#","#.###.#####.#####.#.#","#...#.....#.....#...#","###.#.###.#.###.###.#","#...#...#...#...#...#","#.#####.#####.#####.#","#...................#","#.#####.#####.#####.#","#...#...#...#...#...#","###.#.###.#.###.###.#","#...#.....#.....#...#","#.###.#####.#####.###","#...................#","#####################"];
const EXIT_POSITIONS=[{key:"A",row:0,col:5,color:"#28e86b",side:"top"},{key:"B",row:0,col:17,color:"#ff315b",side:"top"},{key:"C",row:14,col:5,color:"#1689ff",side:"bottom"},{key:"D",row:14,col:17,color:"#9b32ff",side:"bottom"}];
const CENTER={row:7,col:10};
const state={level:0,score:0,lives:5,secondsLeft:getPhaseTime(),totalElapsed:0,timerId:null,ghostTimerId:null,countdownTimerId:null,maze:[],player:{...CENTER},ghosts:[],running:false,transition:false,gameQuestions:[],difficulty:"medio",captured:false};
const $=id=>document.getElementById(id);
const showScreen=id=>{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active')};
const formatTime=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const q=()=>state.gameQuestions[state.level];

function getPhaseTime(){
  const minutes=Math.max(1,Math.min(60,Number(getSettings().phaseTimeMinutes)||3));
  return Math.round(minutes*60);
}

function updateHUD(){
  $('lives').textContent=state.lives;
  $('score').textContent=state.score;
  $('timer').textContent=formatTime(state.secondsLeft);
  $('level').textContent=state.level+1;
  $('totalLevels').textContent=state.gameQuestions.length;
  $('difficultyHud').textContent=DIFFICULTIES[state.difficulty].label;
}

function stopTimers(){
  clearInterval(state.timerId);
  clearInterval(state.ghostTimerId);
  clearInterval(state.countdownTimerId);
  state.timerId=null;state.ghostTimerId=null;state.countdownTimerId=null;
}

function startCountdown(onFinish){
  const overlay=$('countdownOverlay'), number=$('countdownNumber'), question=$('countdownQuestion');
  clearInterval(state.countdownTimerId);
  question.textContent=q()?.question||'';
  number.className='countdown-number';
  number.textContent='3';
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden','false');
  state.running=false;
  let value=3;
  state.countdownTimerId=setInterval(()=>{
    value--;
    if(value>0){
      number.className='countdown-number';
      number.textContent=String(value);
      return;
    }
    if(value===0){
      number.className='countdown-number start-text';
      number.textContent='COMEÇAR!';
      return;
    }
    clearInterval(state.countdownTimerId);
    state.countdownTimerId=null;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden','true');
    if(typeof onFinish==='function')onFinish();
  },1000);
}

function startTimers(){
  stopTimers();
  state.timerId=setInterval(()=>{
    if(!state.running||state.transition)return;
    state.secondsLeft--;
    state.totalElapsed++;
    updateHUD();
    if(state.secondsLeft<=0)timeUp();
  },1000);
  state.ghostTimerId=setInterval(moveGhosts,DIFFICULTIES[state.difficulty].ghostInterval);
}

function buildMaze(){
  const g=MAZE_TEMPLATE.map(r=>r.split(''));
  EXIT_POSITIONS.forEach(e=>{if(e.side==='top')g[1][e.col]='.';else g[13][e.col]='.';g[e.row][e.col]='.';});
  g[CENTER.row][CENTER.col]='.';
  return g;
}
function walkable(r,c){return r>=0&&r<ROWS&&c>=0&&c<COLS&&state.maze[r][c]!=='#';}

function renderQuestion(){
  $('questionText').textContent=q().question;
  const box=$('answerChoices');box.innerHTML='';
  q().options.forEach((a,i)=>{const d=document.createElement('div');d.className='answer';d.innerHTML=`<span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(a)}</span>`;box.appendChild(d)});
  updateHUD();
}

function setupLevel(){
  state.maze=buildMaze();
  state.player={...CENTER};
  state.ghosts=[
    {row:3,col:9,color:'#ff315b',home:{row:3,col:9}},
    {row:5,col:15,color:'#ff71b8',home:{row:5,col:15}},
    {row:9,col:7,color:'#30c9ff',home:{row:9,col:7}},
    {row:11,col:15,color:'#ff9c34',home:{row:11,col:15}}
  ];
  state.secondsLeft=getPhaseTime();
  state.captured=false;
  renderMaze();
  updateHUD();
}

function renderMaze(){
  const el=$('maze');el.innerHTML='';
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const cell=document.createElement('div');
    cell.className='cell '+(state.maze[r][c]==='#'?'wall':'floor');
    const ex=EXIT_POSITIONS.find(e=>e.row===r&&e.col===c);
    if(state.maze[r][c]!=='#'&&!ex)cell.classList.add('dot');
    if(ex){cell.className='cell exit';cell.style.setProperty('--exit-color',ex.color);cell.innerHTML=`<div class="exit-content"><b>${ex.key}</b><small>${escapeHtml(q().options[ex.key.charCodeAt(0)-65])}</small></div>`}
    if(state.player.row===r&&state.player.col===c){cell.classList.remove('dot');cell.classList.add('player');}
    const ghosts=state.ghosts.filter(g=>g.row===r&&g.col===c);
    if(ghosts.length){cell.classList.remove('dot');cell.classList.add('ghost');cell.style.setProperty('--ghost',ghosts[0].color);cell.innerHTML='<span class="ghost-eyes"></span>';}
    el.appendChild(cell);
  }
}

function movePlayer(dr,dc){
  if(!state.running||state.transition)return;
  const r=state.player.row+dr,c=state.player.col+dc;
  if(!walkable(r,c))return;
  state.player={row:r,col:c};
  const ex=EXIT_POSITIONS.find(e=>e.row===r&&e.col===c);
  if(ex){handleExit(ex.key);return;}
  checkGhostCollision();
  if(state.running)renderMaze();
}

function checkGhostCollision(){
  if(state.ghosts.some(g=>g.row===state.player.row&&g.col===state.player.col))loseLife();
}

function loseLife(reason="captured"){
  if(state.transition||state.captured)return;
  state.captured=true;
  state.running=false;
  state.lives--;
  updateHUD();
  $('maze').classList.add('shake');
  setTimeout(()=>$('maze').classList.remove('shake'),400);
  if(state.lives<=0){
    stopTimers();
    $('gameOverScore').textContent=state.score;
    $('gameOverReason').textContent=reason==='timeout'?'O tempo das vidas acabou.':'Os fantasmas pegaram você 5 vezes.';
    showScreen('gameOverScreen');
    return;
  }
  // O personagem sempre volta para o centro após ser capturado.
  setTimeout(()=>{
    state.player={...CENTER};
    state.ghosts.forEach(g=>{g.row=g.home.row;g.col=g.home.col;});
    state.secondsLeft=getPhaseTime();
    state.captured=false;
    state.running=true;
    renderMaze();
    updateHUD();
  },650);
}

function timeUp(){
  if(!state.running||state.transition)return;
  loseLife("timeout");
}

function moveGhosts(){
  if(!state.running||state.transition||state.captured)return;
  const cfg=DIFFICULTIES[state.difficulty];
  state.ghosts.forEach(g=>{
    let choices=[[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>({dr,dc})).filter(m=>walkable(g.row+m.dr,g.col+m.dc));
    if(!choices.length)return;
    choices=shuffle(choices);
    const ranked=choices.sort((a,b)=>{
      const da=Math.abs(g.row+a.dr-state.player.row)+Math.abs(g.col+a.dc-state.player.col);
      const db=Math.abs(g.row+b.dr-state.player.row)+Math.abs(g.col+b.dc-state.player.col);
      return da-db;
    });
    const chosen=Math.random()<cfg.chaseChance?ranked[0]:ranked[Math.floor(Math.random()*ranked.length)];
    g.row+=chosen.dr;g.col+=chosen.dc;
  });
  checkGhostCollision();
  if(state.running)renderMaze();
}

function handleExit(letter){
  if(state.transition)return;
  state.transition=true;state.running=false;
  const chosen=letter.charCodeAt(0)-65,correct=q().correta,ca=q().options[chosen],ra=q().options[correct],ok=chosen===correct;
  if(ok){
    state.score+=100;
    $('resultIcon').textContent='✓';$('resultIcon').className='result-icon';
    $('resultTitle').textContent='RESPOSTA CORRETA!';$('resultTitle').className='';
    $('resultMessage').textContent=`Você encontrou a saída ${letter} (${ca}) e acertou!`;
    $('resultPoints').innerHTML='⭐ +100 pontos';
  }else{
    state.lives--;
    $('resultIcon').textContent='✕';$('resultIcon').className='result-icon wrong';
    $('resultTitle').textContent='RESPOSTA ERRADA!';$('resultTitle').className='wrong-title';
    $('resultMessage').textContent=`Você escolheu a saída ${letter} (${ca}), mas a resposta correta era a saída ${String.fromCharCode(65+correct)} (${ra}).`;
    $('resultPoints').innerHTML='❤️ -1 vida';
  }
  updateHUD();
  $('nextBtn').textContent=state.lives<=0?'VER RESULTADO':(ok?'PRÓXIMA FASE':'TENTAR NOVAMENTE');
  showScreen('resultScreen');
}

function continueAfterResult(){
  const ok=$('resultTitle').textContent==='RESPOSTA CORRETA!';
  if(ok){
    state.level++;
    if(state.level>=state.gameQuestions.length){
      stopTimers();
      $('finalScore').textContent=state.score;$('finalTime').textContent=formatTime(state.totalElapsed);$('finalLives').textContent=state.lives;
      showScreen('victoryScreen');return;
    }
  }else if(state.lives<=0){stopTimers();$('gameOverScore').textContent=state.score;showScreen('gameOverScreen');return;}
  state.transition=false;state.running=false;setupLevel();renderQuestion();showScreen('gameScreen');
  startCountdown(()=>{state.running=true;startTimers();});
}

function startGame(){
  const bank=getQuestionBank().filter(x=>x.active);
  if(!bank.length){alert('O administrador ainda não deixou nenhuma pergunta ativa.');return;}
  const n=Math.min(Math.max(1,Number(getSettings().questionCount)||1),bank.length);
  state.difficulty=document.querySelector('input[name="difficulty"]:checked')?.value||'medio';
  state.gameQuestions=shuffle(bank).slice(0,n);state.level=0;state.score=0;state.lives=5;state.totalElapsed=0;state.transition=false;state.running=false;
  setupLevel();renderQuestion();showScreen('gameScreen');
  startCountdown(()=>{state.running=true;startTimers();});
}

function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function renderAdminBank(){
  const bank=getQuestionBank(), settings=getSettings(), list=$('questionBank');
  list.innerHTML='';
  $('totalCount').textContent=bank.length;
  $('activeCount').textContent=bank.filter(x=>x.active).length;
  $('questionCount').value=settings.questionCount;
  $('phaseTime').value=settings.phaseTimeMinutes;
  $('newAdminUser').value=settings.adminUser||'';
  $('newAdminPass').value='';
  $('setName').value='';
  $('currentSetName').textContent=settings.activeSetName||'Conjunto principal';

  bank.forEach((x,i)=>{
    const d=document.createElement('div');d.className='bank-item';
    d.innerHTML=`<div class="bank-main"><label class="switch-line"><input type="checkbox" data-toggle="${x.id}" ${x.active?'checked':''}><span>ATIVA</span></label><b>${i+1}. ${escapeHtml(x.question)}</b><div class="bank-answers">A) ${escapeHtml(x.options[0])} · B) ${escapeHtml(x.options[1])} · C) ${escapeHtml(x.options[2])} · D) ${escapeHtml(x.options[3])}<br><strong>Correta: ${String.fromCharCode(65+x.correta)}</strong></div></div><button class="delete-btn" data-delete="${x.id}">EXCLUIR</button>`;
    list.appendChild(d);
  });
  list.querySelectorAll('[data-toggle]').forEach(el=>el.addEventListener('change',()=>{const b=getQuestionBank(),x=b.find(y=>y.id===el.dataset.toggle);if(x){x.active=el.checked;saveQuestionBank(b);renderAdminBank();}}));
  list.querySelectorAll('[data-delete]').forEach(el=>el.addEventListener('click',()=>{if(confirm('Excluir esta pergunta?')){saveQuestionBank(getQuestionBank().filter(x=>x.id!==el.dataset.delete));renderAdminBank();}}));
  renderSetLibrary();
}

function renderSetLibrary(){
  const list=$('setLibrary'),sets=getQuestionSets(),active=getSettings().activeSetName;
  list.innerHTML='';
  sets.forEach(set=>{
    const d=document.createElement('div');d.className='set-item';
    const count=(set.questions||[]).length;
    d.innerHTML=`<div class="set-info"><b>${escapeHtml(set.name)}</b><span>${count} pergunta(s)${set.name===active?' · ATUAL':''}</span></div><div class="set-actions"><button class="secondary-btn small-btn" data-load-set="${set.id}">CARREGAR</button><button class="delete-btn" data-delete-set="${set.id}">EXCLUIR</button></div>`;
    list.appendChild(d);
  });
  list.querySelectorAll('[data-load-set]').forEach(btn=>btn.addEventListener('click',()=>{
    try{loadQuestionSet(btn.dataset.loadSet);renderAdminBank();alert('Conjunto carregado com sucesso!');}
    catch(e){alert(e.message);}
  }));
  list.querySelectorAll('[data-delete-set]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!confirm('Excluir este conjunto da biblioteca?'))return;
    try{deleteQuestionSet(btn.dataset.deleteSet);renderSetLibrary();}
    catch(e){alert(e.message);}
  }));
}

function openAdmin(){
  $('adminUser').value='';$('adminPass').value='';$('adminLoginError').textContent='';showScreen('adminLoginScreen');setTimeout(()=>$('adminUser').focus(),50);
}
function loginAdmin(){
  const credentials=getAdminCredentials();
  if($('adminUser').value.trim()===credentials.user&&$('adminPass').value===credentials.password){renderAdminBank();showScreen('adminScreen');}
  else{$('adminLoginError').textContent='Usuário ou senha incorretos.';$('adminPass').select();}
}
function addQuestion(){
  const text=$('newQuestion').value.trim(),opts=[0,1,2,3].map(i=>$('ans'+i).value.trim()),correta=Number($('correctAnswer').value);
  if(!text||opts.some(x=>!x)){alert('Preencha a pergunta e as quatro respostas.');return;}
  const b=getQuestionBank();b.push({id:'q-'+Date.now(),question:text,options:opts,correta,active:true});saveQuestionBank(b);$('newQuestion').value='';opts.forEach((_,i)=>$('ans'+i).value='');$('correctAnswer').value='0';renderAdminBank();
}
function saveGameSettings(){
  const active=getQuestionBank().filter(x=>x.active).length;
  const n=Math.max(1,Math.floor(Number($('questionCount').value)||1));
  const minutes=Math.max(1,Math.min(60,Math.floor(Number($('phaseTime').value)||3)));
  if(!active){alert('Ative pelo menos uma pergunta.');return;}
  if(n>active){alert(`Você possui ${active} pergunta(s) ativa(s). A quantidade não pode ser maior que isso.`);$('questionCount').value=active;return;}
  saveSettings({questionCount:n,phaseTimeMinutes:minutes});alert('Configuração da partida salva!');renderAdminBank();
}
function saveCredentials(){
  const user=$('newAdminUser').value.trim(),pass=$('newAdminPass').value;
  if(!user||!pass){alert('Digite o novo usuário e a nova senha.');return;}
  if(pass.length<4){alert('A senha deve ter pelo menos 4 caracteres.');return;}
  saveSettings({adminUser:user,adminPassword:pass});alert('Usuário e senha atualizados! Use os novos dados na próxima entrada.');$('newAdminPass').value='';
}
function saveNamedSet(){
  const name=$('setName').value.trim();
  if(!name){alert('Digite um nome para o conjunto.');$('setName').focus();return;}
  try{
    const exists=getQuestionSets().some(s=>s.name.toLowerCase()===name.toLowerCase());
    if(exists&&!confirm('Já existe um conjunto com esse nome. Deseja atualizar o conjunto salvo com as perguntas atuais?'))return;
    saveCurrentAsSet(name);$('setName').value='';renderAdminBank();alert(exists?'Conjunto atualizado com sucesso!':'Conjunto salvo na biblioteca!');
  }catch(e){alert(e.message);}
}

// Teclado: quando o usuário estiver digitando em um campo, NÃO bloquear letras como A/S/W/D.
addEventListener('keydown',e=>{
  const tag=(document.activeElement?.tagName||'').toLowerCase();
  const typing=['input','textarea','select'].includes(tag);
  if(typing)return;
  const key=e.key.toLowerCase();
  const m={arrowup:[-1,0],w:[-1,0],arrowdown:[1,0],s:[1,0],arrowleft:[0,-1],a:[0,-1],arrowright:[0,1],d:[0,1]};
  if(m[key]){e.preventDefault();movePlayer(...m[key]);}
  if(e.key==='Enter'&&document.activeElement===$('adminPass'))loginAdmin();
});

document.querySelectorAll('#mobileControls button').forEach(b=>b.addEventListener('click',()=>{const m={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};movePlayer(...m[b.dataset.dir]);}));

// Acesso administrativo oculto: Ctrl + Shift + M. Não existe botão visível no menu.
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='m'){e.preventDefault();openAdmin();}});

$('startBtn').addEventListener('click',startGame);
$('howBtn').addEventListener('click',()=>showScreen('howScreen'));
$('backHowBtn').addEventListener('click',()=>showScreen('menuScreen'));
$('nextBtn').addEventListener('click',continueAfterResult);
$('restartBtn').addEventListener('click',startGame);
$('playAgainBtn').addEventListener('click',startGame);
$('menuOverBtn').addEventListener('click',()=>showScreen('menuScreen'));
$('menuVictoryBtn').addEventListener('click',()=>showScreen('menuScreen'));
$('adminLoginBtn').addEventListener('click',loginAdmin);
$('adminLoginBackBtn').addEventListener('click',()=>showScreen('menuScreen'));
$('adminLogoutBtn').addEventListener('click',()=>showScreen('menuScreen'));
$('adminBackBtn').addEventListener('click',()=>showScreen('menuScreen'));
$('addQuestionBtn').addEventListener('click',addQuestion);
$('saveSettingsBtn').addEventListener('click',saveGameSettings);
$('saveCredentialsBtn').addEventListener('click',saveCredentials);
$('saveSetBtn').addEventListener('click',saveNamedSet);
showScreen('menuScreen');
