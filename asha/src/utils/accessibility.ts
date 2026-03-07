import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility utilities for the ASHA mobile app
 */

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 
    | 'none'
    | 'button'
    | 'link'
    | 'search'
    | 'image'
    | 'keyboardkey'
    | 'text'
    | 'adjustable'
    | 'imagebutton'
    | 'header'
    | 'summary'
    | 'alert'
    | 'checkbox'
    | 'combobox'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'scrollbar'
    | 'spinbutton'
    | 'switch'
    | 'tab'
    | 'tablist'
    | 'timer'
    | 'toolbar';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{
    name: string;
    label?: string;
  }>;
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
}

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.error('Error checking screen reader status:', error);
    return false;
  }
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.error('Error checking reduce motion status:', error);
    return false;
  }
};

/**
 * Announce message to screen reader
 */
export const announceForAccessibility = (message: string): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

/**
 * Set accessibility focus to a component
 */
export const setAccessibilityFocus = (reactTag: number): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  }
};

/**
 * Generate accessibility props for form inputs
 */
export const getFormInputAccessibility = (
  label: string,
  value?: string,
  error?: string,
  required?: boolean,
  disabled?: boolean
): AccessibilityProps => {
  const accessibilityLabel = required ? `${label}, required` : label;
  let accessibilityHint = '';
  
  if (error) {
    accessibilityHint = `Error: ${error}`;
  } else if (value) {
    accessibilityHint = `Current value: ${value}`;
  }

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint: accessibilityHint || undefined,
    accessibilityRole: 'text',
    accessibilityState: {
      disabled: disabled || false,
    },
  };
};

/**
 * Generate accessibility props for buttons
 */
export const getButtonAccessibility = (
  label: string,
  disabled?: boolean,
  loading?: boolean,
  hint?: string
): AccessibilityProps => {
  let accessibilityLabel = label;
  let accessibilityHint = hint;

  if (loading) {
    accessibilityLabel = `${label}, loading`;
    accessibilityHint = 'Please wait while the action is being processed';
  }

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole: 'button',
    accessibilityState: {
      disabled: disabled || loading || false,
      busy: loading || false,
    },
  };
};

/**
 * Generate accessibility props for status indicators
 */
export const getStatusAccessibility = (
  status: string,
  description?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: `Status: ${status}`,
    accessibilityHint: description,
    accessibilityRole: 'text',
  };
};

/**
 * Generate accessibility props for progress indicators
 */
export const getProgressAccessibility = (
  current: number,
  total: number,
  label?: string
): AccessibilityProps => {
  const percentage = Math.round((current / total) * 100);
  const accessibilityLabel = label ? `${label}: ${percentage}% complete` : `${percentage}% complete`;

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityRole: 'progressbar',
    accessibilityValue: {
      min: 0,
      max: total,
      now: current,
      text: `${current} of ${total}`,
    },
  };
};

/**
 * Generate accessibility props for lists
 */
export const getListAccessibility = (
  itemCount: number,
  currentIndex?: number
): AccessibilityProps => {
  const accessibilityLabel = `List with ${itemCount} items`;
  const accessibilityHint = currentIndex !== undefined ? 
    `Currently on item ${currentIndex + 1} of ${itemCount}` : 
    undefined;

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole: 'list',
  };
};

/**
 * Generate accessibility props for list items
 */
export const getListItemAccessibility = (
  label: string,
  index: number,
  total: number,
  selected?: boolean
): AccessibilityProps => {
  const accessibilityLabel = `${label}, ${index + 1} of ${total}`;

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityRole: 'button',
    accessibilityState: {
      selected: selected || false,
    },
  };
};

/**
 * Generate accessibility props for tabs
 */
export const getTabAccessibility = (
  label: string,
  selected: boolean,
  index: number,
  total: number
): AccessibilityProps => {
  const accessibilityLabel = `${label}, tab ${index + 1} of ${total}`;
  const accessibilityHint = selected ? 'Currently selected' : 'Double tap to select';

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole: 'tab',
    accessibilityState: {
      selected,
    },
  };
};

/**
 * Generate accessibility props for switches/toggles
 */
export const getSwitchAccessibility = (
  label: string,
  value: boolean,
  disabled?: boolean
): AccessibilityProps => {
  const accessibilityLabel = `${label}, ${value ? 'on' : 'off'}`;
  const accessibilityHint = disabled ? 'Unavailable' : 'Double tap to toggle';

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole: 'switch',
    accessibilityState: {
      checked: value,
      disabled: disabled || false,
    },
  };
};

/**
 * Generate accessibility props for alerts/notifications
 */
export const getAlertAccessibility = (
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
): AccessibilityProps => {
  const accessibilityLabel = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${message}`;

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityRole: 'alert',
  };
};

/**
 * Check if touch target meets minimum size requirements
 */
export const isValidTouchTarget = (width: number, height: number): boolean => {
  const MIN_TOUCH_TARGET = 44; // iOS and Android recommendation
  return width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
};

/**
 * Get recommended touch target size
 */
export const getMinTouchTargetSize = (): { width: number; height: number } => {
  return { width: 44, height: 44 };
};

/**
 * Accessibility event listeners
 */
export class AccessibilityManager {
  private static screenReaderEnabled = false;
  private static reduceMotionEnabled = false;
  private static listeners: Array<() => void> = [];

  static async initialize(): Promise<void> {
    try {
      this.screenReaderEnabled = await isScreenReaderEnabled();
      this.reduceMotionEnabled = await isReduceMotionEnabled();

      // Listen for accessibility changes
      const screenReaderListener = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        (enabled) => {
          this.screenReaderEnabled = enabled;
          this.notifyListeners();
        }
      );

      const reduceMotionListener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (enabled) => {
          this.reduceMotionEnabled = enabled;
          this.notifyListeners();
        }
      );

      this.listeners.push(
        () => screenReaderListener?.remove(),
        () => reduceMotionListener?.remove()
      );
    } catch (error) {
      console.error('Error initializing accessibility manager:', error);
    }
  }

  static isScreenReaderEnabled(): boolean {
    return this.screenReaderEnabled;
  }

  static isReduceMotionEnabled(): boolean {
    return this.reduceMotionEnabled;
  }

  static addListener(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in accessibility listener:', error);
      }
    });
  }

  static cleanup(): void {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }
}