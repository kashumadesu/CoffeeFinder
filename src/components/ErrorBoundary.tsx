// ============================================================
// ErrorBoundary — Graceful Crash Protection & Recovery
// ============================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('[Crash Guard] Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Feather name="coffee" size={36} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>Spilled Some Coffee!</Text>
            <Text style={styles.subtitle}>
              Something interrupted your coffee run. Don't worry — your favorites, coffee passport stamps, and settings are safe.
            </Text>

            <TouchableOpacity
              style={styles.restartBtn}
              onPress={this.handleRestart}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={16} color="#FFFFFF" />
              <Text style={styles.restartBtnText}>Reload Coffee Finder</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    maxWidth: 360,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    gap: 8,
    marginTop: SPACING.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  restartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
