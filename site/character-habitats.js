import {roster} from './character-roster-3d.js';
export const habitats=Object.freeze({forest:'溪畔石灘',highland:'斷崖岩壁',shore:'海岸沙灘',wetland:'水上木棧道',garden:'鄉間田園道路',grove:'苔岩洞口',ruins:'古代石板廣場',prehistoric:'峽谷夾道'});
// Explicit art direction for every approved character, not inferred from display names.
const settings=[
 ['highland','crystal','岩甲石柱'],['forest','leaf','赤葉刀痕林'],['highland','storm','雷紋岩陣'],['shore','shell','潮池貝礁'],['highland','feather','疾風羽崖'],['highland','crystal','赤晶石簇'],['forest','leaf','翠角巨葉'],['shore','reed','海蛇潮汐石'],['highland','stone','山羊岩階'],['forest','stone','苔石樹根'],
 ['shore','bubble','水母珊瑚灣'],['garden','flower','月蛾花叢'],['garden','tea','暖茶野餐庭'],['shore','coral','海馬珊瑚礁'],['shore','shell','珍珠貝沙洲'],['garden','feather','桃羽花枝'],['ruins','star','紫星石環'],['ruins','lantern','燈穗石徑'],['grove','mushroom','莓果蕈園'],['shore','cloud','雲鯨霧灣'],
 ['grove','stone','苔石秘境'],['grove','mushroom','睡菇菌林'],['garden','pastry','布丁野餐地'],['garden','pastry','吐司穀香庭'],['garden','leaf','豆芽苗圃'],['forest','acorn','橡果落葉林'],['grove','log','空心木林'],['garden','pastry','餃子竹籬庭'],['wetland','reed','雨傘水岸'],['garden','leaf','薯苗田園'],
 ['prehistoric','fossil','暴龍化石谷'],['prehistoric','flower','角龍花盾原'],['prehistoric','cloud','長頸龍高樹谷'],['prehistoric','leaf','劍龍巨蕨林'],['highland','stone','甲龍岩甲原'],['wetland','reed','鴨龍蘆葦湖'],['wetland','fossil','棘龍河灣'],['prehistoric','feather','迅龍紅石徑'],['highland','feather','翼龍迎風崖'],['prehistoric','leaf','鐮龍翠蕨谷']
];
export const seasonOrder=Object.freeze(['spring','summer','autumn','winter']);
// Spring / summer / autumn / winter itineraries: every character changes landform.
const itineraries=[
 ['forest','highland','prehistoric','ruins'],['garden','forest','prehistoric','grove'],['forest','highland','ruins','prehistoric'],['wetland','shore','forest','ruins'],['forest','highland','prehistoric','ruins'],['prehistoric','highland','ruins','grove'],['garden','forest','wetland','grove'],['forest','shore','wetland','grove'],['garden','highland','prehistoric','grove'],['garden','forest','ruins','grove'],
 ['forest','shore','wetland','ruins'],['garden','forest','ruins','grove'],['garden','forest','ruins','grove'],['wetland','shore','forest','grove'],['forest','shore','wetland','ruins'],['garden','forest','highland','grove'],['garden','highland','ruins','grove'],['forest','garden','ruins','grove'],['garden','wetland','forest','grove'],['forest','shore','highland','ruins'],
 ['forest','wetland','prehistoric','grove'],['garden','forest','wetland','grove'],['garden','forest','ruins','grove'],['garden','shore','forest','ruins'],['garden','wetland','forest','grove'],['garden','forest','prehistoric','grove'],['forest','wetland','ruins','grove'],['garden','forest','wetland','ruins'],['forest','wetland','garden','grove'],['garden','forest','highland','grove'],
 ['forest','prehistoric','highland','ruins'],['garden','prehistoric','forest','grove'],['forest','wetland','prehistoric','highland'],['garden','forest','prehistoric','grove'],['forest','highland','prehistoric','ruins'],['forest','wetland','garden','grove'],['forest','shore','wetland','prehistoric'],['forest','prehistoric','highland','grove'],['forest','highland','shore','ruins'],['garden','forest','prehistoric','grove']
];
export const characterHabitats=Object.freeze(roster.map((entry,i)=>Object.freeze({id:'monster-'+String(i+1).padStart(2,'0'),code:entry[0],name:entry[1],color:entry[3],habitat:settings[i][0],seasonHabitats:Object.freeze(Object.fromEntries(seasonOrder.map((s,j)=>[s,itineraries[i][j]]))),motif:settings[i][1],landmark:settings[i][2],variant:i})));
export function characterHabitat(id){return characterHabitats.find(p=>p.id===id||p.code===id)||characterHabitats[0];}
export function characterHabitatForSeason(id,season){const base=characterHabitat(id),key=seasonOrder.includes(season)?season:'spring';return {...base,habitat:base.seasonHabitats[key],season:key};}
