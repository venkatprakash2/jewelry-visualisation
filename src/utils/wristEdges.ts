import { Point } from '../types';

/** Refine only when BOTH boundaries have strong chroma evidence. This compares
 * local colors rather than assuming a skin tone. It declines ambiguous sleeves,
 * backgrounds, or shadows and leaves the landmark estimate available. */
export function findWristEdges(pixels:Uint8ClampedArray,width:number,height:number,center:Point,span:number,rotation:number) {
  const color=(x:number,y:number)=>{
    if(x<1||y<1||x>=width-1||y>=height-1)return null;
    const index=(Math.round(y)*width+Math.round(x))*4;
    const total=pixels[index]+pixels[index+1]+pixels[index+2];
    if(total<45)return null;
    return [pixels[index]/total,pixels[index+1]/total,pixels[index+2]/total];
  };
  const seed=color(center.x,center.y);if(!seed)return undefined;
  const dx=Math.cos(rotation*Math.PI/180),dy=Math.sin(rotation*Math.PI/180);
  const edge=(sign:number)=>{
    let outside=0;
    for(let d=2;d<span*.85;d+=2){
      const sample=color(center.x+dx*d*sign,center.y+dy*d*sign);
      const difference=sample?Math.hypot(...sample.map((v,i)=>v-seed[i])):1;
      outside=difference>.115?outside+1:0;
      if(outside===3)return d-4;
    }
    return undefined;
  };
  const negative=edge(-1),positive=edge(1);
  if(!negative||!positive||negative+positive<span*.55||negative+positive>span*1.35||Math.abs(positive-negative)>span*.45)return undefined;
  return {
    primary:{x:(center.x-dx*negative)/width,y:(center.y-dy*negative)/height},
    secondary:{x:(center.x+dx*positive)/width,y:(center.y+dy*positive)/height}
  };
}
