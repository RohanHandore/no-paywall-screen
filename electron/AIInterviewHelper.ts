import { BrowserWindow } from "electron";
import { configHelper } from "./ConfigHelper";
import OpenAI from "openai";
import fs from "fs";

interface TranscriptEntry {
  speaker: "candidate" | "interviewer";
  text: string;
  timestamp: Date;
}

export class AIInterviewHelper {
  private mainWindow: BrowserWindow | null;
  private openaiClient: OpenAI | null = null;
  private transcriptBuffer: TranscriptEntry[] = [];
  private getLatestScreenshot: (() => string | null) | null = null;
  private takeScreenshotOnDemand: (() => Promise<string>) | null = null;

  constructor(
    mainWindow: BrowserWindow, 
    getLatestScreenshot?: () => string | null,
    takeScreenshotOnDemand?: () => Promise<string>
  ) {
    this.mainWindow = mainWindow;
    this.getLatestScreenshot = getLatestScreenshot || null;
    this.takeScreenshotOnDemand = takeScreenshotOnDemand || null;
    this.initializeOpenAI();
  }

  setGetLatestScreenshot(fn: () => string | null) {
    this.getLatestScreenshot = fn;
  }

  setTakeScreenshotOnDemand(fn: () => Promise<string>) {
    this.takeScreenshotOnDemand = fn;
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

  async generateNextResponse(includeScreenshotContext?: boolean): Promise<{ success: boolean; response?: string; error?: string }> {
    console.log("🤖 Generating 'What to Say Next' suggestion...", { includeScreenshotContext });

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
      // Get screenshot if requested
      let screenshotData: string | null = null;
      if (includeScreenshotContext) {
        // Always take a fresh screenshot for the most current screen context
        let screenshotPath: string | null = null;
        if (this.takeScreenshotOnDemand) {
          console.log("📸 Taking fresh screenshot for AI suggestion context...");
          try {
            screenshotPath = await this.takeScreenshotOnDemand();
            if (screenshotPath && fs.existsSync(screenshotPath)) {
              console.log("✅ Fresh screenshot taken successfully:", screenshotPath);
            } else {
              console.warn("⚠️ Screenshot was taken but file doesn't exist:", screenshotPath);
              screenshotPath = null;
            }
          } catch (error: any) {
            console.error("❌ Failed to take screenshot:", error?.message || error);
            screenshotPath = null;
          }
        } else {
          console.log("⚠️ Cannot take screenshot on-demand - screenshot context unavailable");
        }
        
        // Read screenshot if we have a valid path
        if (screenshotPath && fs.existsSync(screenshotPath)) {
          try {
            screenshotData = fs.readFileSync(screenshotPath).toString('base64');
            console.log("📸 Including fresh screenshot context in AI suggestion");
          } catch (error) {
            console.warn("⚠️ Failed to read screenshot for context:", error);
          }
        } else {
          console.log("⚠️ No screenshot available for context");
        }
      }

      const basePrompt = `You are an expert interview coach helping a candidate in a live coding interview.

Here's the recent conversation:
${conversationContext}

Last thing the interviewer said: "${lastInterviewerMessage}"`;

      const promptWithScreenshot = screenshotData 
        ? `${basePrompt}

IMPORTANT: The candidate's screen is also provided as context. Use what you see on the screen (code, UI, problem statement, etc.) to provide a more relevant and contextual response.`
        : basePrompt;

      const finalPrompt = `${promptWithScreenshot}

Based on this context${screenshotData ? ' and the screen content' : ''}, provide a natural, confident response that the candidate should say next. 

Your response should:
- Directly answer or address what the interviewer said
- Show technical knowledge and clear thinking
- Be conversational and natural (not robotic)
- Include specific examples or explanations when relevant
- ${screenshotData ? 'Reference specific details from the screen when relevant (code, UI elements, etc.)' : ''}
- Be 2-4 sentences long

Provide ONLY the response text that the candidate should say. Do not include any meta-commentary or labels.`;

      // Build messages array
      const messages: any[] = [
        { 
          role: "system", 
          content: "You are an expert interview coach. Provide natural, confident responses that sound like a real person talking in an interview." 
        }
      ];

      // If screenshot is included, use vision model and add image
      if (screenshotData) {
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: finalPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshotData}`
              }
            }
          ]
        });

        // Use vision-capable model
        const response = await this.openaiClient.chat.completions.create({
          model: "gpt-4o", // Vision-capable model
          messages: messages,
          max_tokens: 300,
          temperature: 0.7
        });

        const suggestedResponse = response.choices[0].message.content || "";
        console.log("✅ Generated suggestion with screenshot context:", suggestedResponse.substring(0, 100) + "...");
        return { success: true, response: suggestedResponse };
      } else {
        // No screenshot, use text-only model
        messages.push({ role: "user", content: finalPrompt });

        const response = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini", // Fast and cost-effective
          messages: messages,
          max_tokens: 300,
          temperature: 0.7
        });

        const suggestedResponse = response.choices[0].message.content || "";
        console.log("✅ Generated suggestion:", suggestedResponse.substring(0, 100) + "...");
        return { success: true, response: suggestedResponse };
      }

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
