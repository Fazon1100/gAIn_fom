import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export function xAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  if (!buttons || buttons.length === 0) {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  if (buttons.length === 1) {
    window.alert(message ? `${title}\n\n${message}` : title);
    buttons[0].onPress?.();
    return;
  }

  // Multiple buttons → window.confirm for the destructive/primary action
  const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
  if (confirmed) {
    const action = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
    action.onPress?.();
  }
}
