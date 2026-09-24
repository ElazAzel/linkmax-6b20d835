import React from 'react';
import { Composition } from 'remotion';
import { Promo, TOTAL_FRAMES } from './Promo';
import { FPS } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="LinkmaxPromo" component={Promo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
);
