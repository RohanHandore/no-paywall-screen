import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
      (data: { text: string; isFinal: boolean }) => {
        setTranscripts((prev) => {
          // If it's interim, update the last non-final entry
          if (!data.isFinal) {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && !lastEntry.isFinal && lastEntry.speaker === currentSpeaker) {
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
                speaker: currentSpeaker,
                text: data.text,
                timestamp: new Date(),
                isFinal: false,
              },
            ];
          }
          
          // Final transcript
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && !lastEntry.isFinal && lastEntry.speaker === currentSpeaker) {
            return [
              ...prev.slice(0, -1),
              { ...lastEntry, text: data.text, isFinal: true },
            ];
          }
          
          return [
            ...prev,
            {
              id: Date.now().toString(),
              speaker: currentSpeaker,
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
    console.log("Setting up audio capture listener...");
    const unsubscribe = window.electronAPI.onStartAudioCapture(async () => {
      console.log("🎤 Received start-audio-capture event from Electron!");
      try {
        console.log("Requesting microphone access...");
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("getUserMedia is not supported in this browser");
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          } 
        });
        
        console.log("✅ Microphone access granted!");
        mediaStreamRef.current = stream;

        // Create MediaRecorder to capture audio
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        
        mediaRecorderRef.current = mediaRecorder;
        console.log("MediaRecorder created");

        // Send audio data to Electron as it's recorded
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log(`Sending audio chunk: ${event.data.size} bytes`);
            event.data.arrayBuffer().then((buffer) => {
              window.electronAPI.sendAudioData(buffer);
            });
          }
        };

        // Start recording in small chunks (100ms)
        mediaRecorder.start(100);
        console.log("✅ Microphone capture started!");
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
      // Stop the media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all tracks in the media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
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
        
        {/* Speaker Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSpeaker(s => s === "candidate" ? "interviewer" : "candidate")}
            className={`text-xs px-2 py-1 rounded transition ${
              currentSpeaker === "candidate"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-purple-500/20 text-purple-400"
            }`}
            title="Toggle speaker"
          >
            {currentSpeaker === "candidate" ? "🎤 You" : "👤 Them"}
          </button>
          
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
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
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
              ? "Listening..."
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
    </div>
  );
};
