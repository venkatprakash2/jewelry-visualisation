import { BodyAnalysis, JewelryAnchors, JewelryItem, Point } from '../types';

export interface FittedPiece {
  center: Point; // Source pixels. For textures this is the attachment, not the image center.
  width: number;
  height?: number;
  rotation: number; // Clockwise degrees in the photo.
  attachment: Point;
  mirror?: boolean;
}

const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x-a.x)*t, y: a.y+(b.y-a.y)*t });
const distance = (a: Point, b: Point) => Math.hypot(b.x-a.x,b.y-a.y);
const angle = (a: Point, b: Point) => Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
const add = (a: Point, x: number, y: number): Point => ({ x: a.x+x, y: a.y+y });

/** The same contain transform is used by the photograph, jewelry and pointer input. */
export function imageRect(source: { width: number; height: number }, viewport: { width: number; height: number }) {
  const scale = Math.min(viewport.width/source.width, viewport.height/source.height);
  return { x: (viewport.width-source.width*scale)/2, y: (viewport.height-source.height*scale)/2, width: source.width*scale, height: source.height*scale, scale };
}
export function viewportToPhoto(point: Point, source: {width: number; height: number}, viewport: {width: number; height: number}): Point {
  const rect = imageRect(source,viewport);
  return { x: (point.x-rect.x)/rect.width, y: (point.y-rect.y)/rect.height };
}

/** Geometry only: never use percentages of the viewport as an anatomical measurement. */
export function fitJewelry(item: JewelryItem, analysis: BodyAnalysis | null, source: {width: number; height: number}, calibration?: JewelryAnchors): FittedPiece[] {
  const automatic=automaticFit(item,analysis,source);
  if(!calibration?.secondary) return automatic;
  const a={x:calibration.primary.x*source.width,y:calibration.primary.y*source.height};
  const b={x:calibration.secondary.x*source.width,y:calibration.secondary.y*source.height};
  if(item.category==='earrings') return automatic.map((piece,i)=>({...piece,center:i===0?a:b}));
  return [{...automatic[0],center:mix(a,b,.5),width:distance(a,b),rotation:angle(a,b)}];
}

function automaticFit(item: JewelryItem, analysis: BodyAnalysis | null, source: {width: number; height: number}): FittedPiece[] {
  const normalized = analysis?.landmarks;
  const p = (i: number): Point => ({ x: normalized![i].x*source.width, y: normalized![i].y*source.height });
  const fallback = { x: item.defaultPlacement.xPercent/100*source.width, y: item.defaultPlacement.yPercent/100*source.height };
  const dimensions = item.asset?.dimensions;
  const piece = (center: Point, width: number, rotation = 0, attachment = {x:.5,y:.5}): FittedPiece => ({center,width,rotation,attachment});
  if (!normalized || analysis?.target !== item.bodyPartTarget) {
    const sizes = {necklace:.38,choker:.27,earrings:.065,ring:.05,bangles:.2,maang_tikka:.08,nose_pin:.02};
    const first = piece(fallback,source.width*sizes[item.category]);
    if(item.category==='earrings') return [first,piece({x:source.width-fallback.x,y:fallback.y},first.width)];
    return [first];
  }
  if (item.bodyPartTarget==='face') {
    const left = p(234), right = p(454), chin=p(152), brow=p(10);
    const faceWidth=distance(left,right);
    const roll=angle(p(33),p(263));
    const radians=roll*Math.PI/180;
    const down={x:-Math.sin(radians),y:Math.cos(radians)};
    // 63 mm interpupillary distance is an explicit sizing prior, not a measurement of this person.
    const pixelsPerMm=normalized.length>473 ? distance(p(468),p(473))/63 : faceWidth/140;
    if (item.category==='earrings') {
      // Face mesh contains no ear landmarks. Lower side contours approximate lobes;
      // move outwards, never use the cheek (234/454) as the piercing point.
      const lobe = (id: number, side: number) => add(p(id),side*faceWidth*.065*Math.cos(radians)-down.x*faceWidth*.012,side*faceWidth*.065*Math.sin(radians)-down.y*faceWidth*.012);
      const height=(dimensions?.heightMm || 48)*pixelsPerMm;
      const width=(dimensions?.widthMm || 26)*pixelsPerMm;
      const attachment=item.asset?.attachment ?? {x:.5,y:.12};
      return [{...piece(lobe(132,-1),width,roll*.25,attachment),height},{...piece(lobe(361,1),width,roll*.25,attachment),height,mirror:true}];
    }
    if(item.category==='choker' || item.category==='necklace') {
      const isChoker=item.category==='choker';
      const width=isChoker ? Math.min((dimensions?.widthMm || 120)*pixelsPerMm,faceWidth*.82) : (dimensions?.widthMm || 170)*pixelsPerMm;
      const offset=faceWidth*(isChoker?.09:.25);
      const center=add(chin,down.x*offset,down.y*offset);
      // Top center of the trimmed product image belongs below the chin. Existing
      // catalog anchors were photo percentages and cannot be used as texture pivots.
      return [piece(center,width,roll*(isChoker?.5:.2),item.asset?.attachment ?? {x:.5,y:0})];
    }
    if(item.category==='maang_tikka') {
      const height=(dimensions?.heightMm || 100)*pixelsPerMm;
      return [{...piece(add(brow,-down.x*height*.62,-down.y*height*.62),(dimensions?.widthMm || 30)*pixelsPerMm,roll,{x:.5,y:0}),height}];
    }
    return [piece(p(98),(dimensions?.widthMm || 6)*pixelsPerMm,roll)];
  }
  const wrist=p(0), middle=p(9), mcp=p(13), pip=p(14);
  if(item.category==='ring') {
    const length=distance(mcp,pip);
    // The shank sits on the proximal phalanx, across its axis, not on the knuckle.
    const center=mix(mcp,pip,.58);
    const width=length*.34;
    return [piece(center,width,angle(mcp,pip)-90)];
  }
  if(analysis.wristEdges) {
    const a={x:analysis.wristEdges.primary.x*source.width,y:analysis.wristEdges.primary.y*source.height};
    const b={x:analysis.wristEdges.secondary.x*source.width,y:analysis.wristEdges.secondary.y*source.height};
    return [piece(mix(a,b,.5),distance(a,b)*1.025,angle(a,b))];
  }
  const palmLength=distance(wrist,middle);
  const palmDepth=((normalized[9].z || 0)-(normalized[0].z || 0))*source.width;
  const palmSize=Math.hypot(palmLength,palmDepth);
  // A longer wrist-to-finger ray is less sensitive to MCP foreshortening.
  const axis=angle(wrist,mix(p(9),p(10),.5));
  const radians=axis*Math.PI/180;
  const center=add(wrist,-Math.cos(radians)*palmLength*.08,-Math.sin(radians)*palmLength*.08);
  return [piece(center,palmSize*.78,axis-90)];
}
