import React from 'react';
import { Text, View } from 'react-native';
import {
  GreenCheckmarkRingIcon,
  LineChartSilhouette,
  WalletWithCashGraphic,
} from '../components/BrandIcons';
import { styles } from '../styles/styles';

export function SplashScreen() {
  return (
    <View style={styles.lightSplashContainer}>
      {/* Top Header Branding Section */}
      <View style={styles.splashHeader}>
        <GreenCheckmarkRingIcon size={88} />
        <View style={styles.splashLogoRow}>
          <Text style={styles.lightSplashLogoDark}>Check</Text>
          <Text style={styles.lightSplashLogoGreen}>Paisa</Text>
        </View>
        <View style={styles.splashUnderlineBar} />
        <Text style={styles.lightSplashTaglineSub}>Manage your income{'\n'}& expense tracker</Text>
      </View>

      {/* Middle Hero Illustration Section */}
      <View style={styles.splashHeroContainer}>
        {/* Background Upward Line Chart & Bar Columns */}
        <LineChartSilhouette />

        {/* Left Floating Badge: Income (Green ↗) */}
        <View style={styles.splashBadgeLeft}>
          <View style={styles.splashIncomeCircle}>
            <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: '900' }}>↗</Text>
          </View>
          <Text style={styles.lightSplashIncomeText}>Income</Text>
        </View>

        {/* Center Wallet + Cash Notes + Gold Coin Graphic */}
        <WalletWithCashGraphic width={175} height={125} />

        {/* Right Floating Badge: Expense (Orange/Red ↓) */}
        <View style={styles.splashBadgeRight}>
          <View style={styles.splashExpenseCircle}>
            <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: '900' }}>↓</Text>
          </View>
          <Text style={styles.lightSplashExpenseText}>Expense</Text>
        </View>
      </View>

      {/* Footer Section: Taglines Only (No 4 Dots) */}
      <View style={styles.splashFooter}>
        <Text style={styles.lightSplashTaglineBold}>Track. Manage. Grow.</Text>
        <Text style={styles.lightSplashTaglineSmall}>Take control of your money.</Text>
      </View>
    </View>
  );
}
