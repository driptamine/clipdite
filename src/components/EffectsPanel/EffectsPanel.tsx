import { useState, useMemo } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuidv4 } from 'uuid';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelTabs,
  PanelTab,
  PanelTabActive,
  SearchBar,
  SearchInput,
  PanelContent,
  EffectCategory,
  CategoryHeader,
  CategoryArrow,
  CategoryArrowOpen,
  EffectItem,
  EffectIcon,
  EffectIconVideo,
  EffectIconAudio,
  EffectIconColor,
  EmptyState,
  PropertiesSection,
  PropertyRow,
  PropertyLabel,
  PropertyValue,
  PropertySlider,
} from './EffectsPanel.styles';

interface EffectDef {
  name: string;
  type: string;
  category: string;
  params: Record<string, number | string | boolean>;
}

const effectDefs: EffectDef[] = [
  { name: 'Brightness/Contrast', type: 'color', category: 'Color Correction', params: { brightness: 0, contrast: 0 } },
  { name: 'Hue/Saturation', type: 'color', category: 'Color Correction', params: { hue: 0, saturation: 100, lightness: 0 } },
  { name: 'Levels', type: 'color', category: 'Color Correction', params: { inputBlack: 0, inputWhite: 255, gamma: 1 } },
  { name: 'Color Balance', type: 'color', category: 'Color Correction', params: { shadows: 0, midtones: 0, highlights: 0 } },
  { name: 'Lumetri Color', type: 'color', category: 'Color Correction', params: { temperature: 0, tint: 0, exposure: 0, contrast: 0 } },
  { name: 'Crop', type: 'transform', category: 'Transform', params: { left: 0, top: 0, right: 0, bottom: 0 } },
  { name: 'Gaussian Blur', type: 'blur', category: 'Blur & Sharpen', params: { blurriness: 0, edgeBehavior: 1 } },
  { name: 'Directional Blur', type: 'blur', category: 'Blur & Sharpen', params: { direction: 0, blurLength: 0 } },
  { name: 'Unsharp Mask', type: 'sharpen', category: 'Blur & Sharpen', params: { amount: 0, radius: 1, threshold: 0 } },
  { name: 'Fast Blur', type: 'blur', category: 'Blur & Sharpen', params: { blurriness: 0 } },
  { name: 'Cross Dissolve', type: 'transition', category: 'Dissolve', params: { duration: 30 } },
  { name: 'Dip to Black', type: 'transition', category: 'Dissolve', params: { duration: 30 } },
  { name: 'Dip to White', type: 'transition', category: 'Dissolve', params: { duration: 30 } },
  { name: 'Additive Dissolve', type: 'transition', category: 'Dissolve', params: { duration: 30 } },
  { name: 'Film Dissolve', type: 'transition', category: 'Dissolve', params: { duration: 30 } },
  { name: 'Zoom', type: 'distort', category: 'Distort', params: { zoomHeight: 100, zoomWidth: 100 } },
  { name: 'Mirror', type: 'distort', category: 'Distort', params: { reflectionCenter: 50, reflectionAngle: 0 } },
  { name: 'Spherical Distortion', type: 'distort', category: 'Distort', params: { curvature: 0 } },
  { name: 'Wave Warp', type: 'distort', category: 'Distort', params: { waveType: 0, waveHeight: 10, waveWidth: 50 } },
  { name: 'Noise', type: 'noise', category: 'Noise & Grain', params: { amount: 0 } },
  { name: 'Dust & Scratches', type: 'noise', category: 'Noise & Grain', params: { radius: 0, threshold: 0 } },
  { name: 'Alpha Gain', type: 'opacity', category: 'Keying', params: { gain: 100 } },
  { name: 'Ultra Key', type: 'keying', category: 'Keying', params: { keyColor: '#00ff00', similarity: 40 } },
  { name: 'Change Speed', type: 'time', category: 'Time', params: { speed: 100 } },
  { name: 'Posterize Time', type: 'time', category: 'Time', params: { frameRate: 12 } },
  { name: 'Reverb', type: 'audio', category: 'Audio Effects', params: { decay: 50, mix: 50 } },
  { name: 'Echo', type: 'audio', category: 'Audio Effects', params: { delay: 100, decay: 50 } },
  { name: 'Bass', type: 'audio', category: 'Audio Effects', params: { boost: 0 } },
  { name: 'Treble', type: 'audio', category: 'Audio Effects', params: { boost: 0 } },
  { name: 'Equalizer', type: 'audio', category: 'Audio Effects', params: { low: 0, mid: 0, high: 0 } },
];

