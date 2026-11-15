// Editorial exploration questions derived from existing topic links, never verified teaching claims.
const questions={
 'belief:teacher':'老師的教學經驗，如何形成現在的理念？',
 'method:teacher':'過往教學經驗，會如何影響課堂安排？',
 'stories:teacher':'有沒有與我的程度、目標相近的學生案例？',
 'belief:method':'教學理念會如何落實到一堂作文課？',
 'belief:benefits':'這個教學理念希望學生真正學會什麼？',
 'benefits:method':'哪些課堂練習對應哪些學習目標？',
 'method:solutions':'練習遇到困難時，課堂會如何調整？',
 'benefits:stories':'預期收穫有哪些真實案例可以佐證？',
 'benefits:solutions':'如果還沒達到預期目標，接下來可以怎麼討論？',
 'method:stories':'可以用一份真實作品說明練習與回饋的過程嗎？',
 'method:parents':'課堂與作業安排，會如何影響孩子的時間負擔？',
 'parents:stories':'家長可以透過什麼真實資料了解學習情況？',
 'parents:solutions':'家長的顧慮，可以如何具體帶進課程討論？',
 'parents:pricing':'判斷是否適合後，費用與安排有哪些需要確認？',
 'belief:students':'學生不敢寫或不敢問時，理念會如何影響教法？',
 'method:students':'基礎不同或跟不上時，實際練習會怎麼安排？',
 'benefits:students':'學生在意的困難，對應哪些希望達成的學習目標？',
 'solutions:students':'卡在開頭或不敢發問，可以先向老師說明什麼？',
 'pricing:solutions':'在決定報名前，還有哪些費用與服務問題要釐清？',
 'method:pricing':'課程費用包含哪些已確認的課堂與回饋安排？'
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
