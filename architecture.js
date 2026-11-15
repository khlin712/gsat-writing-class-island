import * as THREE from './vendor/three.module.min.js';

// Original course miniatures: shared construction details, nine distinct silhouettes.
export function createArchitecture({box,mesh,tree}){
 const geo={cylinder:new THREE.CylinderGeometry(1,1,1,16),dome:new THREE.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2)};
 const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,0,1,-.5,-.5,0,.5,.5,0,.5,0,1,.5],3));roof.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);roof.computeVertexNormals();
 // The summit trophy is a symbol of results, not a record of any award.
 const gold=new THREE.MeshStandardMaterial({color:'#e0b13f',roughness:.32,metalness:.55,emissive:'#ffb52e',emissiveIntensity:0});
 const cup=new THREE.LatheGeometry([[0,0],[.07,0],[.17,.06],[.27,.24],[.32,.46],[.33,.6],[.3,.6]].map(([x,y])=>new THREE.Vector2(x,y)),24);
 const handle=new THREE.TorusGeometry(.13,.028,8,16,Math.PI);
 function golden(m){m.material=gold;return m;}
 const glass=new THREE.MeshStandardMaterial({color:'#638d97',roughness:.32,metalness:.08,emissive:'#ffc874',emissiveIntensity:0});
 function glazed(g,x,y,z,w,h){const m=box(g,x,y,z,w,h,.025,'#638d97');m.material=glass;m.castShadow=false;return m;}
 function window(g,x,y,z,w=.18,h=.25){box(g,x,y-.025,z-.012,w+.06,h+.05,.045,'#ece4d1');glazed(g,x,y,z+.018,w,h);box(g,x,y,z+.038,.018,h,.018,'#d5c5a3');box(g,x,y+h*.48,z+.04,w,.018,.018,'#d5c5a3');}
 function base(g,w,d){box(g,0,.245,0,w+.12,.08,d+.12,'#b9a78c');box(g,0,.325,0,w,.08,d,'#e9dfc8');}
 function hall(g,x,z,w,h,d,color='#eee5d2',roofColor='#527b72'){
  box(g,x,.4,z,w,h,d,color);box(g,x,.4+h-.035,z,w+.045,.07,d+.045,'#d1c5a8');
  const r=mesh(g,roof,roofColor,x,.4+h,z,w+.16,.22,d+.15);r.name='pitched-roof';
  const count=Math.max(1,Math.floor(w/.28));for(let i=0;i<count;i++)window(g,x-w*.33+(count===1?0:i*w*.66/(count-1)),.57,z+d/2+.025,.14,Math.min(.3,h*.48));
 }
 function steps(g,x,z,w){for(let i=0;i<3;i++)box(g,x,.245+i*.035,z-i*.075,w,.035,(3-i)*.1,'#dfd6c1');}
 function bench(g,x,z){box(g,x,.3,z,.32,.035,.13,'#b4855b');for(const a of [-.11,.11])box(g,x+a,.25,z,.025,.07,.09,'#536961');}
 function planter(g,x,z){box(g,x,.25,z,.2,.12,.2,'#b5906b');mesh(g,new THREE.IcosahedronGeometry(1,1),'#7b9967',x,.43,z,.14,.12,.14);}
 function lamp(g,x,z){box(g,x,.25,z,.025,.5,.025,'#536961');const m=box(g,x,.73,z,.09,.09,.09,'#ffe6a6');m.material=glass;m.castShadow=false;}
 function build(parent,t){const g=new THREE.Group();g.name='course-architecture';g.userData.kind=t.kind;parent.add(g);
  if(t.kind==='school'){
   base(g,1.25,.72);hall(g,0,-.08,1.18,.55,.6);hall(g,-.43,-.05,.26,.72,.62,'#e2d8be','#668b7a');hall(g,.43,-.05,.26,.72,.62,'#e2d8be','#668b7a');
   box(g,0,.4,.29,.28,.44,.06,'#59756b');for(const x of [-.2,.2])box(g,x,.4,.4,.045,.5,.045,'#f5eddc');box(g,0,.9,.37,.53,.07,.2,'#ede1c7');steps(g,0,.58,.46);
   // Open book above the entrance is a course symbol, not a claim about premises.
   for(const side of [-1,1]){const p=box(g,side*.095,1.18,-.08,.18,.025,.25,'#fff4d6');p.rotation.z=side*.18;}bench(g,-.63,.55);lamp(g,.65,.37);
  }else if(t.kind==='tower'){
   base(g,.66,.66);hall(g,0,0,.57,1,.54,'#e6dec7','#586e78');
   mesh(g,geo.cylinder,'#b7a58a',0,1.48,0,.41,.12,.41);mesh(g,geo.dome,'#739799',0,1.54,0,.41,.34,.41);
   const scope=mesh(g,geo.cylinder,'#c8b787',.17,1.85,.08,.08,.58,.08);scope.rotation.z=-.85;mesh(g,geo.cylinder,'#3e646e',.39,2.04,.08,.1,.035,.1).rotation.z=-.85;
   for(const z of [-.24,0,.24])window(g,0,.88+z,.29,.16,.14);steps(g,0,.5,.4);planter(g,-.62,.35);
  }else if(t.kind==='trees'){
   box(g,0,.25,.05,1.12,.08,.92,'#b79c70');for(let i=0;i<6;i++)box(g,-.5+i*.2,.33,.05,.012,.008,.92,'#927b59');
   for(const x of [-.48,.48])for(const z of [-.3,.36])box(g,x,.33,z,.035,.62,.035,'#e1d1ab');for(const x of [-.44,-.22,0,.22,.44])box(g,x,.95,.03,.045,.045,.86,'#e1d1ab');
   box(g,0,.4,.16,.62,.22,.32,'#b68e62');for(let i=0;i<3;i++){const p=box(g,-.18+i*.18,.64,.16,.14,.02,.24,'#f6ebc9');p.rotation.y=(i-1)*.12;}tree(g,-.68,-.44,.68);tree(g,.68,-.44,.8);planter(g,-.7,.48);
  }else if(t.kind==='blocks'){
   base(g,1.08,.7);hall(g,-.32,.04,.42,.52,.55,'#e8d6b5','#9f7659');hall(g,.2,-.12,.5,.9,.65,'#e8dfc8','#597d83');hall(g,.55,.12,.28,.38,.43,'#ddd2bc','#719081');steps(g,-.23,.47,.35);planter(g,.66,.54);
  }else if(t.kind==='house'){
   base(g,1.04,.7);hall(g,-.05,-.05,.94,.6,.66,'#eee2c9','#618575');
   box(g,0,.4,.31,.2,.38,.05,'#8d6f51');for(const x of [-.42,.42])box(g,x,.4,.48,.035,.43,.035,'#e8d9b8');box(g,0,.84,.42,1.08,.07,.32,'#9eb09a');steps(g,0,.65,.48);bench(g,.63,.38);planter(g,-.65,.48);
  }else if(t.kind==='trophy'){
   base(g,.98,.86);box(g,0,.4,-.05,.7,.24,.62,'#e9dfc8');box(g,0,.64,-.05,.54,.14,.48,'#d1c5a8');box(g,0,.46,.265,.36,.11,.02,'#9c7f4f');
   // The cup is drawn large so it reads as the landmark of the whole map.
   const cupG=new THREE.Group();cupG.name='trophy-cup';cupG.position.set(0,.78,-.05);cupG.scale.setScalar(1.55);g.add(cupG);
   golden(mesh(cupG,geo.cylinder,'#e0b13f',0,.05,0,.16,.1,.16));golden(mesh(cupG,geo.cylinder,'#e0b13f',0,.24,0,.06,.32,.06));golden(mesh(cupG,geo.dome,'#e0b13f',0,.35,0,.11,.08,.11));
   const c=golden(mesh(cupG,cup,'#e0b13f',0,.39,0));c.material=gold;gold.side=THREE.DoubleSide;
   for(const side of [-1,1]){const h=golden(mesh(cupG,handle,'#e0b13f',side*.32,.74,0));h.rotation.z=-side*Math.PI/2;}
   golden(mesh(cupG,geo.dome,'#e0b13f',0,.99,0,.08,.1,.08));steps(g,0,.6,.5);lamp(g,-.6,.4);lamp(g,.6,.4);bench(g,-.62,-.5);
  }else if(t.kind==='university'){
   // A symbol of going on to university: a symmetrical brick-and-stone library with a tall arched portico, colonnaded wings and hipped tile roofs.
   // It only echoes a well-known university library's look; there is no name, crest or mark on it.
   const brick='#b8664d',stone='#eadcc0',tile='#6a5149',dark='#4b3a33';
   box(g,0,.245,.02,1.5,.08,1.02,'#b9a78c');box(g,0,.325,.02,1.4,.06,.94,stone);
   for(const side of [-1,1]){const x=side*.46;box(g,x,.385,-.05,.5,.46,.62,brick);box(g,x,.84,-.05,.54,.05,.66,stone);mesh(g,roof,tile,x,.89,-.05,.58,.2,.7);
    for(const dx of [-.15,0,.15]){box(g,x+dx,.48,.27,.075,.2,.02,dark);mesh(g,geo.cylinder,dark,x+dx,.68,.27,.0375,.02,.0375).rotation.x=Math.PI/2;box(g,x+dx,.41,.29,.1,.02,.02,stone);}
    for(const dx of [-.22,-.08,.08,.22])mesh(g,geo.cylinder,stone,x+dx,.6,.33,.022,.46,.022);box(g,x,.835,.33,.5,.03,.05,stone);}
   box(g,0,.385,0,.46,.72,.7,stone);box(g,0,1.1,0,.5,.05,.74,'#d8c7a4');mesh(g,roof,tile,0,1.15,0,.56,.28,.78);
   mesh(g,geo.cylinder,stone,0,1.43,0,.09,.12,.09);mesh(g,geo.dome,'#8f9c88',0,1.49,0,.09,.08,.09);
   for(const dx of [-.13,0,.13]){box(g,dx,.39,.352,.09,.42,.02,dark);mesh(g,geo.cylinder,dark,dx,.81,.352,.045,.02,.045).rotation.x=Math.PI/2;}
   for(const dx of [-.2,-.065,.065,.2])box(g,dx,.39,.37,.04,.52,.04,stone);box(g,0,.9,.37,.48,.07,.05,stone);
   for(let i=0;i<3;i++)box(g,0,.245+i*.03,.47+i*.04,.5-i*.04,.03,.12,'#dfd6c1');
   lamp(g,-.62,.42);lamp(g,.62,.42);planter(g,-.32,.5);planter(g,.32,.5);
  }else if(t.kind==='clock'){
   base(g,.72,.68);hall(g,0,-.05,.57,.94,.55,'#e6dbc0','#81795c');
   box(g,0,1.34,-.05,.69,.11,.67,'#c0a77c');box(g,0,1.45,-.05,.5,.45,.5,'#e8dec8');mesh(g,geo.dome,'#657d70',0,1.92,-.05,.34,.22,.34);
   mesh(g,new THREE.CircleGeometry(.17,24),'#fff4d7',0,1.68,.21);box(g,0,1.64,.226,.015,.13,.015,'#546962');box(g,.035,1.68,.23,.085,.015,.012,'#546962');steps(g,0,.47,.43);bench(g,-.6,.4);lamp(g,.57,.35);
  }else if(t.kind==='lab'){
   base(g,1.06,.74);hall(g,-.28,.04,.45,.56,.6,'#e6dfd0','#7f8991');
   mesh(g,geo.cylinder,'#ddd5c2',.25,.68,-.08,.36,.55,.36);mesh(g,geo.dome,'#7e9a9f',.25,.96,-.08,.4,.36,.4);
   for(const x of [.08,.28,.48])window(g,x,.51,.3,.12,.22);box(g,.25,.39,.34,.22,.3,.04,'#67827c');steps(g,.25,.55,.43);planter(g,-.65,.47);
  }else if(t.kind==='pavilion'){
   base(g,1.12,.88);for(const x of [-.45,.45])for(const z of [-.3,.3])box(g,x,.4,z,.055,.65,.055,'#b28e61');
   mesh(g,roof,'#6d8c79',0,1.05,0,1.27,.3,1.02);box(g,0,1.02,0,1.25,.045,1.02,'#d4bd96');
   mesh(g,geo.cylinder,'#c1a077',0,.63,.02,.29,.08,.29);for(const x of [-.38,.38])bench(g,x,.14);steps(g,0,.62,.5);planter(g,.66,.46);
  }else{
   box(g,0,.25,.05,1.2,.08,.96,'#bc9b70');for(let i=0;i<7;i++)box(g,-.55+i*.18,.33,.05,.012,.008,.96,'#8f795d');hall(g,-.2,-.24,.65,.45,.46,'#e9ddc4','#65857d');
   for(const x of [-.5,.5]){box(g,x,.33,.45,.035,.36,.035,'#d6c5a0');box(g,x,.33,.08,.035,.36,.035,'#d6c5a0');box(g,x,.66,.27,.035,.035,.42,'#e9d6aa');}bench(g,-.1,.35);lamp(g,.65,-.12);
  }
  return g;
 }
 return {build,shine(v){gold.emissiveIntensity=v*.6;},time(name){glass.color.set(name==='night'?'#f6d39a':'#638d97');glass.emissiveIntensity=name==='night'?.65:name==='dusk'?.2:0;}};
}