export default function EffectsPanel() {
  const { selectedClipId, addEffectToClip, tracks } = useEditorStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'effects' | 'presets' | 'properties'>('effects');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Color Correction', 'Blur & Sharpen']));

  const selectedClip = useMemo(() => {
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip) return { clip, trackType: track.type };
    }
    return null;
  }, [tracks, selectedClipId]);

  const filteredEffects = useMemo(() => {
    if (!search) return effectDefs;
    const lower = search.toLowerCase();
    return effectDefs.filter(
      (e) => e.name.toLowerCase().includes(lower) || e.category.toLowerCase().includes(lower)
    );
  }, [search]);

  const groupedEffects = useMemo(() => {
    const groups: Record<string, EffectDef[]> = {};
    for (const effect of filteredEffects) {
      if (!groups[effect.category]) groups[effect.category] = [];
      groups[effect.category].push(effect);
    }
    return groups;
  }, [filteredEffects]);

  const toggleCategory = (cat: string) => {
    const next = new Set(openCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setOpenCategories(next);
  };

  const handleAddEffect = (def: EffectDef) => {
    if (!selectedClipId) return;
    addEffectToClip(selectedClipId, {
      id: uuidv4(),
      name: def.name,
      type: def.type,
      enabled: true,
      params: { ...def.params },
    });
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Effects</PanelTitle>
      </PanelHeader>

      <PanelTabs>
        <PanelTab
          className={cx(activeTab === 'effects' && PanelTabActive)}
          onClick={() => setActiveTab('effects')}
        >
          Effects
        </PanelTab>
        <PanelTab
          className={cx(activeTab === 'presets' && PanelTabActive)}
          onClick={() => setActiveTab('presets')}
        >
          Presets
        </PanelTab>
        <PanelTab
          className={cx(activeTab === 'properties' && PanelTabActive)}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </PanelTab>
      </PanelTabs>

      {activeTab === 'effects' && (
        <>
          <SearchBar>
            <SearchInput
              placeholder="Search effects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchBar>
          <PanelContent>
            {Object.entries(groupedEffects).map(([category, effects]) => (
              <EffectCategory key={category}>
                <CategoryHeader onClick={() => toggleCategory(category)}>
                  <CategoryArrow
                    className={cx(openCategories.has(category) && CategoryArrowOpen)}
                  >
                    ▶
                  </CategoryArrow>
                  {category}
                </CategoryHeader>
                {openCategories.has(category) &&
                  effects.map((effect) => (
                    <EffectItem
                      key={effect.name}
                      onClick={() => handleAddEffect(effect)}
                      title={selectedClipId ? `Add to selected clip` : 'Select a clip first'}
                    >
                      <EffectIcon
                        className={cx(
                          effect.type === 'audio' && EffectIconAudio,
                          effect.type === 'color' && EffectIconColor,
                          (effect.type !== 'audio' && effect.type !== 'color') && EffectIconVideo,
                        )}
                      >
                        {effect.type === 'audio' ? '♫' : effect.type === 'color' ? '◉' : '✦'}
                      </EffectIcon>
                      {effect.name}
                    </EffectItem>
                  ))}
              </EffectCategory>
            ))}
          </PanelContent>
        </>
      )}

      {activeTab === 'presets' && (
        <PanelContent>
          <EmptyState>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>No presets available</span>
          </EmptyState>
        </PanelContent>
      )}

      {activeTab === 'properties' && (
        <PanelContent>
          {selectedClip ? (
            <PropertiesSection>
              <PropertyRow>
                <PropertyLabel>Opacity</PropertyLabel>
                <PropertyValue>{selectedClip.clip.opacity}%</PropertyValue>
              </PropertyRow>
              <PropertyRow>
                <PropertySlider
                  type="range"
                  min={0}
                  max={100}
                  value={selectedClip.clip.opacity}
                />
              </PropertyRow>
              {selectedClip.trackType === 'audio' && (
                <>
                  <PropertyRow>
                    <PropertyLabel>Volume</PropertyLabel>
                    <PropertyValue>{selectedClip.clip.volume}dB</PropertyValue>
                  </PropertyRow>
                  <PropertyRow>
                    <PropertySlider
                      type="range"
                      min={-100}
                      max={100}
                      value={selectedClip.clip.volume}
                    />
                  </PropertyRow>
                </>
              )}
              {selectedClip.clip.effects.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 0 4px', fontWeight: 500 }}>
                    Applied Effects ({selectedClip.clip.effects.length})
                  </div>
                  {selectedClip.clip.effects.map((eff) => (
                    <EffectItem key={eff.id} style={{ padding: '4px 8px' }}>
                      <EffectIcon className={EffectIconVideo}>✦</EffectIcon>
                      {eff.name}
                    </EffectItem>
                  ))}
                </>
              )}
              {selectedClip.clip.effects.length === 0 && (
                <EmptyState style={{ height: 'auto', padding: 20 }}>
                  <span>No effects applied</span>
                  <span style={{ fontSize: 10 }}>Select an effect to add to this clip</span>
                </EmptyState>
              )}
            </PropertiesSection>
          ) : (
            <EmptyState>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>Select a clip to view properties</span>
            </EmptyState>
          )}
        </PanelContent>
      )}
    </Panel>
  );
}
