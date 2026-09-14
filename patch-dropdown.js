const fs = require('fs');
let content = fs.readFileSync('src/components/IeltsTestView.tsx', 'utf-8');

// Update imports
if (!content.includes('Share2')) {
  content = content.replace('import { Clock, Fullscreen, Clipboard, Send, Menu } from "lucide-react";', 'import { Clock, Fullscreen, Clipboard, Send, Menu, Share2, CheckCircle, AlertTriangle } from "lucide-react";');
}

// Add state
if (!content.includes('showOptions')) {
  content = content.replace('  const [isFullscreen, setIsFullscreen] = useState(false);', `  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("md");`);
}

// Update header
const origHeader = `      <div className="flex items-center gap-4">
        {testType !== "speaking" && (
          <>
            <button className="text-slate-500 hover:text-slate-800 p-2">
              <Clipboard className="w-5 h-5" />
            </button>
            <button className="text-slate-500 hover:text-slate-800 p-2" onClick={toggleFullscreen}>
              <Fullscreen className="w-5 h-5" />
            </button>
            <button
              onClick={handleFinishTest}
              className="bg-[#2d5a3f] hover:bg-[#1f402c] text-white px-5 py-2 rounded-full font-bold flex items-center gap-2 transition-colors"
            >
              Submit <Send className="w-4 h-4" />
            </button>
          </>
        )}
        {testType === "speaking" && (
          <button className="text-slate-500 hover:text-slate-800 p-2">
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>`;

const newHeader = `      <div className="flex items-center gap-4">
        {testType !== "speaking" && (
          <>
            <button className="text-slate-500 hover:text-slate-800 p-2">
              <Clipboard className="w-5 h-5" />
            </button>
            <button className="text-slate-500 hover:text-slate-800 p-2" onClick={toggleFullscreen}>
              <Fullscreen className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="text-slate-500 hover:text-slate-800 p-2 flex items-center justify-center rounded-full transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Text Size</p>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => setTextSize("sm")}
                        className={\`flex-1 py-1 rounded text-xs font-medium \${textSize === 'sm' ? 'bg-white shadow text-teal-700' : 'text-gray-600 hover:text-gray-900'}\`}
                      >
                        A
                      </button>
                      <button 
                        onClick={() => setTextSize("md")}
                        className={\`flex-1 py-1 rounded text-sm font-medium \${textSize === 'md' ? 'bg-white shadow text-teal-700' : 'text-gray-600 hover:text-gray-900'}\`}
                      >
                        A
                      </button>
                      <button 
                        onClick={() => setTextSize("lg")}
                        className={\`flex-1 py-1 rounded text-lg font-medium \${textSize === 'lg' ? 'bg-white shadow text-teal-700' : 'text-gray-600 hover:text-gray-900'}\`}
                      >
                        A
                      </button>
                    </div>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-gray-400" /> Share Test
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-gray-400" /> See Solutions
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Report Mistakes
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleFinishTest}
              className="bg-[#2d5a3f] hover:bg-[#1f402c] text-white px-5 py-2 rounded-full font-bold flex items-center gap-2 transition-colors"
            >
              Submit <Send className="w-4 h-4" />
            </button>
          </>
        )}
        {testType === "speaking" && (
          <div className="relative">
            <button onClick={() => setShowOptions(!showOptions)} className="text-slate-500 hover:text-slate-800 p-2">
              <Menu className="w-5 h-5" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-gray-400" /> Share Test
                </button>
                <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> Report Mistakes
                </button>
              </div>
            )}
          </div>
        )}
      </div>`;

content = content.replace(origHeader, newHeader);
fs.writeFileSync('src/components/IeltsTestView.tsx', content);
