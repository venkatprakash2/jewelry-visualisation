export type JewelryCategory =
  | 'necklace'
  | 'choker'
  | 'earrings'
  | 'bangles'
  | 'ring'
  | 'maang_tikka'
  | 'nose_pin';

export type BodyPartTarget = 'face' | 'hand';

export interface JewelryPlacement {
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  scale: number; // relative multiplier (e.g. 1.0)
  rotation: number; // degrees (-180 to 180)
}

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

export interface TryOnSettings {
  xOffset: number; // -100 to 100
  yOffset: number; // -100 to 100
  overrideXPercent?: number; // 0 to 100
  overrideYPercent?: number; // 0 to 100
  overrideWidthRatio?: number; // 0.1 to 0.7
  scale: number; // 0.3 to 2.5
  rotation: number; // -180 to 180
  opacity: number; // 0.1 to 1.0
  blendMode: GlobalCompositeOperation;
  goldLuster: number; // 0.5 to 1.5
  shadowIntensity: number; // 0 to 1
  earringSeparation?: number; // for dual earrings
  visibleEar?: 'left' | 'right' | 'both';
  landmarkDetected?: string;
  // Self-aware 3D Draping & Size Ratio parameters
  wrapOcclusionEnabled: boolean;
  sizeRatio: number; // 1.0 = calibrated physical proportion
  drapeCurvature: number; // Gravitational catenary curve factor for necklace
  fingerOcclusionWidth: number; // Width of finger masking the back of the ring
  neckContourWidth: number; // Width of neck masking back necklace chains
  aiBiometrics?: {
    scaleRatio: number;
    neckWidthRatio?: number;
    fingerDiameterRatio?: number;
    wristWidthRatio?: number;
    drapeAngle?: number;
    occlusionType: 'neck_drape' | 'finger_wrap' | 'wrist_wrap' | 'ear_hang' | 'forehead_rest';
    landmark: string;
  };
}

export interface AIStylingFeedback {
  recommendation: string;
  faceNeckHarmony: string;
  skinToneMatch: string;
  idealOccasion: string;
  stylingTips: string[];
}
