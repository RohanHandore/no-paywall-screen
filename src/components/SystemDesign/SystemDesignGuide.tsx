import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle, AlertCircle, HelpCircle, Copy } from "lucide-react";
import { TranscriptionPanel } from "../Transcription/TranscriptionPanel";

type InterviewStage = 
  | "requirements"
  | "capacity-estimation"
  | "high-level-design"
  | "deep-dive"
  | "scaling-tradeoffs";

type LLDStage =
  | "problem-understanding"
  | "entity-identification"
  | "class-design"
  | "api-design"
  | "edge-cases";

interface CoverageItem {
  topic: string;
  status: "covered" | "missing" | "partial";
}

interface SystemDesignGuideProps {
  mode: "hld" | "lld";
}

export const SystemDesignGuide = ({ mode }: SystemDesignGuideProps) => {
  const [currentStage, setCurrentStage] = useState<InterviewStage | LLDStage>(
    mode === "hld" ? "requirements" : "problem-understanding"
  );
  const [coverage, setCoverage] = useState<CoverageItem[]>([]);
  const [aiGuidance, setAiGuidance] = useState<string>("");
  const [generatedAnswer, setGeneratedAnswer] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // HLD stages
  const hldStages: InterviewStage[] = [
    "requirements",
    "capacity-estimation",
    "high-level-design",
    "deep-dive",
    "scaling-tradeoffs"
  ];

  // LLD stages
  const lldStages: LLDStage[] = [
    "problem-understanding",
    "entity-identification",
    "class-design",
    "api-design",
    "edge-cases"
  ];

  const stages = mode === "hld" ? hldStages : lldStages;
  const currentStageIndex = stages.indexOf(currentStage as any);
  const progress = ((currentStageIndex + 1) / stages.length) * 100;

  // Stage display names
  const stageNames: Record<string, string> = {
    "requirements": "Requirements Clarification",
    "capacity-estimation": "Capacity Estimation",
    "high-level-design": "High-Level Architecture",
    "deep-dive": "Component Deep Dive",
    "scaling-tradeoffs": "Scaling & Trade-offs",
    "problem-understanding": "Problem Understanding",
    "entity-identification": "Entity Identification",
    "class-design": "Class Design",
    "api-design": "API Design",
    "edge-cases": "Edge Cases & Concurrency"
  };

  // Initialize coverage based on stage
  useEffect(() => {
    loadCoverageForStage(currentStage);
    loadAiGuidance(currentStage);
    // Auto-analyze coverage when stage changes
    analyzeCurrentCoverage();
  }, [currentStage]);

  // Auto-detect stage periodically based on conversation
  useEffect(() => {
    const interval = setInterval(async () => {
      if (window.electronAPI.detectCurrentStage) {
        const result = await window.electronAPI.detectCurrentStage(mode);
        if (result.success && result.stage && result.confidence && result.confidence > 0.7) {
          setCurrentStage(result.stage as any);
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [mode]);

  const loadCoverageForStage = (stage: string) => {
    // Mock coverage data - will be replaced with AI analysis
    const coverageData: Record<string, CoverageItem[]> = {
      "requirements": [
        { topic: "User count & scale", status: "missing" },
        { topic: "Read/Write ratio", status: "missing" },
        { topic: "Data retention policy", status: "missing" },
        { topic: "Consistency requirements", status: "missing" }
      ],
      "capacity-estimation": [
        { topic: "Storage calculations", status: "missing" },
        { topic: "Bandwidth estimates", status: "missing" },
        { topic: "Server count", status: "missing" }
      ],
      "high-level-design": [
        { topic: "Client layer", status: "missing" },
        { topic: "Load balancer", status: "missing" },
        { topic: "Application servers", status: "missing" },
        { topic: "Database design", status: "missing" },
        { topic: "Caching strategy", status: "missing" }
      ],
      "problem-understanding": [
        { topic: "Problem statement clear", status: "missing" },
        { topic: "Constraints identified", status: "missing" },
        { topic: "Actors identified", status: "missing" }
      ],
      "entity-identification": [
        { topic: "Main entities listed", status: "missing" },
        { topic: "Relationships defined", status: "missing" },
        { topic: "Attributes identified", status: "missing" }
      ]
    };
    setCoverage(coverageData[stage] || []);
  };

  const loadAiGuidance = (stage: string) => {
    const guidance: Record<string, string> = {
      "requirements": "Start by clarifying the functional and non-functional requirements. Ask about scale, users, and key features.",
      "capacity-estimation": "Calculate storage, bandwidth, and server requirements based on the scale discussed.",
      "high-level-design": "Design the overall architecture with major components and their interactions.",
      "deep-dive": "Explain specific components in detail when the interviewer asks.",
      "scaling-tradeoffs": "Discuss how to scale the system and trade-offs between different approaches.",
      "problem-understanding": "Clearly understand the problem, constraints, and requirements before designing.",
      "entity-identification": "Identify all entities, their attributes, and relationships in the system.",
      "class-design": "Design classes with proper encapsulation, inheritance, and design patterns.",
      "api-design": "Define clear API contracts with method signatures and error handling.",
      "edge-cases": "Consider edge cases, error handling, and thread safety in your design."
    };
    setAiGuidance(guidance[stage] || "Continue with your current discussion.");
  };

  const analyzeCurrentCoverage = async () => {
    if (!window.electronAPI.analyzeCoverage) return;
    
    try {
      const result = await window.electronAPI.analyzeCoverage(mode, currentStage);
      if (result.success && result.coverage) {
        setCoverage(result.coverage);
      }
    } catch (error) {
      console.error("Error analyzing coverage:", error);
    }
  };

  const handleGenerateAnswer = async () => {
    setIsGenerating(true);
    setGeneratedAnswer("");
    
    try {
      // Call AI to generate answer for current stage
      const result = await window.electronAPI.generateNextResponse?.();
      
      if (result?.success && result.response) {
        setGeneratedAnswer(result.response);
      } else {
        setGeneratedAnswer("Failed to generate answer. Please try again.");
      }
    } catch (error) {
      console.error("Error generating answer:", error);
      setGeneratedAnswer("Error generating answer. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAnswer = () => {
    if (generatedAnswer) {
      navigator.clipboard.writeText(generatedAnswer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navigateStage = (direction: "prev" | "next") => {
    const newIndex = direction === "next" 
      ? Math.min(currentStageIndex + 1, stages.length - 1)
      : Math.max(currentStageIndex - 1, 0);
    setCurrentStage(stages[newIndex] as any);
    setGeneratedAnswer("");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          navigateStage("next");
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigateStage("prev");
        } else if (e.key === "g" || e.key === "G") {
          e.preventDefault();
          handleGenerateAnswer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStageIndex]);

  return (
    <div className="flex gap-3 px-4 py-3">
      {/* Left: Transcription Panel */}
      <div className="w-80 flex-shrink-0">
        <TranscriptionPanel />
      </div>

      {/* Right: AI Guidance */}
      <div className="flex-1 space-y-3">
        {/* Stage Progress Header */}
        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">
              {mode === "hld" ? "🏗️ High-Level Design" : "🔧 Low-Level Design"}
            </h2>
            <span className="text-sm text-white/60">
              Stage {currentStageIndex + 1} of {stages.length}
            </span>
          </div>

          {/* Current Stage */}
          <div className="mb-3">
            <h3 className="text-sm font-medium text-white mb-2">
              {stageNames[currentStage]}
            </h3>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stage Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateStage("prev")}
              disabled={currentStageIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => navigateStage("next")}
              disabled={currentStageIndex === stages.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
            <div className="flex-1" />
            <span className="text-xs text-white/40">
              Ctrl+← / Ctrl+→ to navigate
            </span>
          </div>
        </div>

        {/* AI Guidance */}
        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-medium text-white">AI Guidance</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {aiGuidance}
          </p>
        </div>

        {/* Coverage Tracking */}
        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">Coverage</h3>
          <div className="space-y-2">
            {coverage.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.status === "covered" && (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
                {item.status === "partial" && (
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                )}
                {item.status === "missing" && (
                  <HelpCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
                )}
                <span className={`text-sm ${
                  item.status === "covered" ? "text-green-300" :
                  item.status === "partial" ? "text-yellow-300" :
                  "text-white/50"
                }`}>
                  {item.topic}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Answer Button */}
        <button
          onClick={handleGenerateAnswer}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Answer for This Stage</span>
              <span className="text-xs opacity-70">(Ctrl+G)</span>
            </>
          )}
        </button>

        {/* Generated Answer */}
        {generatedAnswer && (
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Generated Answer</h3>
              <button
                onClick={handleCopyAnswer}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition"
              >
                <Copy size={12} />
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
              {generatedAnswer}
            </p>
          </div>
        )}

        {/* Stats Panel */}
        <div className="bg-black/60 rounded-lg p-4 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">📊 Progress Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded p-3">
              <div className="text-xs text-white/50 mb-1">Macro View</div>
              <div className="text-sm text-white font-medium">
                {currentStageIndex + 1}/{stages.length} Stages
              </div>
            </div>
            <div className="bg-white/5 rounded p-3">
              <div className="text-xs text-white/50 mb-1">Coverage</div>
              <div className="text-sm text-white font-medium">
                {coverage.filter(c => c.status === "covered").length}/{coverage.length} Topics
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
