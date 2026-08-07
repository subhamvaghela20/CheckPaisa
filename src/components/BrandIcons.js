import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { green, styles } from '../styles/styles';

// 1. Circular Ring Checkmark Brand Logo Icon
export function CheckmarkRingIcon({ size = 80, ringColor = '#FFFFFF', checkColor = '#10B981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer circular ring with smooth top-right arc gap */}
      <Path
        d="M 50 8 A 42 42 0 1 1 18 28"
        fill="none"
        stroke={ringColor}
        strokeWidth={9}
        strokeLinecap="round"
      />
      {/* Bold Checkmark Inside */}
      <Path
        d="M 32 50 L 46 64 L 76 32"
        fill="none"
        stroke={checkColor}
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 2. Green Checkmark Ring for App Icon
export function GreenCheckmarkRingIcon({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M 50 8 A 42 42 0 1 1 18 28"
        fill="none"
        stroke="#10B981"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d="M 32 50 L 46 64 L 76 32"
        fill="none"
        stroke="#047857"
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 3. Dark Green Leather Wallet with Cash Notes & Gold Rupee Coin
export function WalletWithCashGraphic({ width = 170, height = 120 }) {
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={width} height={height} viewBox="0 0 170 120">
        {/* Fan-spread Green Cash Banknotes */}
        <G transform="translate(32, 10) rotate(-10)">
          <Rect x="0" y="0" width="75" height="38" rx="6" fill="#34D399" stroke="#059669" strokeWidth="1.5" />
          <Circle cx="37.5" cy="19" r="9" fill="#10B981" />
        </G>
        <G transform="translate(60, 6) rotate(5)">
          <Rect x="0" y="0" width="75" height="38" rx="6" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
          <Circle cx="37.5" cy="19" r="9" fill="#059669" />
        </G>

        {/* Wallet Main Body */}
        <Rect x="20" y="32" width="135" height="78" rx="18" fill="#0C3827" stroke="#10B981" strokeWidth="2" />
        {/* Subtle Stitched Inner Line */}
        <Rect x="24" y="36" width="127" height="70" rx="14" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Flap & Metallic Latch */}
        <Path d="M 120 54 L 148 54 C 151 54 153 56 153 59 L 153 79 C 153 82 151 84 148 84 L 120 84 Z" fill="#062217" stroke="#10B981" strokeWidth="1.5" />
        <Circle cx="138" cy="69" r="5.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />

        {/* Golden Rupee Coin */}
        <Circle cx="50" cy="82" r="19" fill="#F59E0B" stroke="#FBBF24" strokeWidth="2.5" />
        <Circle cx="50" cy="82" r="15" fill="#FBBF24" />
      </Svg>
      {/* Overlaid Gold Rupee Symbol */}
      <Text style={{ position: 'absolute', left: 43, bottom: 24, fontSize: 17, fontWeight: '900', color: '#78350F' }}>₹</Text>
    </View>
  );
}

// 4. Background Line Chart & Bar Chart Silhouette
export function LineChartSilhouette() {
  return (
    <Svg width="100%" height={95} viewBox="0 0 300 95" style={{ position: 'absolute', top: -10, left: 0, right: 0 }}>
      {/* 4 Soft Bar Chart Columns */}
      <Rect x="165" y="60" width="15" height="25" rx="3.5" fill="rgba(16, 185, 129, 0.18)" />
      <Rect x="192" y="48" width="15" height="37" rx="3.5" fill="rgba(16, 185, 129, 0.24)" />
      <Rect x="219" y="38" width="15" height="47" rx="3.5" fill="rgba(16, 185, 129, 0.3)" />
      <Rect x="246" y="26" width="15" height="59" rx="3.5" fill="rgba(16, 185, 129, 0.36)" />

      {/* Upward Line Chart Path */}
      <Path
        d="M 15 72 L 55 58 L 95 68 L 145 42 L 205 52 L 260 22"
        fill="none"
        stroke="#10B981"
        strokeWidth="2.5"
      />

      {/* Line Chart Dots */}
      <Circle cx="55" cy="58" r="3.5" fill="#10B981" />
      <Circle cx="95" cy="68" r="3.5" fill="#10B981" />
      <Circle cx="145" cy="42" r="3.5" fill="#10B981" />
      <Circle cx="205" cy="52" r="3.5" fill="#10B981" />

      {/* Arrow Head */}
      <Path d="M 248 22 L 260 22 L 260 34" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 5. App Icon Preview Graphic Component (Exact match of left APP ICON image)
export function AppIconGraphic({ size = 260 }) {
  return (
    <View style={{ width: size, height: size * 1.15, backgroundColor: '#FFFFFF', borderRadius: 40, padding: 20, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#10B981', shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 }}>
      {/* Top Ring + Bar Chart */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 }}>
        <GreenCheckmarkRingIcon size={65} />
        {/* Top Right Mini Growth Chart */}
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Rect x="14" y="24" width="5" height="12" rx="1" fill="#10B981" />
          <Rect x="22" y="18" width="5" height="18" rx="1" fill="#10B981" />
          <Rect x="30" y="12" width="5" height="24" rx="1" fill="#10B981" />
          <Path d="M 28 8 L 36 8 L 36 16" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>

      {/* Middle Illustration: Wallet & Receipt */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
        <WalletWithCashGraphic width={120} height={85} />
        {/* White Receipt with Red Arrow */}
        <View style={{ width: 45, height: 60, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1.5, borderColor: '#CBD5E1', padding: 6, alignItems: 'center', justifyContent: 'space-around' }}>
          <View style={{ width: '80%', height: 3, backgroundColor: '#94A3B8', borderRadius: 1 }} />
          <View style={{ width: '60%', height: 3, backgroundColor: '#94A3B8', borderRadius: 1 }} />
          <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '900' }}>↓</Text>
        </View>
      </View>

      {/* Bottom CheckPaisa Branding */}
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0A261C' }}>Check</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#10B981' }}>Paisa</Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 }}>Manage your income & expense tracker</Text>
      </View>
    </View>
  );
}

export function WalletIcon() {
  return <WalletWithCashGraphic width={44} height={34} />;
}

export function SlideIcon({ type }) {
  if (type === 'rupee') return <Text style={styles.rupee}>₹</Text>;
  if (type === 'chart') {
    return (
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <Path d="M40 8 A32 32 0 1 0 72 40" fill="none" stroke={green} strokeWidth={4.5} strokeLinecap="round" />
        <Path d="M40 8 V40 H72" fill="none" stroke={green} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={82} height={66} viewBox="0 0 82 66">
      <Path d="M8 54 L31 31 L48 48 L76 20 M60 20 H76 V36" fill="none" stroke={green} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
