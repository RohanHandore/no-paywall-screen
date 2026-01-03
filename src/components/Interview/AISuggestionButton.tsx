import { useState, useEffect, useCallback } from "react";
import { Sparkles, X, Copy, Loader2 } from "lucide-react";

interface AISuggestionButtonProps {
  includeScreenshotContext?: boolean;
}

export const AISuggestionButton = ({ includeScreenshotContext = false }: AISuggestionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGetSuggestion = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setCopied(false);

    try {
      const result = await window.electronAPI.generateNextResponse(includeScreenshotContext);
      
      if (result.success && result.response) {
        setSuggestion(result.response);
      } else {
        setError(result.error || "Failed to generate suggestion");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, includeScreenshotContext]);

  const handleCopy = () => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSuggestion(null);
    setError(null);
  };

  // Listen for keyboard shortcut (Ctrl+1 or Cmd+1)
  // This listener is always active, even if the component is conditionally rendered
  useEffect(() => {
    console.log("AISuggestionButton: Setting up shortcut listener for Ctrl+1")
    const unsubscribe = window.electronAPI.onTriggerAISuggestion(() => {
      console.log("AISuggestionButton: Shortcut triggered, calling handleGetSuggestion")
      handleGetSuggestion();
    });

    return () => {
      console.log("AISuggestionButton: Cleaning up shortcut listener")
      unsubscribe();
    };
  }, [handleGetSuggestion]);

  return (
    <div className="space-y-3">
      {/* Main Button */}
      <button
        onClick={handleGetSuggestion}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition ${
          isLoading
            ? "bg-purple-600/50 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        } text-white text-sm font-medium shadow-lg`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>What Should I Say Next?</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-200 mt-1">{error}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-red-300 hover:text-red-100 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Suggestion Display */}
      {suggestion && (
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 space-y-3 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-white/90">
                AI Suggestion
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>

          {/* Suggestion Text */}
          <div className="bg-black/30 rounded p-3">
            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
              {suggestion}
            </p>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3 rounded transition flex items-center justify-center gap-2"
          >
            <Copy size={12} />
            <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
          </button>

          {/* Helper Text */}
          <p className="text-xs text-white/50 text-center">
            💡 Read this naturally and add your own style
          </p>
        </div>
      )}
    </div>
  );
};
