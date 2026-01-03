import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { AISuggestionButton } from "../Interview/AISuggestionButton";

interface TranscriptEntry {
  id: string;
  speaker: "interviewer" | "candidate";
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export const TranscriptionPanel = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<"interviewer" | "candidate">("candidate");
  const [hasDeepgramKey, setHasDeepgramKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);

  // Check if Deepgram key is configured
  useEffect(() => {
    const checkDeepgramKey = async () => {
      try {
        console.log("Checking for Deepgram API key...");
        const config = await window.electronAPI.getConfig();
        console.log("Config received:", { hasDeepgramKey: !!config.deepgramApiKey });
        setHasDeepgramKey(!!config.deepgramApiKey);
        
        if (!config.deepgramApiKey) {
          console.warn("⚠️ No Deepgram API key found in config!");
        } else {
          console.log("✅ Deepgram API key found!");
        }
      } catch (error) {
        console.error("Failed to check Deepgram key:", error);
        setHasDeepgramKey(false);
      }
    };
    checkDeepgramKey();
  }, []);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Listen for transcript events from Electron
  useEffect(() => {
    const unsubscribe = window.electronAPI.onTranscriptReceived(
      (data: { text: string; isFinal: boolean; speaker?: "interviewer" | "candidate" }) => {
        setTranscripts((prev) => {
          // Use speaker from Deepgram diarization, or fall back to manual selection
          const speaker = data.speaker || currentSpeaker;
          
          // If it's interim, update the last non-final entry
          if (!data.isFinal) {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && !lastEntry.isFinal && lastEntry.speaker === speaker) {
              return [
                ...prev.slice(0, -1),
                { ...lastEntry, text: data.text },
              ];
            }
            // Add new interim entry
            return [
              ...prev,
              {
                id: Date.now().toString(),
                speaker: speaker,
                text: data.text,
                timestamp: new Date(),
                isFinal: false,
              },
            ];
          }
          
          // Final transcript
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && !lastEntry.isFinal && lastEntry.speaker === speaker) {
            return [
              ...prev.slice(0, -1),
              { ...lastEntry, text: data.text, isFinal: true },
            ];
          }
          
          return [
            ...prev,
            {
              id: Date.now().toString(),
              speaker: speaker,
              text: data.text,
              timestamp: new Date(),
              isFinal: true,
            },
          ];
        });
      }
    );

    return () => unsubscribe();
  }, [currentSpeaker]);

  // Listen for audio capture requests from Electron
  useEffect(() => {
    console.log("Setting up microphone capture...");
    const unsubscribe = window.electronAPI.onStartAudioCapture(async () => {
      console.log("🎤 Received start-audio-capture event from Electron!");
      try {
        console.log("Requesting microphone access...");
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("getUserMedia is not supported in this browser");
        }
        
        // Capture microphone - it will pick up BOTH you and the interviewer
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: false, // Disable to capture both speakers clearly
            noiseSuppression: false,  // Disable to keep both voices
          } 
        });
        
        console.log("✅ Microphone access granted!");
        micStreamRef.current = micStream;

        // Create MediaRecorder for microphone
        const micRecorder = new MediaRecorder(micStream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        
        micRecorderRef.current = micRecorder;

        // Send all audio to Deepgram for speaker diarization
        micRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            event.data.arrayBuffer().then((buffer) => {
              // Send to mic channel - Deepgram will separate speakers automatically
              window.electronAPI.sendAudioData(buffer, "mic");
            });
          }
        };

        micRecorder.start(100);
        console.log("✅ Microphone recording started!");
        console.log("🎙️ Deepgram will automatically detect and separate speakers");

      } catch (error) {
        console.error("❌ Error accessing microphone:", error);
        alert(`Microphone error: ${error}`);
        setIsRecording(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleRecording = async () => {
    console.log("🎤 Microphone button clicked! Current state:", { isRecording, hasDeepgramKey });
    
    if (isRecording) {
      console.log("Stopping recording...");
      
      // Stop the microphone recorder
      if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
        micRecorderRef.current.stop();
      }
      
      // Stop all microphone tracks
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      
      await window.electronAPI.stopTranscription();
      setIsRecording(false);
      console.log("✅ Recording stopped");
    } else {
      console.log("Starting recording...");
      try {
        const result = await window.electronAPI.startTranscription();
        console.log("Start transcription result:", result);
        
        if (result.success) {
          setIsRecording(true);
          console.log("✅ Recording started successfully!");
        } else {
          console.error("❌ Failed to start transcription:", result.error);
          alert(`Failed to start transcription: ${result.error}`);
        }
      } catch (error) {
        console.error("❌ Error calling startTranscription:", error);
        alert(`Error: ${error}`);
      }
    }
  };

  const clearTranscripts = () => {
    setTranscripts([]);
  };

  if (!hasDeepgramKey) {
    return (
      <div className="bg-black/60 rounded-lg p-3 border border-white/10">
        <div className="text-xs text-white/60 text-center py-2">
          Configure Deepgram API key in settings to enable live transcription
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/60 rounded-lg border border-white/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {isRecording ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
          )}
          <h3 className="text-xs font-medium text-white">Live Transcript</h3>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearTranscripts}
            className="text-xs text-white/60 hover:text-white transition px-2 py-1 rounded hover:bg-white/5"
          >
            Clear
          </button>
          
          <button
            onClick={toggleRecording}
            className={`p-2 rounded transition ${
              isRecording
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {isRecording ? <Mic size={14} /> : <MicOff size={14} />}
          </button>
        </div>
      </div>

      {/* Transcript List - Chat Style */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[300px] min-h-[150px]"
      >
        {transcripts.length === 0 ? (
          <div className="text-xs text-white/40 text-center py-4">
            {isRecording
              ? "🎙️ Listening... Deepgram will automatically separate speakers"
              : "Click the microphone to start recording"}
          </div>
        ) : (
          transcripts.map((entry) => (
            <div
              key={entry.id}
              className={`p-2 rounded ${
                entry.speaker === "candidate" 
                  ? "bg-blue-500/10 border-l-2 border-blue-400" 
                  : "bg-purple-500/10 border-l-2 border-purple-400"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {entry.speaker === "interviewer" ? "👤 Interviewer" : "🎤 You"}
                </span>
                <span className="text-xs text-white/40">
                  {entry.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div
                className={`text-xs leading-relaxed ${
                  entry.isFinal ? "text-white/90" : "text-white/50 italic"
                }`}
              >
                {entry.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Suggestion Button */}
      {transcripts.length > 0 && (
        <div className="p-3 border-t border-white/10">
          <AISuggestionButton />
        </div>
      )}
    </div>
  );
};
