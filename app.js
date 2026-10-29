import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Altere aqui o endpoint publicado do Google Apps Script depois de o configurar.
const CONFIG = { submissionEndpoint: 'COLOCA_AQUI_O_URL_DO_GOOGLE_APPS_SCRIPT' };
const COMPONENTS = [
  { id:'Garra', label:'Garra', color:'#34383A' },
  { id:'Botão', label:'Botão', color:'#B8F36B' },
  { id:'Interior', label:'Interior', color:'#777D82' },
  { id:'Interior_tampa', label:'Interior da tampa', color:'#777D82' },
  { id:'Exterior_tampa', label:'Exterior da tampa', color:'#0F5D5E' },
  { id:'Corpo', label:'Corpo', color:'#252729' }
];
const PALETTE = [
  {name:'Preto',hex:'#171918'},{name:'Grafite',hex:'#34383A'},{name:'Cinzento',hex:'#858A8C'},
  {name:'Branco',hex:'#F1F0EA'},{name:'Verde-água',hex:'#75C9B7'},{name:'Verde ácido',hex:'#B8F36B'},
  {name:'Azul-petróleo',hex:'#0F5D5E'},{name:'Azul',hex:'#315F9A'},{name:'Lilás',hex:'#A99ACB'},
  {name:'Vermelho',hex:'#D8473F'},{name:'Bordeaux',hex:'#702E3D'},{name:'Laranja',hex:'#F28C42'}
];
const colors = Object.fromEntries(COMPONENTS.map(c=>[c.id,c.color]));
const materialByComponent = new Map();
let scene,camera,renderer,controls,model,resizeObserver;
const viewer = document.querySelector('#viewer');
const loading = document.querySelector('#loading');
const errorBox = document.querySelector('#model-error');

