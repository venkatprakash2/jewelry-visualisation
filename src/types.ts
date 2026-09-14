export type JewelryCategory = 'necklace' | 'choker' | 'earrings' | 'bangles' | 'ring' | 'maang_tikka' | 'nose_pin';
export type BodyPartTarget = 'face' | 'hand';
export interface Point { x: number; y: number; }
export interface JewelryPlacement { xPercent: number; yPercent: number; scale: number; rotation: number; }
export interface JewelryAnchors { primary: Point; secondary?: Point; rigidRegion?: { top: number; bottom: number }; }
export interface JewelryAsset { anchors: JewelryAnchors; dimensions?: { widthMm: number; heightMm: number; estimated: boolean }; renderMode?: 'texture' | 'procedural-3d'; attachment?: Point; earringLayout?: 'pair' | 'single'; }

export interface JewelryItem {
  id: string;
  code: string; // e.g. "GRT-NK-1049"
  name: string;
  category: JewelryCategory;
  collection: string;
  purity: string; // e.g. "22KT 916 BIS Hallmarked"
  grossWeight: string; // e.g. "48.200 g"
  netGoldWeight?: string;
  stoneWeight?: string;
  gemstones?: string;
  price: number;
  description: string;
  imageUrl: string;
  defaultPlacement: JewelryPlacement;
  bodyPartTarget: BodyPartTarget;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  matchingCodes?: string[]; // Codes of coordinating ornaments to complete the bridal/festive set
  asset?: JewelryAsset;
}

export interface CompleteTheLookRecommendation {
  title: string;
  theme: string;
  matchScore: number; // e.g. 98%
  reason: string;
  items: JewelryItem[];
  totalBundlePrice: number;
}

export interface CustomerPhoto {
  id: string;
  url: string;
  name: string;
  targetCategory: BodyPartTarget;
  aspectRatio: string;
  isSample?: boolean;
}

export type TrackingState = 'tracking' | 'adjustment-needed' | 'unavailable';
export interface BodyAnalysis {
  source: { width: number; height: number; mirrored: boolean };
  target: BodyPartTarget; status: TrackingState;
  anchors: Partial<Record<JewelryCategory, JewelryAnchors>>;
  timestamp: number; message: string;
  /** Image-space landmarks, normalized independently by image width and height. */
  landmarks?: (Point & { z?: number })[];
  wristEdges?: { primary: Point; secondary: Point };
}
export interface OrnamentTransform { id: string; x: number; y: number; scale: number; rotation: number; opacity: number; visible: boolean; }
export interface TryOnSettings extends OrnamentTransform { goldLuster: number; shadowIntensity: number; }

export interface AIStylingFeedback {
  recommendation: string;
  faceNeckHarmony: string;
  skinToneMatch: string;
  idealOccasion: string;
  stylingTips: string[];
}
