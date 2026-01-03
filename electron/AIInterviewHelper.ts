import { BrowserWindow } from "electron";
import { configHelper } from "./ConfigHelper";
import OpenAI from "openai";

interface TranscriptEntry {
  speaker: "candidate" | "interviewer";
  text: string;
  timestamp: Date;
}

export class AIInterviewHelper {
  private mainWindow: BrowserWindow | null;
  private openaiClient: OpenAI | null = null;
  private transcriptBuffer: TranscriptEntry[] = [];

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    const config = configHelper.loadConfig();
    if (config.apiKey && config.apiProvider === "openai") {
      this.openaiClient = new OpenAI({ apiKey: config.apiKey });
      console.log("AI Interview Helper initialized with OpenAI");
    } else {
      console.log("AI Interview Helper: OpenAI API key not configured");
    }
  }

  // Add transcript to buffer for context
  addTranscript(speaker: "candidate" | "interviewer", text: string) {
    this.transcriptBuffer.push({
      speaker,
      text,
      timestamp: new Date()
    });

    // Keep only last 30 messages for context
    if (this.transcriptBuffer.length > 30) {
      this.transcriptBuffer.shift();
    }

    console.log(`AI Helper: Added transcript from ${speaker}: "${text.substring(0, 50)}..."`);
  }

  private getConversationContext(): string {
    if (this.transcriptBuffer.length === 0) {
      return "No conversation yet.";
    }

    return this.transcriptBuffer
      .slice(-15) // Last 15 messages
      .map(t => `${t.speaker === "candidate" ? "You" : "Interviewer"}: ${t.text}`)
      .join("\n");
  }

  async generateNextResponse(): Promise<{ success: boolean; response?: string; error?: string }> {
    console.log("🤖 Generating 'What to Say Next' suggestion...");

    if (!this.openaiClient) {
      return { 
        success: false, 
        error: "OpenAI API not configured. Please add your OpenAI API key in settings." 
      };
    }

    if (this.transcriptBuffer.length === 0) {
      return { 
        success: false, 
        error: "No conversation detected yet. Start talking with the interviewer first!" 
      };
    }

    const conversationContext = this.getConversationContext();
    const lastInterviewerMessage = this.transcriptBuffer
      .filter(t => t.speaker === "interviewer")
      .slice(-1)[0]?.text || "";

    try {
      const prompt = `You are an expert interview coach helping a candidate in a live coding interview.

Here's the recent conversation:
${conversationContext}

Last thing the interviewer said: "${lastInterviewerMessage}"

Based on this context, provide a natural, confident response that the candidate should say next. 

Your response should:
- Directly answer or address what the interviewer said
- Show technical knowledge and clear thinking
- Be conversational and natural (not robotic)
- Include specific examples or explanations when relevant
- Be 2-4 sentences long

Provide ONLY the response text that the candidate should say. Do not include any meta-commentary or labels.`;

      const response = await this.openaiClient.chat.completions.create({
        model: "gpt-4o-mini", // Fast and cost-effective
        messages: [
          { 
            role: "system", 
            content: "You are an expert interview coach. Provide natural, confident responses that sound like a real person talking in an interview." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const suggestedResponse = response.choices[0].message.content || "";
      
      console.log("✅ Generated suggestion:", suggestedResponse.substring(0, 100) + "...");

      return { success: true, response: suggestedResponse };

    } catch (error: any) {
      console.error("❌ Error generating AI suggestion:", error);
      return { 
        success: false, 
        error: error.message || "Failed to generate suggestion" 
      };
    }
  }

  clearBuffer() {
    this.transcriptBuffer = [];
    console.log("AI Helper: Transcript buffer cleared");
  }

  // Update API key if config changes
  updateConfig() {
    this.initializeOpenAI();
  }
}
