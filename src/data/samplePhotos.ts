import { CustomerPhoto } from '../types';
import realBridePortrait from '../assets/images/indian_portrait_1789278487546.jpg';
import realHandSilk from '../assets/images/indian_hand_silk_1789278982821.jpg';

export const SAMPLE_PORTRAITS: CustomerPhoto[] = [
  {
    id: 'sample-face-selfie',
    name: 'Face Selfie',
    url: realBridePortrait,
    targetCategory: 'face',
    aspectRatio: '3:4',
    isSample: true,
  },
  {
    id: 'sample-hand-selfie',
    name: 'Hand Selfie',
    url: realHandSilk,
    targetCategory: 'hand',
    aspectRatio: '3:4',
    isSample: true,
  },
];
