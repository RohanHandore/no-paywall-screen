import { useState, useEffect } from "react";
import { Code2, Network, Blocks } from "lucide-react";

type InterviewMode = "coding" | "system-design-hld" | "system-design-lld";

interface ModeSwitcherProps {
  onModeChange?: (mode: InterviewMode) => void;
}

export const ModeSwitcher = ({ onModeChange }: ModeSwitcherProps) => {
  const [currentMode, setCurrentMode] = useState<InterviewMode>("coding");
  const [isLoading, setIsLoading] = useState(true);

  // Load current mode from config
  useEffect(() => {
    const loadMode = async () => {
      try {
        const config = await window.electronAPI.getConfig();
        const mode = (config.interviewMode || "coding") as InterviewMode;
        setCurrentMode(mode);
      } catch (error) {
        console.error("Failed to load interview mode:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMode();
  }, []);

  const handleModeChange = async (mode: InterviewMode) => {
    setCurrentMode(mode);
    
    // Save to config
    try {
      await window.electronAPI.updateConfig({ interviewMode: mode });
      onModeChange?.(mode);
    } catch (error) {
      console.error("Failed to save interview mode:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  const modes = [
    {
      id: "coding" as InterviewMode,
      name: "Coding",
      icon: Code2,
      color: "blue",
      description: "Coding problems"
    },
    {
      id: "system-design-hld" as InterviewMode,
      name: "HLD",
      icon: Network,
      color: "purple",
      description: "High-level design"
    },
    {
      id: "system-design-lld" as InterviewMode,
      name: "LLD",
      icon: Blocks,
      color: "green",
      description: "Low-level design"
    }
  ];

  return (
    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg p-1 border border-white/10">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium
              ${isActive 
                ? `bg-${mode.color}-500/20 text-${mode.color}-400 border border-${mode.color}-500/30` 
                : "text-white/60 hover:text-white/90 hover:bg-white/5"
              }
            `}
            title={mode.description}
          >
            <Icon size={14} />
            <span>{mode.name}</span>
          </button>
        );
      })}
    </div>
  );
};
