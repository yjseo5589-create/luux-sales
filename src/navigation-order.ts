export const menuItems=[{id:'customers',label:'거래처 관리'},{id:'deals',label:'프로젝트 관리'},{id:'tasks',label:'업무 관리'},{id:'meetings',label:'미팅 일정'},{id:'resources',label:'업무 자료실'}] as const;
export const NAVIGATION_KEY='luux-sales-navigation-v1';
export function normalizeMenuOrder(value:unknown):string[]{
 const allowed=menuItems.map(item=>item.id as string);
 const saved=Array.isArray(value)?value.filter((id):id is string=>typeof id==='string'&&allowed.includes(id)):[];
 return [...new Set([...saved,...allowed])];
}
export function moveMenu(order:string[],source:string,target:string,after=false){
 if(source===target||!order.includes(source)||!order.includes(target))return order;
 const next=order.filter(id=>id!==source),index=next.indexOf(target);
 next.splice(index+(after?1:0),0,source);
 return next;
}
