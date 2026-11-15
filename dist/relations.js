// Editorial exploration questions derived from existing topic links, never verified teaching claims.
const questions={
 'teacher:teaching':'老師的教學經驗，如何形成現在的理念與上課方式？',
 'questions:teacher':'有疑問時，可以先向老師說明自己的哪些情況？',
 'stories:teacher':'有沒有與我的程度、目標相近的學生案例？',
 'questions:teaching':'家長與學生在意的事，課堂會如何回應？',
 'stories:teaching':'哪些課堂練習，對應哪些希望看見的學習成果？',
 'questions:stories':'家長和學生可以透過什麼真實資料了解學習情況？'
};
export function relationKey(a,b){return [a,b].sort().join(':');}
export function buildRelations(topics){
 const known=new Map(topics.map(t=>[t.id,t])),seen=new Set(),result=[];
 for(const t of topics)for(const id of t.links){if(!known.has(id)||id===t.id)continue;const key=relationKey(t.id,id);if(seen.has(key))continue;seen.add(key);const [a,b]=key.split(':');
  result.push({id:key,a,b,question:questions[key]||`「${known.get(a).title}」與「${known.get(b).title}」之間，有哪些事情需要一起確認？`});
 }
 return result;
}
export function findRelations(relations,topics,query=''){
 const names=new Map(topics.map(t=>[t.id,t.title]));const q=query.trim().toLocaleLowerCase();
 return relations.filter(r=>`${names.get(r.a)} ${names.get(r.b)} ${r.question}`.toLocaleLowerCase().includes(q));
}
