import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { IconButton, Text, useTheme, Surface, ProgressBar } from 'react-native-paper';
import { Audio } from 'expo-av';
import { Mic, MicOff, Play, Pause, Check, X } from 'lucide-react-native';

interface VoiceInputButtonProps {
  fieldName: string;
  onTranscriptionComplete: (text: string, confidence: number) => void;
  disabled?: boolean;
  maxDuration?: number; // in seconds, default 60
  language?: string; // language code for transcription
}

interface RecordingStatus {
  isRecording: boolean;
  duration: number;
  uri: string | null;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  fieldName,
  onTranscriptionComplete,
  disabled = false,
  maxDuration = 60,
  language = 'hi-IN',
}) => {
  const theme = useTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>({
    isRecording: false,
    duration: 0,
    uri: null,
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState<{
    text: string;
    confidence: number;
  } | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice input.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setRecordingStatus({
        isRecording: true,
        duration: 0,
        uri: null,
      });

      // Start duration timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingStatus(prev => ({ ...prev, duration: elapsed }));

        if (elapsed >= maxDuration) {
          stopRecording();
          clearInterval(timer);
        }
      }, 1000);

      // Store timer reference for cleanup
      (recording as any)._timer = timer;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Clear timer
      if ((recording as any)._timer) {
        clearInterval((recording as any)._timer);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecordingStatus(prev => ({
        ...prev,
        isRecording: false,
        uri,
      }));
      
      setRecording(null);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const playRecording = async () => {
    if (!recordingStatus.uri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingStatus.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const pausePlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);
    
    try {
      // TODO: Implement actual AWS Transcribe integration
      // For now, simulate transcription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock transcription result
      const mockTranscriptions = {
        'hi-IN': 'मरीज़ का नाम राम है',
        'en-US': 'Patient name is Ram',
        'ta-IN': 'நோயாளியின் பெயர் ராம்',
        'te-IN': 'రోగి పేరు రామ్',
        'bn-IN': 'রোগীর নাম রাম',
      };
      
      const text = mockTranscriptions[language as keyof typeof mockTranscriptions] || 'Sample transcription';
      const confidence = 0.9;
      
      setTranscription({ text, confidence });
    } catch (error) {
      console.error('Transcription failed:', error);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const acceptTranscription = () => {
    if (transcription) {
      onTranscriptionComplete(transcription.text, transcription.confidence);
      resetState();
    }
  };

  const rejectTranscription = () => {
    setTranscription(null);
  };

  const resetState = () => {
    setRecordingStatus({
      isRecording: false,
      duration: 0,
      uri: null,
    });
    setTranscription(null);
    setIsTranscribing(false);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (transcription) {
    return (
      <Surface style={styles.transcriptionContainer} elevation={1}>
        <Text variant="bodyMedium" style={styles.transcriptionText}>
          "{transcription.text}"
        </Text>
        <Text variant="bodySmall" style={styles.confidenceText}>
          Confidence: {Math.round(transcription.confidence * 100)}%
        </Text>
        <View style={styles.transcriptionActions}>
          <IconButton
            icon={() => <Check size={20} color={theme.colors.primary} />}
            mode="contained-tonal"
            onPress={acceptTranscription}
          />
          <IconButton
            icon={() => <X size={20} color={theme.colors.error} />}
            mode="outlined"
            onPress={rejectTranscription}
          />
        </View>
      </Surface>
    );
  }

  if (recordingStatus.uri && !isTranscribing) {
    return (
      <Surface style={styles.playbackContainer} elevation={1}>
        <Text variant="bodySmall">Recording: {formatDuration(recordingStatus.duration)}</Text>
        <View style={styles.playbackControls}>
          <IconButton
            icon={() => isPlaying ? <Pause size={20} /> : <Play size={20} />}
            mode="contained-tonal"
            onPress={isPlaying ? pausePlayback : playRecording}
          />
          <IconButton
            icon={() => <X size={16} />}
            size={16}
            onPress={resetState}
          />
        </View>
      </Surface>
    );
  }

  if (isTranscribing) {
    return (
      <Surface style={styles.transcribingContainer} elevation={1}>
        <Text variant="bodySmall">Transcribing audio...</Text>
        <ProgressBar indeterminate style={styles.progressBar} />
      </Surface>
    );
  }

  return (
    <View style={styles.container}>
      <IconButton
        icon={() => recordingStatus.isRecording ? <MicOff size={24} color={theme.colors.error} /> : <Mic size={24} color={theme.colors.primary} />}
        mode={recordingStatus.isRecording ? "contained" : "contained-tonal"}
        style={[
          styles.recordButton,
          recordingStatus.isRecording && { backgroundColor: theme.colors.errorContainer }
        ]}
        onPress={recordingStatus.isRecording ? stopRecording : startRecording}
        disabled={disabled}
      />
      
      {recordingStatus.isRecording && (
        <View style={styles.recordingInfo}>
          <Text variant="bodySmall" style={styles.durationText}>
            {formatDuration(recordingStatus.duration)} / {formatDuration(maxDuration)}
          </Text>
          <ProgressBar 
            progress={recordingStatus.duration / maxDuration} 
            style={styles.durationBar}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  recordButton: {
    margin: 4,
  },
  recordingInfo: {
    alignItems: 'center',
    marginTop: 8,
    minWidth: 120,
  },
  durationText: {
    marginBottom: 4,
  },
  durationBar: {
    width: 100,
    height: 4,
  },
  transcriptionContainer: {
    padding: 12,
    margin: 4,
    borderRadius: 8,
  },
  transcriptionText: {
    marginBottom: 4,
    fontStyle: 'italic',
  },
  confidenceText: {
    opacity: 0.7,
    marginBottom: 8,
  },
  transcriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  playbackContainer: {
    padding: 8,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  transcribingContainer: {
    padding: 12,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressBar: {
    width: 100,
    marginTop: 8,
  },
});

export default VoiceInputButton;