function colorText(hex){return parseInt(hex.slice(1),16)>0x888888?'#171918':'#ffffff';}
function renderControls(){
  const root=document.querySelector('#component-controls');
  root.innerHTML='';
  COMPONENTS.forEach(component=>{
    const section=document.createElement('div'); section.className='component'; section.dataset.component=component.id;
    const top=document.createElement('div');top.className='component-top';
    const name=document.createElement('span');name.className='component-name';name.textContent=component.label;
    const hex=document.createElement('code');hex.className='hex-label';hex.textContent=colors[component.id];
    top.append(name,hex);
    const swatches=document.createElement('div');swatches.className='swatches';
    PALETTE.forEach(p=>{
      const b=document.createElement('button');b.type='button';b.className='swatch';b.style.backgroundColor=p.hex;b.style.setProperty('--check',colorText(p.hex));b.title=`${p.name} ${p.hex}`;b.setAttribute('aria-label',`${component.label}: ${p.name}, ${p.hex}`);b.setAttribute('aria-pressed',String(colors[component.id].toLowerCase()===p.hex.toLowerCase()));
      b.addEventListener('click',()=>setColor(component.id,p.hex));swatches.append(b);
    });
    const custom=document.createElement('label');custom.className='custom-color';custom.title='Escolher uma cor personalizada';
    const picker=document.createElement('input');picker.type='color';picker.value=colors[component.id];picker.setAttribute('aria-label',`Escolher cor personalizada para ${component.label}`);
    picker.addEventListener('input',()=>setColor(component.id,picker.value));custom.append(picker);swatches.append(custom);
    section.append(top,swatches);root.append(section);
  });
}
function setColor(id,hex){
  if(!/^#[0-9a-f]{6}$/i.test(hex))return;
  colors[id]=hex.toUpperCase();
  for(const material of materialByComponent.get(id)||[])material.color.set(colors[id]);
  const section=document.querySelector(`[data-component="${CSS.escape(id)}"]`);
  if(section){
    section.querySelector('.hex-label').textContent=colors[id];
    section.querySelectorAll('.swatch').forEach((b,i)=>{b.setAttribute('aria-pressed',String(PALETTE[i].hex.toLowerCase()===colors[id].toLowerCase()));});
    section.querySelector('input[type=color]').value=colors[id];
  }
  updateSummary();
}
function updateSummary(){
  const root=document.querySelector('#color-summary');root.innerHTML='';
  COMPONENTS.forEach(c=>{
    const item=document.createElement('div');item.className='summary-item';
    const chip=document.createElement('span');chip.className='summary-chip';chip.style.backgroundColor=colors[c.id];
    const text=document.createElement('span');text.className='summary-text';
    const label=document.createElement('strong');label.textContent=c.label;
    const hex=document.createElement('code');hex.textContent=colors[c.id];
    text.append(label,hex);item.append(chip,text);root.append(item);
  });
}
function componentName(mesh){
  let node=mesh;
  while(node&&node!==model){if(COMPONENTS.some(c=>c.id===node.name))return node.name;node=node.parent;}
  // OBJLoader can put the group label on the mesh itself.
  return COMPONENTS.some(c=>c.id===mesh.name)?mesh.name:null;
}
function initViewer(){
  scene=new THREE.Scene();scene.background=new THREE.Color('#fafaf8');
  camera=new THREE.PerspectiveCamera(34,1,.1,2000);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  viewer.append(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=true;controls.minDistance=.1;controls.maxDistance=1000;
  scene.add(new THREE.HemisphereLight(0xffffff,0x8c9188,2.1));
  const key=new THREE.DirectionalLight(0xffffff,3.0);key.position.set(5,8,7);scene.add(key);
  const fill=new THREE.DirectionalLight(0xd8e5ff,1.3);fill.position.set(-6,2,-4);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffffff,2);rim.position.set(1,-4,-6);scene.add(rim);
  const resize=()=>{const w=Math.max(viewer.clientWidth,1),h=Math.max(viewer.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewer);resize();
  document.querySelector('#reset-view').addEventListener('click',()=>{if(model)fitModel();});
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
}
function fitModel(){
  if(!model)return;
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const maxDim=Math.max(size.x,size.y,size.z)||1;
  camera.position.set(maxDim*1.5,maxDim*.9,maxDim*2.15);
  camera.near=Math.max(maxDim/1000,.001);camera.far=maxDim*100;camera.updateProjectionMatrix();
  controls.target.set(0,0,0);controls.minDistance=maxDim*.65;controls.maxDistance=maxDim*8;controls.update();
}
async function loadModel(){
  try{
    const obj=await new OBJLoader().loadAsync('./assets/MSTICK.obj');
    model=obj;
    const materialCache=new Map();
    model.traverse(node=>{
      if(!node.isMesh)return;
      const id=componentName(node);
      const component=COMPONENTS.find(c=>c.id===id);
      // Use one neutral, editable physical material per component. Geometry remains the original CAD mesh.
      const mat=new THREE.MeshStandardMaterial({color:component?colors[id]:'#777D82',metalness:.08,roughness:.38});
      node.material=mat;node.castShadow=false;node.receiveShadow=false;node.geometry.computeVertexNormals();
      if(component){if(!materialByComponent.has(id))materialByComponent.set(id,[]);materialByComponent.get(id).push(mat);}
    });
    scene.add(model);fitModel();loading.classList.add('hidden');
    document.querySelector('#model-status').textContent='Modelo CAD original · 6 componentes';
    // Verify every named group was detected, and tell the user if the OBJ parser uses a different structure.
    const found=new Set();model.traverse(n=>{if(COMPONENTS.some(c=>c.id===n.name))found.add(n.name);});
    if(found.size<COMPONENTS.length){
      const missing=COMPONENTS.filter(c=>!found.has(c.id)).map(c=>c.id);
      console.warn('Grupos OBJ não encontrados diretamente; verificar associação de materiais:',missing);
    }
  }catch(err){
    console.error('Erro ao carregar MSTICK.obj',err);loading.classList.add('hidden');errorBox.classList.remove('hidden');
    errorBox.textContent='Não foi possível carregar o modelo 3D. Confirma que assets/MSTICK.obj foi publicado juntamente com a página e tenta atualizar.';
    document.querySelector('#model-status').textContent='Erro ao carregar modelo';
  }
}
function snapshot(){return Object.fromEntries(COMPONENTS.map(c=>[c.id,colors[c.id]]));}
function setStatus(message,type=''){
  const el=document.querySelector('#submit-status');el.textContent=message;el.className=`submit-status ${type}`;
}
document.querySelector('#feedback-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  if(!CONFIG.submissionEndpoint.startsWith('https://script.google.com/')){
    setStatus('A aplicação está pronta, mas falta configurar o URL do Google Apps Script para receber respostas.', 'failure');return;
  }
  const button=document.querySelector('#submit-button');button.disabled=true;setStatus('A enviar a tua combinação…');
  const payload={
    schemaVersion:1,participant:document.querySelector('#participant').value.trim().slice(0,60),
    rating:Number(new FormData(form).get('rating')),colors:snapshot(),
    otherColors:document.querySelector('#other-colors').value.trim().slice(0,250),
    comments:document.querySelector('#comments').value.trim().slice(0,1200),
    submittedAtClient:new Date().toISOString(),submissionId:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`
  };
  try{
    // Apps Script web apps often do not expose CORS response headers. no-cors sends a simple POST;
    // an opaque response cannot confirm server-side persistence. The sheet is the source of truth.
    await fetch(CONFIG.submissionEndpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload),keepalive:true});
    setStatus('Pedido enviado pelo navegador. Como o Google Apps Script não confirma a resposta ao site, verifica a folha Google Sheets para confirmar que ficou registado. Obrigado pelo feedback!','success');
    button.textContent='Combinação enviada ✓';
  }catch(err){
    console.error('Falha no envio',err);setStatus('Não foi possível enviar. Verifica a ligação à internet e tenta novamente.','failure');button.disabled=false;
  }
});
renderControls();updateSummary();initViewer();loadModel();
