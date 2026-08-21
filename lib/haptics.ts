import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

function canUseHaptics(enabled = true): boolean {
  return enabled && Platform.OS !== "web";
}

export const haptic = {
  light(enabled = true) {
    if (canUseHaptics(enabled)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium(enabled = true) {
    if (canUseHaptics(enabled)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  selection(enabled = true) {
    if (canUseHaptics(enabled)) {
      void Haptics.selectionAsync();
    }
  },
  success(enabled = true) {
    if (canUseHaptics(enabled)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  error(enabled = true) {
    if (canUseHaptics(enabled)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
