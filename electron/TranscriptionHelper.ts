import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { BrowserWindow } from "electron";
import { configHelper } from "./ConfigHelper";

export class TranscriptionHelper {
  private deepgram: any;
  private liveConnection: any;
  private isActive: boolean = false;
  private mainWindow: BrowserWindow | null;
  private mediaRecorder: any = null;
  private audioChunks: any[] = [];

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.initializeDeepgram();
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

      // Create live transcription connection
      this.liveConnection = this.deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        punctuate: true,
      });

      // Set up event listeners
      this.liveConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log("Deepgram connection opened");
        this.isActive = true;

        // Note: Actual microphone capture would require additional setup
        // For production, you would use a library like node-mic or implement
        // native audio capture. This is a placeholder showing the structure.
        console.log("Transcription started - ready to receive audio");
        
        // Send status to renderer
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("transcription-status", {
            active: true,
            message: "Recording started",
          });
        }
      });

      this.liveConnection.on(
        LiveTranscriptionEvents.Transcript,
        (data: any) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final;

          if (transcript && transcript.length > 0) {
            console.log(`Transcript [${isFinal ? "final" : "interim"}]:`, transcript);
            
            // Send to renderer
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send("transcript-received", {
                text: transcript,
                isFinal: isFinal,
              });
            }
          }
        }
      );

      this.liveConnection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error("Deepgram error:", error);
        
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
  sendAudioData(audioData: Buffer) {
    if (this.liveConnection && this.isActive) {
      try {
        this.liveConnection.send(audioData);
      } catch (error) {
        console.error("Error sending audio to Deepgram:", error);
      }
    }
  }

  stopTranscription() {
    console.log("Stopping transcription");
    
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
        // Stop the media recorder if it exists
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
  }

  isTranscribing(): boolean {
    return this.isActive;
  }
  
  // Update Deepgram client when config changes
  updateConfig() {
    this.initializeDeepgram();
  }
}
