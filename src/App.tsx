import React, { useEffect, useState } from 'react';
import { JewelryItem, CustomerPhoto, BodyPartTarget } from './types';
import { JEWELRY_CATALOG } from './data/jewelryCatalog';
import { SAMPLE_PORTRAITS } from './data/samplePhotos';

import { Header } from './components/Header';
import { ProductCodeSearch } from './components/ProductCodeSearch';
import { PhotoSelector } from './components/PhotoSelector';
import { TryOnCanvas } from './components/TryOnCanvas';
import { ProductDetailCard } from './components/ProductDetailCard';
import { CompleteTheLook } from './components/CompleteTheLook';
import { SelfieModal } from './components/SelfieModal';
import { AIStylistModal } from './components/AIStylistModal';
import { CustomOrnamentModal } from './components/CustomOrnamentModal';
import { loadCustomItems, saveCustomItem } from './utils/customCatalog';

export default function App() {
  // Catalog & selection
  const [catalog, setCatalog] = useState<JewelryItem[]>(JEWELRY_CATALOG);
  const [selectedItem, setSelectedItem] = useState<JewelryItem>(JEWELRY_CATALOG[0]);
  const [layeredOrnaments, setLayeredOrnaments] = useState<JewelryItem[]>([]);

  // Customer photo: 2 options only (Face & Hand)
  const [currentPhoto, setCurrentPhoto] = useState<CustomerPhoto>(SAMPLE_PORTRAITS[0]);
  const [targetCategory, setTargetCategory] = useState<BodyPartTarget>('face');

  // Modals
  const [isSelfieOpen, setIsSelfieOpen] = useState(false);
  const [selfieModalType, setSelfieModalType] = useState<BodyPartTarget>('face');
  const [isStylistOpen, setIsStylistOpen] = useState(false);
  const [isCustomOrnamentOpen, setIsCustomOrnamentOpen] = useState(false);
  useEffect(() => { loadCustomItems().then(items => setCatalog(previous => [...items, ...previous.filter(item => !items.some(saved => saved.id === item.id))])).catch(() => undefined); }, []);

  // When an ornament is selected
  const handleSelectOrnament = (item: JewelryItem) => {
    setSelectedItem(item);
    setTargetCategory(item.bodyPartTarget);

    // If current photo is sample and doesn't match the ornament's required body part, auto-switch to matching demo photo
    if (currentPhoto.isSample && currentPhoto.targetCategory !== item.bodyPartTarget) {
      const matchingSample = SAMPLE_PORTRAITS.find((p) => p.targetCategory === item.bodyPartTarget);
      if (matchingSample) {
        setCurrentPhoto(matchingSample);
      }
    }
  };

  // Toggle layering of coordinating piece
  const handleToggleLayer = (item: JewelryItem) => {
    setLayeredOrnaments((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleOpenSelfie = (type: BodyPartTarget = targetCategory) => {
    setSelfieModalType(type);
    setIsSelfieOpen(true);
  };

  const handleAddCustomOrnament = (newItem: JewelryItem) => {
    setCatalog((prev) => [newItem, ...prev]);
    saveCustomItem(newItem).catch(() => undefined);
    handleSelectOrnament(newItem);
  };

  return (
    <div className="min-h-screen bg-[#0F0305] text-[#FAF6EE] font-sans antialiased flex flex-col items-center">
      {/* Mobile/Tablet Luxury Boutique Viewport */}
      <div className="w-full max-w-md sm:max-w-lg min-h-screen flex flex-col bg-[#160508] border-x border-[#3A070E] shadow-2xl">
        {/* GRT Brand Header */}
        <Header
          onOpenSelfie={() => handleOpenSelfie('face')}
          onOpenStylist={() => setIsStylistOpen(true)}
        />

        {/* Spacious Main Layout (20% less clutter & expanded breathing room) */}
        <main className="flex-1 p-4 space-y-4">
          {/* Virtual Try-On Canvas with AI Auto-Fit */}
          <TryOnCanvas
            photo={currentPhoto}
            ornament={selectedItem}
            layeredOrnaments={layeredOrnaments}
            targetCategory={targetCategory}
            onOpenSelfieModal={() => handleOpenSelfie(targetCategory)}
          />

          {/* Complete The Look Recommendations & Layering */}
          <CompleteTheLook
            currentOrnament={selectedItem}
            catalog={catalog}
            onSelectOrnament={handleSelectOrnament}
            layeredOrnaments={layeredOrnaments}
            onToggleLayer={handleToggleLayer}
          />

          {/* Connected GRT Catalog & SKU Code Input */}
          <ProductCodeSearch
            catalog={catalog}
            selectedItem={selectedItem}
            onSelectItem={handleSelectOrnament}
            onOpenUploadOrnament={() => setIsCustomOrnamentOpen(true)}
          />

          {/* 2 Selfie Input Modes: Face & Hand */}
          <PhotoSelector
            currentPhoto={currentPhoto}
            onPhotoSelected={(p) => {
              setCurrentPhoto(p);
              setTargetCategory(p.targetCategory);
            }}
            targetCategory={targetCategory}
            onTargetCategoryChange={(t) => {
              setTargetCategory(t);
              if (currentPhoto.isSample) {
                const s = SAMPLE_PORTRAITS.find((p) => p.targetCategory === t);
                if (s) setCurrentPhoto(s);
              }
            }}
            onOpenSelfieModal={handleOpenSelfie}
          />

          {/* Minimalist Hallmark Specifications */}
          <ProductDetailCard
            ornament={selectedItem}
            onOpenStylist={() => setIsStylistOpen(true)}
          />
        </main>

        {/* Minimal Footer */}
        <footer className="bg-[#100305] border-t border-[#3D080E] py-3 px-4 text-center mt-auto">
          <p className="text-[10px] text-stone-500 tracking-wider uppercase">
            GRT Jewellers • 22KT 916 BIS Hallmark • Virtual Try-On Suite
          </p>
        </footer>

        {/* Selfie Modal with 2 Modes (Face & Hand) */}
        <SelfieModal
          isOpen={isSelfieOpen}
          onClose={() => setIsSelfieOpen(false)}
          onCaptureSelfie={(photo) => {
            setCurrentPhoto(photo);
            setTargetCategory(photo.targetCategory);
          }}
          initialType={selfieModalType}
        />

        <AIStylistModal
          isOpen={isStylistOpen}
          onClose={() => setIsStylistOpen(false)}
          ornament={selectedItem}
          targetCategory={targetCategory}
        />

        <CustomOrnamentModal
          isOpen={isCustomOrnamentOpen}
          onClose={() => setIsCustomOrnamentOpen(false)}
          onAddCustomOrnament={handleAddCustomOrnament}
        />
      </div>
    </div>
  );
}
