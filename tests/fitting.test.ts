import { describe, expect, it } from 'vitest';
import { BodyAnalysis, JewelryCategory, JewelryItem, Point } from '../src/types';
import { fitJewelry, imageRect, viewportToPhoto } from '../src/utils/fitting';
import { findWristEdges } from '../src/utils/wristEdges';

const source={width:896,height:1200};
const item=(category:JewelryCategory):JewelryItem=>({id:category,code:category,name:category,category,collection:'',purity:'',grossWeight:'',price:0,description:'',imageUrl:'',bodyPartTarget:category==='ring'||category==='bangles'?'hand':'face',defaultPlacement:{xPercent:50,yPercent:50,scale:1,rotation:0}});
// Selected actual MediaPipe observations from the two supplied sample photographs.
function analysis(target:'face'|'hand'):BodyAnalysis {
  const landmarks=Array.from({length:target==='face'?478:21},()=>({x:.5,y:.5,z:0}));
  const observed:Record<number,number[]>=target==='face'?{
    10:[.53263,.25381],152:[.54392,.56366],234:[.35559,.38880],454:[.69320,.38113],
    33:[.42328,.35839],263:[.64371,.35164],132:[.36957,.44642],361:[.68504,.43814],
    468:[.45534,.35683],473:[.61300,.35209]
  }:{0:[.42926,.40204,0],9:[.63482,.48418,-.16046],10:[.73997,.61018,-.21638],13:[.66689,.47134,-.10956],14:[.77317,.57911,-.15061]};
  for(const [i,p] of Object.entries(observed)) landmarks[Number(i)]={x:p[0],y:p[1],z:p[2]||0};
  return {source:{...source,mirrored:false},target,status:'tracking',landmarks,anchors:{},timestamp:0,message:''};
}
function transform(body:BodyAnalysis, fn:(p:Point)=>Point, nextSource=source):BodyAnalysis {
  return {...body,source:{...nextSource,mirrored:false},landmarks:body.landmarks!.map(p=>{const result=fn({x:p.x*source.width,y:p.y*source.height});return {...p,x:result.x/nextSource.width,y:result.y/nextSource.height};})};
}

describe('photo and viewport coordinates',()=>{
  it.each([{width:375,height:500},{width:800,height:400},{width:400,height:800}])('round trips pointer input in %j, including letterboxing',viewport=>{
    const rect=imageRect(source,viewport),p={x:.31,y:.72};
    const result=viewportToPhoto({x:rect.x+p.x*rect.width,y:rect.y+p.y*rect.height},source,viewport);
    expect(result.x).toBeCloseTo(p.x);expect(result.y).toBeCloseTo(p.y);
  });
  it('contains a landscape source in a portrait stage',()=>{
    expect(imageRect({width:1200,height:600},{width:300,height:400})).toEqual({x:0,y:125,width:300,height:150,scale:.25});
  });
});

