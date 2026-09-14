import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Download, Layers, RefreshCcw, SlidersHorizontal, SplitSquareVertical, Video, VideoOff, ZoomIn, ZoomOut } from 'lucide-react';
import { BodyAnalysis, BodyPartTarget, CustomerPhoto, JewelryItem, JewelryAnchors, JewelryCategory, OrnamentTransform, Point, TrackingState } from '../types';
import { analyseBody } from '../utils/vision';
import { TryOnRenderer } from '../utils/renderer';
import { viewportToPhoto } from '../utils/fitting';

interface Props { photo: CustomerPhoto; ornament: JewelryItem; layeredOrnaments?: JewelryItem[]; targetCategory: BodyPartTarget; onOpenSelfieModal: () => void; }
const noLayers: JewelryItem[]=[];
const defaultTransform = (item: JewelryItem): OrnamentTransform => ({ id: item.id, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, visible: true });

export const TryOnCanvas: React.FC<Props> = ({ photo, ornament, layeredOrnaments = noLayers, targetCategory, onOpenSelfieModal }) => {
  const canvasRef=useRef<HTMLCanvasElement>(null),stageRef=useRef<HTMLDivElement>(null);
  const rendererRef=useRef<TryOnRenderer|undefined>(undefined);
  const [analysis,setAnalysis]=useState<BodyAnalysis|null>(null);
  const [transforms,setTransforms]=useState<Record<string,OrnamentTransform>>({});
  const [calibrations,setCalibrations]=useState<Partial<Record<JewelryCategory,JewelryAnchors>>>({});
  const [calibrating,setCalibrating]=useState(false),[fitPoints,setFitPoints]=useState<Point[]>([]);
  const canCalibrate=['earrings','choker','necklace','ring','bangles'].includes(ornament.category);
  const calibrationHint=ornament.category==='earrings'?'Tap the left earlobe, then the right earlobe.':ornament.category==='ring'?'Tap the two edges of the ring finger where the band should sit.':ornament.category==='bangles'?'Tap the two edges of the wrist where the bangle should sit.':'Tap the left and right sides of the neck where the top of the ornament should sit.';
  const [compare,setCompare]=useState(false),[split,setSplit]=useState(50),[showFit,setShowFit]=useState(false);
  const [live,setLive]=useState(false),[liveStatus,setLiveStatus]=useState('');
  const streamRef=useRef<MediaStream|undefined>(undefined),videoRef=useRef<HTMLVideoElement|undefined>(undefined);
  const cameraRequest=useRef(0);
  const pointers=useRef(new Map<number,Point>());
  const drag=useRef<{point:Point;transform:OrnamentTransform}|undefined>(undefined);
  const gesture=useRef<{distance:number;angle:number;scale:number;rotation:number}|undefined>(undefined);
  const source=analysis?.source ?? {width:896,height:1200};
  const allItems=useMemo(()=>[ornament,...layeredOrnaments.filter(item=>item.bodyPartTarget===ornament.bodyPartTarget && item.id!==ornament.id)],[ornament,layeredOrnaments]);
  const transformFor=useCallback((item:JewelryItem)=>transforms[item.id] ?? defaultTransform(item),[transforms]);
  const change=(patch:Partial<OrnamentTransform>)=>setTransforms(previous=>({...previous,[ornament.id]:{...(previous[ornament.id] ?? defaultTransform(ornament)),...patch}}));
  useEffect(()=>{
    if(!canvasRef.current)return;
    const renderer=new TryOnRenderer(canvasRef.current);rendererRef.current=renderer;
    const resize=()=>{const rect=stageRef.current?.getBoundingClientRect();if(rect)renderer.resize(rect.width,rect.height);};
    resize();const observer=new ResizeObserver(resize);if(stageRef.current)observer.observe(stageRef.current);
    return ()=>{observer.disconnect();renderer.dispose();rendererRef.current=undefined;};
  },[]);
  const releaseCamera=useCallback(()=>{
    ++cameraRequest.current;
    rendererRef.current?.stopVideo();streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=undefined;
    videoRef.current?.pause();videoRef.current=undefined;
  },[]);
  const stopLive=useCallback(()=>{releaseCamera();setLive(false);setLiveStatus('');setAnalysis(null);},[releaseCamera]);
  useEffect(()=>{stopLive();setTransforms({});setCalibrations({});setCalibrating(false);setFitPoints([]);},[photo.url,targetCategory,stopLive]);
  useEffect(()=>()=>releaseCamera(),[releaseCamera]);
  useEffect(()=>{setCalibrating(false);setFitPoints([]);pointers.current.clear();},[ornament.category]);
  useEffect(()=>{
    if(live)return;
    let active=true;setAnalysis(null);
    const img=new Image();img.crossOrigin='anonymous';
    img.onload=async()=>{
      if(!active)return;
      await rendererRef.current?.setBackground(photo.url);
      if(!active)return;
      const result=await analyseBody(img,img.naturalWidth,img.naturalHeight,targetCategory);
      if(active)setAnalysis(result);
    };
    img.onerror=()=>{if(active)setLiveStatus('Photo could not be loaded. Please choose another photo.');};
    img.src=photo.url;
    return ()=>{active=false;};
  },[photo.url,targetCategory,live]);
  useEffect(()=>{
    // Suppress old body fits while the next photo is being analysed.
    const items=analysis && analysis.target===ornament.bodyPartTarget && (!live || analysis.status==='tracking') ? allItems : [];
    rendererRef.current?.render(items.map(item=>({item,transform:transformFor(item),calibration:calibrations[item.category]})),analysis);
  },[allItems,analysis,transformFor,ornament.bodyPartTarget,calibrations,live]);
  useEffect(()=>{
    if(!live)return;
    let active=true,timer:number|undefined,previous:BodyAnalysis|null=null;
    const track=async()=>{
      const video=videoRef.current;if(!active||!video?.videoWidth)return;
      const result=await analyseBody(video,video.videoWidth,video.videoHeight,targetCategory);
      if(!active)return;
      if(previous?.landmarks && result.landmarks && previous.landmarks.length===result.landmarks.length) {
        result.landmarks=result.landmarks.map((p,i)=>({x:previous!.landmarks![i].x*.4+p.x*.6,y:previous!.landmarks![i].y*.4+p.y*.6,z:p.z}));
      }
      previous=result;setAnalysis(result);setLiveStatus(result.message);
      timer=window.setTimeout(track,120);
    };
    track();return ()=>{active=false;window.clearTimeout(timer);};
  },[live,targetCategory]);
  const startLive=async()=>{
    const request=++cameraRequest.current;setLiveStatus('Opening camera…');
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:960},height:{ideal:1280}},audio:false});
      if(request!==cameraRequest.current){stream.getTracks().forEach(t=>t.stop());return;}
      streamRef.current=stream;
      const video=document.createElement('video');video.playsInline=true;video.muted=true;video.srcObject=stream;await video.play();
      if(request!==cameraRequest.current){stream.getTracks().forEach(t=>t.stop());return;}
      videoRef.current=video;setAnalysis(null);setCalibrations({});setCalibrating(false);setFitPoints([]);rendererRef.current?.setVideo(video);setLive(true);setCompare(false);
    }catch{if(request===cameraRequest.current){releaseCamera();setLiveStatus('Camera unavailable. You can still use a photo.');}}
  };
  const eventPoint=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    return viewportToPhoto({x:event.clientX-rect.left,y:event.clientY-rect.top},source,{width:rect.width,height:rect.height});
  };
  const gestureMetrics=(a:Point,b:Point)=>({distance:Math.hypot((a.x-b.x)*source.width,(a.y-b.y)*source.height),angle:Math.atan2((b.y-a.y)*source.height,(b.x-a.x)*source.width)});
  const pointer=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    const point=eventPoint(event);
    if(calibrating){
      if(point.x<0||point.x>1||point.y<0||point.y>1)return;
      const points=[...fitPoints,point];
      if(points.length===2){
        if(gestureMetrics(points[0],points[1]).distance<10)return;
        points.sort((a,b)=>a.x-b.x);
        setCalibrations(previous=>({...previous,[ornament.category]:{primary:points[0],secondary:points[1]}}));
        change(defaultTransform(ornament));setCalibrating(false);setFitPoints([]);
      }else setFitPoints(points);
      return;
    }
    pointers.current.set(event.pointerId,point);event.currentTarget.setPointerCapture(event.pointerId);
    drag.current={point,transform:transformFor(ornament)};
    const values=[...pointers.current.values()];
    if(values.length===2)gesture.current={...gestureMetrics(values[0],values[1]),scale:transformFor(ornament).scale,rotation:transformFor(ornament).rotation};
  };
  const move=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    if(!pointers.current.has(event.pointerId))return;
    pointers.current.set(event.pointerId,eventPoint(event));const values=[...pointers.current.values()];
    if(values.length===1 && drag.current){const start=drag.current;change({x:start.transform.x+values[0].x-start.point.x,y:start.transform.y-(values[0].y-start.point.y)});}
    else if(values.length===2 && gesture.current){const metrics=gestureMetrics(values[0],values[1]);const start=gesture.current;const delta=Math.atan2(Math.sin(metrics.angle-start.angle),Math.cos(metrics.angle-start.angle));change({scale:Math.max(.35,Math.min(2.5,start.scale*metrics.distance/Math.max(1,start.distance))),rotation:start.rotation+delta*180/Math.PI});}
  };
  const release=(event:React.PointerEvent<HTMLCanvasElement>)=>{
    pointers.current.delete(event.pointerId);gesture.current=undefined;
    const point=[...pointers.current.values()][0];drag.current=point?{point,transform:transformFor(ornament)}:undefined;
  };
  const exportImage=()=>{const data=rendererRef.current?.export();if(!data)return;const anchor=document.createElement('a');anchor.download=`${ornament.code}.png`;anchor.href=data;anchor.click();};
  const trackingTone:Record<TrackingState,string>={tracking:'text-emerald-300','adjustment-needed':'text-amber-300',unavailable:'text-rose-300'};

  return <section className="overflow-hidden rounded-3xl border border-[#6a1825] bg-[#190609] shadow-2xl">
    <div className="flex items-center justify-between gap-2 border-b border-[#5a111c] bg-[#28080e] px-3 py-2.5"><div className="min-w-0"><p className="truncate font-mono text-xs font-bold text-[#f5d061]">{ornament.code}</p><p className="truncate text-[11px] text-stone-300">{ornament.name}</p></div><div className="flex gap-1"><button onClick={() => setCompare(!compare)} className="touch-button" aria-label="Compare original"><SplitSquareVertical size={17}/></button><button onClick={live ? stopLive : startLive} className={`touch-button ${live ? 'bg-[#d4af37] text-[#30040a]' : ''}`} aria-label="Toggle live camera">{live ? <VideoOff size={17}/> : <Video size={17}/>}</button><button onClick={onOpenSelfieModal} className="touch-button" aria-label="Take a photo"><Camera size={17}/></button></div></div>
    <div ref={stageRef} className="relative aspect-[3/4] bg-black"><canvas ref={canvasRef} onPointerDown={pointer} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} aria-label="Jewelry try-on; use fit controls to adjust" className="h-full w-full touch-none" />{calibrating && <><svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${source.width} ${source.height}`} preserveAspectRatio="xMidYMid meet">{fitPoints.map((p,i)=><circle key={i} cx={p.x*source.width} cy={p.y*source.height} r={source.width*.012} fill="#f5d061" stroke="#000" strokeWidth={2}/>)}</svg><div role="status" className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-black/85 p-3 text-xs text-[#f5d061]">{calibrationHint} {fitPoints.length}/2 points set.</div></>}{compare && !live && <><div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100-split}% 0 0)` }}><img src={photo.url} alt="Original photo" className="h-full w-full object-contain" /></div><div className="pointer-events-none absolute inset-y-0 left-0 border-r-2 border-[#f5d061]" style={{ width: `${split}%`, boxShadow: '12px 0 35px rgba(0,0,0,.32)' }} /><input aria-label="Comparison position" className="absolute bottom-4 left-6 right-6 w-[calc(100%-3rem)] accent-[#d4af37]" type="range" value={split} onChange={e => setSplit(Number(e.target.value))}/></>}<div className={`pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] ${trackingTone[analysis?.status ?? 'adjustment-needed']}`}>{liveStatus || analysis?.message || 'Fitting locally…'}</div></div>
    <div className="flex items-center justify-between gap-2 border-t border-[#5a111c] bg-[#24080d] p-2.5"><div className="flex rounded-xl border border-[#5a111c] bg-[#150508]"><button className="touch-button" aria-label="Decrease ornament size" onClick={() => change({ scale: Math.max(.35, transformFor(ornament).scale-.08) })}><ZoomOut size={17}/></button><span className="flex min-w-12 items-center justify-center font-mono text-xs text-[#f5d061]">{Math.round(transformFor(ornament).scale*100)}%</span><button className="touch-button" aria-label="Increase ornament size" onClick={() => change({ scale: Math.min(2.5, transformFor(ornament).scale+.08) })}><ZoomIn size={17}/></button></div><div className="flex gap-1"><button className={`touch-button ${showFit ? 'bg-[#d4af37] text-[#30040a]' : ''}`} onClick={() => setShowFit(!showFit)} aria-label="Fit controls"><SlidersHorizontal size={17}/></button><button className="touch-button" onClick={exportImage} aria-label="Export try-on"><Download size={17}/></button><button className="touch-button" onClick={() => { change(defaultTransform(ornament)); setCalibrations(previous=>{const next={...previous};delete next[ornament.category];return next;}); setCalibrating(false); setFitPoints([]); }} aria-label="Reset fit"><RefreshCcw size={17}/></button></div></div>
    {showFit && <div className="grid grid-cols-2 gap-3 border-t border-[#5a111c] bg-[#1b060a] p-3 text-xs">{canCalibrate && !live && <button className="col-span-2 min-h-11 rounded-lg border border-[#d4af37]/60 px-3 text-[#f5d061]" onClick={()=>{setCalibrating(!calibrating);setFitPoints([]);setCompare(false);}}>{calibrating?'Cancel fit points':'Set two fit points'}</button>}<label className="space-y-1 text-stone-300">Opacity<input className="w-full accent-[#d4af37]" type="range" min="30" max="100" value={Math.round(transformFor(ornament).opacity*100)} onChange={e => change({ opacity: Number(e.target.value)/100 })}/></label><label className="space-y-1 text-stone-300">Rotation<input aria-label="Ornament rotation" className="w-full accent-[#d4af37]" type="range" min="-180" max="180" value={transformFor(ornament).rotation} onChange={e=>change({rotation:Number(e.target.value)})}/></label><label className="space-y-1 text-stone-300">Horizontal position<input aria-label="Horizontal position" className="w-full accent-[#d4af37]" type="range" min="-.4" max=".4" step=".002" value={transformFor(ornament).x} onChange={e=>change({x:Number(e.target.value)})}/></label><label className="space-y-1 text-stone-300">Vertical position<input aria-label="Vertical position" className="w-full accent-[#d4af37]" type="range" min="-.4" max=".4" step=".002" value={-transformFor(ornament).y} onChange={e=>change({y:-Number(e.target.value)})}/></label><p className="col-span-2 text-[11px] text-stone-400">Drag to move. Pinch to resize and twist to rotate. Reset restores the automatic fit. Size is estimated from body proportions.{ornament.asset?.renderMode==='procedural-3d'?' Band design is an illustrative 3D preview.':''}</p></div>}
    {layeredOrnaments.length > 0 && <div className="border-t border-[#5a111c] bg-[#190609] p-3"><div className="mb-2 flex items-center gap-1 text-xs font-semibold text-[#f5d061]"><Layers size={14}/> Layered pieces</div><div className="flex gap-2 overflow-x-auto">{allItems.map(item => <button key={item.id} onClick={() => setTransforms(s => ({ ...s, [item.id]: { ...transformFor(item), visible: !transformFor(item).visible } }))} className={`min-h-11 shrink-0 rounded-lg border px-3 text-xs ${transformFor(item).visible ? 'border-[#d4af37] text-[#f5d061]' : 'border-[#5a111c] text-stone-500'}`}>{item.code}</button>)}</div></div>}
  </section>;
};
