const DEFAULT_QUESTIONS = [
 {question:"Dois ângulos opostos pelo vértice medem 70°. Qual é a medida do outro ângulo?",options:["70°","110°","90°","180°"],correta:0},
 {question:"Um triângulo retângulo possui catetos de 3 cm e 4 cm. Qual é a hipotenusa?",options:["4 cm","5 cm","6 cm","7 cm"],correta:1},
 {question:"Qual é o resultado de 3² + 4²?",options:["12","20","25","49"],correta:2},
 {question:"Resolva: 2x + 6 = 16. Qual é o valor de x?",options:["3","4","5","6"],correta:2},
 {question:"Um retângulo possui 8 cm de comprimento e 5 cm de largura. Qual é sua área?",options:["13 cm²","26 cm²","40 cm²","80 cm²"],correta:2}
];
const QUESTIONS_STORAGE_KEY="pacmat_questions_v1";
const SETTINGS_STORAGE_KEY="pacmat_settings_v2";
const SETS_STORAGE_KEY="pacmat_question_sets_v1";
const DEFAULT_SETTINGS={questionCount:5,phaseTimeMinutes:3,adminUser:"Lucas",adminPassword:"11091996",activeSetName:"Conjunto principal"};

function getQuestionBank(){
  try{
    const s=JSON.parse(localStorage.getItem(QUESTIONS_STORAGE_KEY));
    if(Array.isArray(s)&&s.length)return s;
  }catch(e){}
  const d=DEFAULT_QUESTIONS.map((q,i)=>({...q,id:`default-${i+1}`,active:true}));
  saveQuestionBank(d);return d;
}
function saveQuestionBank(b){localStorage.setItem(QUESTIONS_STORAGE_KEY,JSON.stringify(b));}
function getSettings(){
  try{
    const s=JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
    if(s&&typeof s==='object')return {...DEFAULT_SETTINGS,...s};
  }catch(e){}
  const s={...DEFAULT_SETTINGS};localStorage.setItem(SETTINGS_STORAGE_KEY,JSON.stringify(s));return s;
}
function saveSettings(s){localStorage.setItem(SETTINGS_STORAGE_KEY,JSON.stringify({...getSettings(),...s}));}
function getAdminCredentials(){const s=getSettings();return {user:s.adminUser||DEFAULT_SETTINGS.adminUser,password:s.adminPassword||DEFAULT_SETTINGS.adminPassword};}

function normalizeSetName(name){return String(name||'').trim().replace(/\s+/g,' ');}
function getQuestionSets(){
  let sets=[];
  try{const s=JSON.parse(localStorage.getItem(SETS_STORAGE_KEY));if(Array.isArray(s))sets=s;}catch(e){}
  if(!sets.length){
    const current=getQuestionBank();
    sets=[{id:'set-main',name:DEFAULT_SETTINGS.activeSetName,questions:current,savedAt:new Date().toISOString()}];
    localStorage.setItem(SETS_STORAGE_KEY,JSON.stringify(sets));
  }
  return sets;
}
function saveQuestionSets(sets){localStorage.setItem(SETS_STORAGE_KEY,JSON.stringify(sets));}
function saveCurrentAsSet(name){
  const clean=normalizeSetName(name);
  if(!clean)throw new Error('Digite um nome para o conjunto.');
  const sets=getQuestionSets();
  const existing=sets.find(s=>s.name.toLowerCase()===clean.toLowerCase());
  const snapshot=JSON.parse(JSON.stringify(getQuestionBank()));
  if(existing){existing.questions=snapshot;existing.savedAt=new Date().toISOString();}
  else sets.push({id:'set-'+Date.now(),name:clean,questions:snapshot,savedAt:new Date().toISOString()});
  saveQuestionSets(sets);saveSettings({activeSetName:clean});
}
function loadQuestionSet(id){
  const set=getQuestionSets().find(s=>s.id===id);
  if(!set)throw new Error('Conjunto não encontrado.');
  const copy=JSON.parse(JSON.stringify(set.questions||[]));
  saveQuestionBank(copy);saveSettings({activeSetName:set.name});return copy;
}
function deleteQuestionSet(id){
  const sets=getQuestionSets();
  if(sets.length<=1)throw new Error('A biblioteca precisa manter pelo menos um conjunto.');
  const current=getSettings().activeSetName;
  const target=sets.find(s=>s.id===id);
  if(target&&target.name===current){throw new Error('Carregue outro conjunto antes de excluir este.');}
  saveQuestionSets(sets.filter(s=>s.id!==id));
}
