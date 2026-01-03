# Interview Coder - AI-Powered Coding Interview Assistant

A free, open-source desktop application that helps you for coding interviews using AI. The app automatically detects programming languages from screenshots and provides instant solutions, explanations, and debugging assistance. Now with **Live Transcription** and **AI Interview Coaching** features!

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- An API key from OpenAI, Gemini, or Anthropic (for AI solutions)
- Deepgram API key (optional, for live transcription feature)

### Installation & Running

1. **Clone the repository:**
```bash
git clone https://github.com/RohanHandore/no-paywall-screen.git
cd no-paywall-screen
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the app:**

**Windows:**
```bash
stealth-run.bat
```

**macOS/Linux:**
```bash
chmod +x stealth-run.sh
./stealth-run.sh
```

4. **First Time Setup:**
   - Press `Ctrl+B` (or `Cmd+B` on Mac) to make the window visible
   - Open Settings and enter your API keys:
     - **AI Provider API Key**: OpenAI, Gemini, or Anthropic API key
     - **Deepgram API Key** (optional): For live transcription feature
   - The app is ready to use!

---

## ⌨️ Complete Keyboard Shortcuts Reference

### Core Functionality
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+H` / `Cmd+H` | Take Screenshot | Capture the current screen (hides app window automatically) |
| `Ctrl+Enter` / `Cmd+Enter` | Process Screenshots | Analyze screenshots and generate AI solutions |
| `Ctrl+R` / `Cmd+R` | Reset View | Clear all screenshots and reset to queue view |
| `Ctrl+L` / `Cmd+L` | Delete Last Screenshot | Remove the most recently captured screenshot |
| `Ctrl+1` / `Cmd+1` | AI Suggestion | Get AI-powered "What Should I Say Next?" suggestion |

### Window Management
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+B` / `Cmd+B` | Toggle Visibility | Show/hide the application window |
| `Ctrl+T` / `Cmd+T` | Toggle Click-Through | Enable/disable click-through mode (mouse clicks pass through) |
| `Ctrl+Left/Right/Up/Down` | Move Window | Move the window in the specified direction |
| `Ctrl+[` / `Cmd+[` | Decrease Opacity | Make the window more transparent |
| `Ctrl+]` / `Cmd+]` | Increase Opacity | Make the window more opaque |

### Zoom Controls
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+-` / `Cmd+-` | Zoom Out | Decrease window zoom level |
| `Ctrl+0` / `Cmd+0` | Reset Zoom | Reset zoom to default (100%) |
| `Ctrl+=` / `Cmd+=` | Zoom In | Increase window zoom level |

