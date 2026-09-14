import { BodyAnalysis, BodyPartTarget, Point } from '../types';
import { findWristEdges } from './wristEdges';

type Landmark = { x: number; y: number; z?: number };

const fallbackAnchors = (target: BodyPartTarget) => target === 'face'
  ? { necklace: { primary: { x: .5, y: .72 } }, choker: { primary: { x: .5, y: .61 } }, earrings: { primary: { x: .27, y: .47 }, secondary: { x: .73, y: .47 } }, maang_tikka: { primary: { x: .5, y: .22 } } }
  : { ring: { primary: { x: .54, y: .48 }, secondary: { x: .57, y: .42 } }, bangles: { primary: { x: .42, y: .54 }, secondary: { x: .56, y: .6 } } };

let tasks: Promise<typeof import('@mediapipe/tasks-vision')> | undefined;
let faceLandmarker: any;
let handLandmarker: any;
const moduleForVision = () => tasks ??= import('@mediapipe/tasks-vision');

async function visionFiles() {
  const { FilesetResolver } = await moduleForVision();
  return FilesetResolver.forVisionTasks('/vision');
}

function point(l: Landmark): Point { return { x: l.x, y: l.y }; }
function center(a: Landmark, b: Landmark): Point { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

export async function analyseBody(source: CanvasImageSource, width: number, height: number, target: BodyPartTarget): Promise<BodyAnalysis> {
  const base = { source: { width, height, mirrored: false }, target, timestamp: Date.now() };
  try {
    const vision = await visionFiles();
    if (target === 'face') {
      const { FaceLandmarker } = await moduleForVision();
      faceLandmarker ??= await FaceLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: '/models/face_landmarker.task' }, runningMode: 'IMAGE', numFaces: 1, outputFacialTransformationMatrixes: true });
      const landmarks: Landmark[] | undefined = faceLandmarker.detect(source).faceLandmarks?.[0];
      if (!landmarks) return { ...base, status: 'adjustment-needed', anchors: fallbackAnchors(target), message: 'Face not found — drag jewelry to refine placement.' };
      return { ...base, status: 'tracking', message: 'Face fit estimated · adjust if needed', landmarks, anchors: {} };
    }
    const { HandLandmarker } = await moduleForVision();
    handLandmarker ??= await HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: '/models/hand_landmarker.task' }, runningMode: 'IMAGE', numHands: 1 });
    const landmarks: Landmark[] | undefined = handLandmarker.detect(source).landmarks?.[0];
    if (!landmarks) return { ...base, status: 'adjustment-needed', anchors: fallbackAnchors(target), message: 'Hand not found — drag jewelry to refine placement.' };
    // Ring finger: MCP 13, PIP 14. Wrist: 0, middle MCP: 9.
    const ring = center(landmarks[13], landmarks[14]);
    let wristEdges: BodyAnalysis['wristEdges'];
    try {
      // Work at <=640px; this is a local boundary check, not a segmentation model.
      const scale=Math.min(1,640/width),w=Math.round(width*scale),h=Math.round(height*scale);
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      if(context){
        context.drawImage(source,0,0,w,h);
        const wrist={x:landmarks[0].x*w,y:landmarks[0].y*h};
        const middle={x:landmarks[9].x*w,y:landmarks[9].y*h};
        const ray={x:(landmarks[9].x+landmarks[10].x)*w/2-wrist.x,y:(landmarks[9].y+landmarks[10].y)*h/2-wrist.y};
        const radians=Math.atan2(ray.y,ray.x),length=Math.hypot(middle.x-wrist.x,middle.y-wrist.y);
        const span=Math.hypot(length,((landmarks[9].z||0)-(landmarks[0].z||0))*w)*.78;
        wristEdges=findWristEdges(context.getImageData(0,0,w,h).data,w,h,{x:wrist.x-Math.cos(radians)*length*.08,y:wrist.y-Math.sin(radians)*length*.08},span,radians*180/Math.PI-90);
      }
    }catch{ /* Tainted or unsupported sources retain the anatomical estimate. */ }
    return { ...base, status: 'tracking', message: 'Hand fit estimated · adjust if needed', landmarks, wristEdges, anchors: {
      ring: { primary: ring, secondary: point(landmarks[14]) },
      bangles: { primary: point(landmarks[0]), secondary: point(landmarks[9]) }
    }};
  } catch (error) {
    return { ...base, status: 'adjustment-needed', anchors: fallbackAnchors(target), message: 'Local fit model unavailable — manual placement is ready.' };
  }
}

export function disposeVision() { faceLandmarker?.close?.(); handLandmarker?.close?.(); faceLandmarker = undefined; handLandmarker = undefined; }