describe('anatomical fitting regressions',()=>{
  it('attaches two earrings to the lower side contours, not cheeks or a fixed duplicate offset',()=>{
    const [left,right]=fitJewelry(item('earrings'),analysis('face'),source);
    expect(left.center.x).toBeCloseTo(311,0);expect(right.center.x).toBeCloseTo(633,0);
    expect(left.center.y).toBeGreaterThan(525);expect(left.center.y).toBeLessThan(540);
    expect(right.center.y).toBeLessThan(left.center.y);
    expect(left.height).toBeGreaterThan(100);expect(left.height).toBeLessThan(120);
    expect(left.attachment.y).toBeLessThan(.3);
  });
  it.each(['earrings','choker','necklace','ring','bangles'] as const)('%s follows translated landmarks without changing size',category=>{
    const body=analysis(item(category).bodyPartTarget);
    const before=fitJewelry(item(category),body,source);
    const after=fitJewelry(item(category),transform(body,p=>({x:p.x+40,y:p.y-75})),source);
    before.forEach((fit,i)=>{
      expect(after[i].center.x-fit.center.x).toBeCloseTo(40);
      expect(after[i].center.y-fit.center.y).toBeCloseTo(-75);
      expect(after[i].width).toBeCloseTo(fit.width);
    });
  });
  it.each(['earrings','choker','necklace','ring'] as const)('%s is invariant to photo padding and aspect ratio',category=>{
    const body=analysis(item(category).bodyPartTarget),wide={width:1400,height:1200};
    const before=fitJewelry(item(category),body,source);
    const after=fitJewelry(item(category),transform(body,p=>({x:p.x+252,y:p.y}),wide),wide);
    before.forEach((fit,i)=>{expect(after[i].width).toBeCloseTo(fit.width);expect(after[i].center.x).toBeCloseTo(fit.center.x+252);expect(after[i].center.y).toBeCloseTo(fit.center.y);});
  });
  it('scales earrings with the person and product dimensions',()=>{
    const earrings=item('earrings'),body=analysis('face');
    const before=fitJewelry(earrings,body,source)[0];
    const zoomed=transform(body,p=>({x:448+(p.x-448)*1.4,y:600+(p.y-600)*1.4}));
    expect(fitJewelry(earrings,zoomed,source)[0].width/before.width).toBeCloseTo(1.4);
    earrings.asset={anchors:{primary:{x:.5,y:.2}},dimensions:{widthMm:13,heightMm:24,estimated:false}};
    const smaller=fitJewelry(earrings,body,source)[0];
    expect(smaller.width/before.width).toBeCloseTo(.5);expect(smaller.height!/before.height!).toBeCloseTo(.5);
  });
  it('places the choker attachment below the chin and limits its width to the neck region',()=>{
    const fit=fitJewelry(item('choker'),analysis('face'),source)[0];
    expect(fit.center.y).toBeGreaterThan(.56366*1200);
    expect(fit.width).toBeLessThan(260);expect(fit.attachment.y).toBe(0);
  });
  it('rotates a ring with the finger, in pixels rather than normalized x/y units',()=>{
    const ring=item('ring'),body=analysis('hand');
    const before=fitJewelry(ring,body,source)[0];
    expect(before.width).toBeGreaterThan(45);expect(before.width).toBeLessThan(60);
    expect(before.rotation).toBeGreaterThan(-40);expect(before.rotation).toBeLessThan(-30);
    const rotated=transform(body,p=>({x:448-(p.y-600),y:600+(p.x-448)}));
    const after=fitJewelry(ring,rotated,source)[0];
    expect(after.width).toBeCloseTo(before.width);expect(after.rotation-before.rotation).toBeCloseTo(90);
  });
  it('uses two measured wrist boundaries when available',()=>{
    const body=analysis('hand');body.wristEdges={primary:{x:.3,y:.45},secondary:{x:.45,y:.35}};
    const fit=fitJewelry(item('bangles'),body,source)[0];
    expect(fit.center.x).toBeCloseTo(.375*896);expect(fit.center.y).toBeCloseTo(.4*1200);
    expect(fit.width).toBeCloseTo(Math.hypot(.15*896,.1*1200)*1.025);
  });
  it('two-point calibration overrides ring position, width and angle',()=>{
    const fit=fitJewelry(item('ring'),analysis('hand'),source,{primary:{x:.6,y:.5},secondary:{x:.65,y:.52}})[0];
    expect(fit.center.x).toBeCloseTo(.625*896);expect(fit.center.y).toBeCloseTo(.51*1200);
    expect(fit.width).toBeCloseTo(Math.hypot(.05*896,.02*1200));
  });
  it('calibrates both earrings independently without scaling their separation',()=>{
    const [left,right]=fitJewelry(item('earrings'),analysis('face'),source,{primary:{x:.25,y:.4},secondary:{x:.7,y:.42}});
    expect(left.center).toEqual({x:224,y:480});expect(right.center.x).toBeCloseTo(627.2);expect(right.center.y).toBe(504);
  });
  it('keeps no-detection manual fallback finite for every category',()=>{
    for(const category of ['necklace','choker','earrings','ring','bangles','maang_tikka','nose_pin'] as const) for(const fit of fitJewelry(item(category),null,source)) {
      expect(Number.isFinite(fit.width)).toBe(true);expect(fit.width).toBeGreaterThan(0);expect(Number.isFinite(fit.center.y)).toBe(true);
    }
  });
});

describe('wrist boundary refinement',()=>{
  const scene=(skin:number[],background:number[])=>{
    const data=new Uint8ClampedArray(100*100*4);
    for(let y=0;y<100;y++)for(let x=0;x<100;x++)data.set([...(x>=25&&x<=75?skin:background),255],(y*100+x)*4);
    return data;
  };
  it.each([{skin:[200,150,110]},{skin:[85,57,38]}])('finds both local-color edges for %j',({skin})=>{
    const result=findWristEdges(scene(skin,[110,25,45]),100,100,{x:50,y:50},60,0);
    expect(result?.primary.x).toBeCloseTo(.24);expect(result?.secondary.x).toBeCloseTo(.76);
  });
  it('declines an ambiguous background rather than inventing wrist edges',()=>{
    expect(findWristEdges(scene([200,150,110],[200,150,110]),100,100,{x:50,y:50},60,0)).toBeUndefined();
  });
});