### Application Control
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Q` / `Cmd+Q` | Quit Application | Exit the application |

---

## 🎯 Key Features

### 1. **Screenshot-Based Problem Solving**
- **Automatic Screenshot Capture**: Press `Ctrl+H` to capture coding problems
- **Multi-Screenshot Support**: Capture up to 5 screenshots per problem
- **Smart Window Hiding**: App window automatically hides during screenshot capture
- **Queue Management**: View, delete, and manage captured screenshots

### 2. **AI-Powered Solutions**
- **Multi-Provider Support**: Works with OpenAI, Google Gemini, or Anthropic Claude
- **Automatic Language Detection**: Detects programming language from screenshots
- **Problem Extraction**: Automatically extracts problem statements, constraints, and examples
- **Solution Generation**: Provides optimized solutions with:
  - Complete code implementations
  - Time and space complexity analysis
  - Step-by-step explanations
  - Best practices and patterns

### 3. **Live Transcription & Interview Coaching** ⭐ NEW
- **Real-Time Transcription**: Transcribe live interview conversations using Deepgram
- **Speaker Diarization**: Automatically separates interviewer and candidate speech
- **Live Transcript Panel**: View conversation history in real-time
- **AI Interview Suggestions**: Get AI-powered responses for "What Should I Say Next?"
- **Screenshot Context Integration**: 
  - Enable checkbox to include current screen context in AI suggestions
  - Automatically captures fresh screenshot when generating suggestions
  - Uses OpenAI Vision API for enhanced context-aware responses

### 4. **Debugging Assistant**
- **Error Analysis**: Screenshot errors and get structured feedback
- **Bug Detection**: AI identifies common mistakes and optimization opportunities
- **Code Review**: Get suggestions for improving code quality
- **Debug Mode**: Dedicated view for debugging with extra screenshot queue

### 5. **Advanced Window Features**
- **Click-Through Mode**: Make the app completely transparent to mouse clicks
- **Adjustable Opacity**: Control window transparency (10% to 100%)
- **Window Positioning**: Move window with arrow keys for optimal placement
- **Always on Top**: Window stays above other applications
- **Invisible to Screen Sharing**: Window can be hidden from screen recording tools

### 6. **Settings & Configuration**
- **API Key Management**: Secure local storage of API keys
- **Provider Selection**: Choose between OpenAI, Gemini, or Anthropic
- **Model Selection**: Configure different models for extraction, solutions, and debugging
- **Language Preferences**: Set preferred programming language
- **Deepgram Configuration**: Configure Deepgram API key for transcription

### 7. **Auto-Updates**
- **Automatic Updates**: App checks for and downloads updates automatically
- **Update Notifications**: Get notified when new versions are available
- **Seamless Installation**: Updates install automatically on app restart

---

## 💡 Use Cases & Workflows

### Use Case 1: Live Coding Interview Assistance
1. **Start Transcription**: Click the microphone button in Live Transcript panel
2. **Enable Screenshot Context**: Check "Include screen context for AI suggestions"
3. **Capture Problem**: Press `Ctrl+H` to screenshot the coding problem
4. **Get Solutions**: Press `Ctrl+Enter` to process and get AI solutions
5. **Get Interview Help**: Press `Ctrl+1` or click "What Should I Say Next?" for AI coaching
6. **View Transcript**: Monitor conversation in real-time with speaker identification

### Use Case 2: Practice & Learning
1. **Capture Problem**: Take screenshots of LeetCode, HackerRank, or Codeforces problems
2. **Process**: Let AI extract problem details and generate solutions
3. **Learn**: Study solutions with complexity analysis and explanations
4. **Practice**: Try implementing solutions yourself

### Use Case 3: Debugging Help
1. **Screenshot Error**: Capture code with error messages
2. **Switch to Debug View**: Process screenshots in debug mode
3. **Get Feedback**: Receive structured debugging assistance
4. **Fix Issues**: Follow AI suggestions to resolve problems

### Use Case 4: Interview Preparation
1. **Enable Transcription**: Set up Deepgram API key and start recording
2. **Practice Responses**: Use AI suggestions to practice answering interview questions
3. **Review Transcripts**: Analyze your conversation patterns
4. **Improve Communication**: Get suggestions for better technical explanations

---

## 🔧 How It Works

### Screenshot Processing Flow
1. **Capture**: Take screenshots using `Ctrl+H` (window auto-hides)
2. **Detect Language**: AI automatically detects programming language
3. **Extract Problem**: AI extracts problem statement, constraints, examples
4. **Generate Solution**: AI creates optimized solution with explanations
5. **Display Results**: View solutions with syntax highlighting and complexity analysis

### Live Transcription Flow
1. **Start Recording**: Click microphone button (requires Deepgram API key)
2. **Audio Capture**: App captures microphone audio
3. **Speaker Separation**: Deepgram automatically identifies different speakers
4. **Real-Time Display**: Transcripts appear in Live Transcript panel
5. **AI Integration**: Transcripts feed into AI for context-aware suggestions

### AI Suggestion Flow (with Screenshot Context)
1. **Enable Context**: Check "Include screen context" checkbox
2. **Request Suggestion**: Press `Ctrl+1` or click "What Should I Say Next?"
3. **Capture Screen**: App automatically takes fresh screenshot
4. **AI Analysis**: OpenAI Vision API analyzes both conversation and screen
5. **Get Response**: Receive contextual suggestion based on screen content and conversation

---

## 📋 Feature Details

### Screenshot Management
- **Queue System**: Maintains separate queues for main and debug views
- **Preview Thumbnails**: Visual preview of all captured screenshots
- **Delete Functionality**: Remove individual or last screenshot
- **Auto-Cleanup**: Old screenshots automatically removed when queue is full

### AI Provider Support

#### OpenAI
- Models: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
- Vision API: `gpt-4o` for screenshot analysis
- Best for: High-quality solutions and explanations

#### Google Gemini
- Models: `gemini-2.0-flash`, `gemini-1.5-pro`
- Best for: Fast responses and cost-effective processing

#### Anthropic Claude
- Models: `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20250219`
- Best for: Detailed analysis and reasoning

### Language Detection
Automatically detects and supports:
- Python
- JavaScript/TypeScript
- Java
- C/C++
- Go
- Rust
- And more...

### Transcription Features
- **Real-Time Processing**: Transcripts appear as conversation happens
- **Speaker Labels**: Automatically labels "Interviewer" and "You"
- **Interim Results**: Shows partial transcripts while speaking
- **Final Transcripts**: Confirmed transcripts with timestamps
- **Clear Function**: Clear transcript history anytime

### AI Interview Coaching
- **Context-Aware**: Uses conversation history for relevant suggestions
- **Screen Context**: Optional screenshot analysis for visual context
- **Natural Responses**: Generates conversational, confident responses
- **Copy to Clipboard**: Easy copying of suggested responses
- **Keyboard Shortcut**: Quick access via `Ctrl+1`

---

## 🎨 User Interface

### Main Views
1. **Queue View**: Manage screenshots before processing
2. **Solutions View**: View AI-generated solutions and explanations
3. **Debug View**: Debugging assistance with extra screenshot queue

### Components
- **Screenshot Queue**: Visual grid of captured screenshots
- **Live Transcript Panel**: Real-time conversation transcription
- **AI Suggestion Button**: Get interview coaching suggestions
- **Settings Dialog**: Configure API keys and preferences
- **Command Buttons**: Quick access to common actions

---

## 🔒 Privacy & Security

- **Local Storage**: All API keys stored locally on your machine
- **No Data Collection**: No user data sent to external servers (except API providers)
- **Secure Configuration**: API keys encrypted in local config files
- **Privacy-Focused**: App designed to be invisible to screen sharing tools

---

## 📝 Notes & Tips

### Getting Started Tips
- The app window is **invisible by default** - press `Ctrl+B` to toggle visibility
- All processing happens locally on your machine
- API keys are stored securely and only used for API calls
- Supports multiple programming languages automatically

### Best Practices
- **For Interviews**: Enable click-through mode (`Ctrl+T`) for complete transparency
- **For Learning**: Use Solutions view to study different approaches
- **For Debugging**: Use Debug view for detailed error analysis
- **For Transcription**: Ensure good microphone quality for best results

### Troubleshooting
- **No API Key**: Configure in Settings dialog (gear icon)
- **Transcription Not Working**: Check Deepgram API key in Settings
- **Screenshots Not Capturing**: Ensure app has screen recording permissions
- **Window Not Visible**: Press `Ctrl+B` to toggle visibility

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

---

## 🆕 Recent Updates

### Latest Features Added
- ✅ **Live Transcription**: Real-time conversation transcription with Deepgram
- ✅ **Speaker Diarization**: Automatic separation of interviewer and candidate speech
- ✅ **AI Interview Coaching**: "What Should I Say Next?" feature with context
- ✅ **Screenshot Context Integration**: Include screen context in AI suggestions
- ✅ **Multi-Provider AI Support**: OpenAI, Gemini, and Anthropic integration
- ✅ **Auto Language Detection**: Automatic programming language detection
- ✅ **Enhanced Window Controls**: Opacity, zoom, and positioning shortcuts
- ✅ **Auto-Updates**: Automatic update checking and installation

---

## 📞 Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/RohanHandore/no-paywall-screen).
