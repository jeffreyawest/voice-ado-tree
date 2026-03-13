import { useCallback, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

interface SpeechRecognitionOptions {
  /** Called with interim (partial) text — display only */
  onInterim: (text: string) => void;
  /** Called with finalized speech segments */
  onFinalized: (segment: string) => void;
  /** Called on error */
  onError: (error: string) => void;
}

export function useSpeechRecognition({ onInterim, onFinalized, onError }: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);

  const start = useCallback(() => {
    const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
    const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
    if (!key || !region) {
      onError("Azure Speech key/region not configured. Set VITE_AZURE_SPEECH_KEY and VITE_AZURE_SPEECH_REGION in .env");
      return;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.setProperty(
      SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs,
      "1500"
    );
    speechConfig.setProperty(
      SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
      "5000"
    );

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizing = (_s, e) => {
      onInterim(e.result.text);
    };

    recognizer.recognized = (_s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        onFinalized(e.result.text);
      }
    };

    recognizer.canceled = (_s, e) => {
      if (e.reason === SpeechSDK.CancellationReason.Error) {
        onError(`Speech recognition error: ${e.errorDetails}`);
      }
    };

    recognizer.startContinuousRecognitionAsync(
      () => setIsListening(true),
      (err) => onError(`Failed to start recognition: ${err}`)
    );

    recognizerRef.current = recognizer;
  }, [onInterim, onFinalized, onError]);

  const stop = useCallback(() => {
    const recognizer = recognizerRef.current;
    if (!recognizer) return;
    recognizer.stopContinuousRecognitionAsync(
      () => {
        setIsListening(false);
        recognizer.close();
        recognizerRef.current = null;
      },
      (err) => console.error("Failed to stop recognition:", err)
    );
  }, []);

  return { isListening, start, stop };
}
