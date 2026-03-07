import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, TextInputProps, useTheme } from 'react-native-paper';
import VoiceInputButton from './VoiceInputButton';

interface VoiceTextInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  fieldName: string;
  enableVoice?: boolean;
  voiceLanguage?: string;
  confidenceThreshold?: number;
}

export const VoiceTextInput: React.FC<VoiceTextInputProps> = ({
  value,
  onChangeText,
  fieldName,
  enableVoice = true,
  voiceLanguage = 'hi-IN',
  confidenceThreshold = 0.85,
  ...textInputProps
}) => {
  const theme = useTheme();
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const handleTranscriptionComplete = (text: string, confidence: number) => {
    if (confidence >= confidenceThreshold) {
      // High confidence - auto-fill
      onChangeText(text);
    } else {
      // Low confidence - show for manual confirmation
      // For now, we'll still fill it but could show a confirmation dialog
      onChangeText(text);
    }
    setIsVoiceMode(false);
  };

  const renderVoiceInput = () => {
    if (!enableVoice) return null;

    return (
      <View style={styles.voiceContainer}>
        <VoiceInputButton
          fieldName={fieldName}
          onTranscriptionComplete={handleTranscriptionComplete}
          language={voiceLanguage}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        {...textInputProps}
        value={value}
        onChangeText={onChangeText}
        right={enableVoice ? <TextInput.Icon icon="microphone" onPress={() => setIsVoiceMode(!isVoiceMode)} /> : undefined}
      />
      {isVoiceMode && renderVoiceInput()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  voiceContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 107, 94, 0.05)',
    borderRadius: 8,
  },
});

export default VoiceTextInput;