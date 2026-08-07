import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SlideIcon } from '../components/BrandIcons';
import { slides } from '../data/appData';
import { styles } from '../styles/styles';

export function OnboardingScreen({ onDone }) {
  const [page, setPage] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const slide = slides[page];
  const lastPage = page === slides.length - 1;

  const next = () => (lastPage ? onDone() : setPage((current) => current + 1));
  const prev = () => setPage((current) => (current > 0 ? current - 1 : 0));

  // Touch Swipe Gesture Handlers (Swipe left = Next, Swipe right = Previous)
  const handleTouchStart = (e) => {
    setTouchStart(e.nativeEvent.pageX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.nativeEvent.pageX;
    const distance = touchStart - touchEnd;

    // Swipe Left (Next Slide)
    if (distance > 40) {
      if (page < slides.length - 1) {
        setPage((current) => current + 1);
      } else {
        onDone();
      }
    }
    // Swipe Right (Previous Slide)
    if (distance < -40) {
      if (page > 0) {
        setPage((current) => current - 1);
      }
    }
    setTouchStart(null);
  };

  return (
    <View style={styles.onboarding} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Top Header Row with Standard Top Right Skip Button & Top Left Back Button */}
      <View style={styles.onboardingHeaderRow}>
        {page > 0 ? (
          <Pressable style={styles.onboardingBackButton} onPress={prev} hitSlop={12}>
            <Text style={styles.onboardingBackText}>‹ Back</Text>
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable style={styles.skipButtonTopRight} onPress={onDone} hitSlop={12}>
          <Text style={styles.skipTextTopRight}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Slide Content */}
      <View style={styles.slideContent}>
        <View style={styles.illustration}>
          <SlideIcon type={slide.icon} />
        </View>
        <Text style={styles.heading}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      {/* Bottom Interactive Navigation & Action Area */}
      <View style={styles.bottomArea}>
        {/* Clickable Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <Pressable key={index} onPress={() => setPage(index)} hitSlop={8}>
              <View style={[styles.dot, page === index && styles.activeDot]} />
            </Pressable>
          ))}
        </View>

        {/* Primary Continue / Get Started Action Button */}
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedButton]} onPress={next}>
          <Text style={styles.primaryButtonText}>{lastPage ? 'Get Started' : 'Continue  →'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
