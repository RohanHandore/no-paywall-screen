import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { BrowserWindow } from "electron";
import { configHelper } from "./ConfigHelper";
import { AIInterviewHelper } from "./AIInterviewHelper";

export class TranscriptionHelper {
  private deepgram: any;
  private liveConnection: any; // Single connection with speaker diarization
  private isActive: boolean = false;
  private mainWindow: BrowserWindow | null;
  private mediaRecorder: any = null;
  private audioChunks: any[] = [];
  private aiInterviewHelper: AIInterviewHelper | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.initializeDeepgram();
  }

  setAIInterviewHelper(aiHelper: AIInterviewHelper) {
    this.aiInterviewHelper = aiHelper;
  }

  private initializeDeepgram() {
    const config = configHelper.loadConfig();
    if (config.deepgramApiKey) {
      try {
        this.deepgram = createClient(config.deepgramApiKey);
        console.log("Deepgram client initialized");
      } catch (error) {
        console.error("Failed to initialize Deepgram client:", error);
      }
    }
  }


  async startTranscription(): Promise<{ success: boolean; error?: string }> {
    console.log("🎤 startTranscription called");
    try {
      const config = configHelper.loadConfig();
      console.log("Config loaded, checking for Deepgram API key...");
      
      if (!config.deepgramApiKey) {
        console.error("❌ No Deepgram API key found in config");
        return { success: false, error: "Deepgram API key not configured. Please add it in Settings." };
      }

      console.log("✅ Deepgram API key found");

      if (!this.deepgram) {
        console.log("Initializing Deepgram client...");
        this.initializeDeepgram();
      }

      if (!this.deepgram) {
        console.error("❌ Failed to initialize Deepgram client");
        return { success: false, error: "Failed to initialize Deepgram client" };
      }
      
      console.log("✅ Deepgram client ready");

      // Create ONE connection with speaker diarization enabled
      this.liveConnection = this.deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        punctuate: true,
        diarize: true, // Enable speaker diarization - Deepgram will automatically detect different speakers
      });

      // Set up event listeners
      this.liveConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log("🎙️ Deepgram connection opened with speaker diarization");
        this.isActive = true;
        
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("transcription-status", {
            active: true,
            message: "Recording started",
          });
        }
      });

      this.liveConnection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        const isFinal = data.is_final;
        
        // Get speaker from Deepgram's diarization
        const words = data.channel?.alternatives?.[0]?.words;
        let speakerId = null;
        if (words && words.length > 0) {
          speakerId = words[0].speaker; // 0, 1, 2, etc.
        }

        if (transcript && transcript.length > 0) {
          // Map speaker IDs: 0 = candidate (you), 1+ = interviewer
          const speaker = speakerId === 0 ? "candidate" : "interviewer";
          
          console.log(`${speaker === "candidate" ? "🎤 YOU" : "👤 INTERVIEWER"} [${isFinal ? "FINAL" : "interim"}]: "${transcript}"`);
          
          // Forward final transcripts to AI Interview Helper
          if (isFinal && this.aiInterviewHelper) {
            this.aiInterviewHelper.addTranscript(speaker, transcript);
          }
          
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send("transcript-received", {
              text: transcript,
              isFinal: isFinal,
              speaker: speaker,
            });
          }
        }
      });

      this.liveConnection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error("❌ Deepgram error:", error);
        
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("transcription-error", {
            error: error.message || "Transcription error occurred",
          });
        }
        
        this.stopTranscription();
      });

      this.liveConnection.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed");
        this.isActive = false;
        
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("transcription-status", {
            active: false,
            message: "Recording stopped",
          });
        }
      });

      // Setup microphone capture
      // Note: This requires additional implementation for production
      this.setupMicrophoneCapture();

      return { success: true };
    } catch (error: any) {
      console.error("Failed to start transcription:", error);
      return { success: false, error: error.message };
    }
  }

  private setupMicrophoneCapture() {
    console.log("Microphone capture setup: Requesting audio from renderer process");
    
    // Tell the renderer process to start capturing audio
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("start-audio-capture");
    }
  }
  
  // Method to receive audio data from renderer process
  sendAudioData(audioData: Buffer, source: "mic" | "system" = "mic") {
    if (!this.isActive || !this.liveConnection) return;

    try {
      // Send audio to Deepgram - it will automatically detect and separate speakers
      this.liveConnection.send(audioData);
    } catch (error) {
      console.error(`❌ Error sending audio to Deepgram:`, error);
    }
  }

  stopTranscription() {
    console.log("🛑 Stopping transcription");
    
    if (this.liveConnection) {
      try {
        this.liveConnection.finish();
      } catch (error) {
        console.error("Error finishing live connection:", error);
      }
      this.liveConnection = null;
    }
    
    if (this.mediaRecorder) {
      try {
        if (typeof this.mediaRecorder.stop === 'function') {
          this.mediaRecorder.stop();
        }
      } catch (error) {
        console.error("Error stopping media recorder:", error);
      }
      this.mediaRecorder = null;
    }
    
    this.isActive = false;
    this.audioChunks = [];
    
    // Notify renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("transcription-status", {
        active: false,
        message: "Recording stopped",
      });
    }
  }

  isTranscribing(): boolean {
    return this.isActive;
  }
  
  // Update Deepgram client when config changes
  updateConfig() {
    this.initializeDeepgram();
  }
}
