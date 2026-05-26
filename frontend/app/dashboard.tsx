import React from 'react';
import { ScreenBg } from '../src/ui';
import DashboardScreen from '../src/components/DashboardScreen';

export default function DashboardRoute() {
  return (
    <ScreenBg>
      <DashboardScreen />
    </ScreenBg>
  );
}
