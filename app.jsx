// Retrieval Insights Engine - Main React Application Component
const { useState, useEffect, useMemo, useRef } = React;

// Safe dependency resolution: window globals populated by sampleData.js and llmService.js
const getDatasets = () => (typeof window !== 'undefined' && window.SAMPLE_DATASETS) ? window.SAMPLE_DATASETS : [];
const getCallGemini = () => (typeof window !== 'undefined' && window.callGeminiApi) ? window.callGeminiApi : null;
const getAnalyzeLocal = () => (typeof window !== 'undefined' && window.analyzeFeedbackLocally) ? window.analyzeFeedbackLocally : null;
const getModel = () => (typeof window !== 'undefined' && window.DEFAULT_MODEL) ? window.DEFAULT_MODEL : 'gemini-2.5-flash';

export function App() {
  const currentDatasets = getDatasets();
  // State
  const [feedbackText, setFeedbackText] = useState(() => currentDatasets[0]?.text || '');
  const [activeDatasetId, setActiveDatasetId] = useState(() => currentDatasets[0]?.id || '');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('rie_gemini_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('rie_gemini_model') || getModel());

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [expandedThemeIds, setExpandedThemeIds] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL'); // ALL, high, medium, low
  const [sortBy, setSortBy] = useState('rank'); // rank, frequency, severity, name
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('rie_dark_mode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Toggle dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rie_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rie_dark_mode', 'false');
    }
  }, [darkMode]);

  // Persist API settings
  const handleSaveSettings = (newKey, newModel) => {
    setApiKey(newKey);
    setSelectedModel(newModel);
    localStorage.setItem('rie_gemini_api_key', newKey.trim());
    localStorage.setItem('rie_gemini_model', newModel);
    setIsSettingsOpen(false);
    showToast('Settings saved successfully!');
  };

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  // Live feedback text stats
  const textStats = useMemo(() => {
    const raw = feedbackText.trim();
    if (!raw) return { entries: 0, words: 0, characters: 0 };
    const entries = raw.split(/\n\s*\n+/).filter(e => e.trim().length > 0).length;
    const words = raw.split(/\s+/).filter(Boolean).length;
    return { entries, words, characters: raw.length };
  }, [feedbackText]);

  // Initial analysis on mount with first sample dataset
  useEffect(() => {
    const datasets = getDatasets();
    if (!feedbackText && datasets.length > 0) {
      setFeedbackText(datasets[0].text);
      setActiveDatasetId(datasets[0].id);
    }
    handleRunAnalysis(true);
  }, []);

  // Run analysis handler
  const handleRunAnalysis = async (isInitial = false) => {
    const datasets = getDatasets();
    const textToAnalyze = (feedbackText || (datasets[0]?.text) || '').trim();
    if (!textToAnalyze) {
      setError('Please paste user feedback or select a sample dataset to analyze.');
      return;
    }

    if (!feedbackText && datasets[0]?.text) {
      setFeedbackText(datasets[0].text);
      setActiveDatasetId(datasets[0].id);
    }

    setError(null);
    setIsAnalyzing(true);
    setAnalysisProgress('Parsing qualitative feedback entries...');

    try {
      let analysisResult;

      if (apiKey && apiKey.trim()) {
        setAnalysisProgress(`Calling Gemini API (${selectedModel}) with structured JSON schema...`);
        const callFn = getCallGemini();
        if (!callFn) {
          throw new Error('Gemini API client not loaded yet');
        }
        analysisResult = await callFn({
          apiKey: apiKey.trim(),
          text: textToAnalyze,
          model: selectedModel
        });
      } else {
        // Run intelligent dynamic heuristic extraction
        setAnalysisProgress('Running deep thematic discovery on raw feedback...');
        await new Promise(r => setTimeout(r, 600)); // slight natural feel
        const analyzeFn = getAnalyzeLocal();
        if (!analyzeFn) {
          throw new Error('Local analyzer not loaded yet');
        }
        analysisResult = analyzeFn(textToAnalyze);
      }

      setResults(analysisResult);
      // Auto expand first two themes
      const initialExpanded = {};
      if (analysisResult.themes && analysisResult.themes.length > 0) {
        initialExpanded[analysisResult.themes[0].id || '0'] = true;
        if (analysisResult.themes[1]) {
          initialExpanded[analysisResult.themes[1].id || '1'] = true;
        }
      }
      setExpandedThemeIds(initialExpanded);

      if (!isInitial) {
        showToast('Analysis completed successfully!');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const analyzeFn = getAnalyzeLocal();
      if (err.message === 'MISSING_API_KEY' && analyzeFn) {
        setError('Gemini API key is required for live cloud calls. Falling back to local thematic analyzer.');
        const fallback = analyzeFn(textToAnalyze);
        setResults(fallback);
      } else {
        setError(`Analysis notice: ${err.message}. You can check your API key in Settings or try again.`);
        if (analyzeFn) {
          const fallback = analyzeFn(textToAnalyze);
          setResults(fallback);
        }
      }
    } finally {
      setIsAnalyzing(false);

      setAnalysisProgress('');
    }
  };

  // Sample dataset switch handler
  const handleSelectDataset = (dataset) => {
    setActiveDatasetId(dataset.id);
    setFeedbackText(dataset.text);
    showToast(`Loaded "${dataset.name}"`);
  };

  // Toggle single theme row expansion
  const toggleTheme = (id) => {
    setExpandedThemeIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Expand all / Collapse all
  const toggleAllThemes = () => {
    if (!results || !results.themes) return;
    const allExpanded = results.themes.every(t => expandedThemeIds[t.id || t.name]);
    const newState = {};
    if (!allExpanded) {
      results.themes.forEach(t => { newState[t.id || t.name] = true; });
    }
    setExpandedThemeIds(newState);
  };

  // Copy results as JSON
  const handleCopyJson = () => {
    if (!results) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    showToast('Copied full analysis as JSON to clipboard!');
  };

  // Copy results as Markdown text
  const handleCopyText = () => {
    if (!results) return;
    let md = `# Retrieval Insights Engine - Executive Briefing\n\n`;
    md += `## Executive Summary\n${results.summary}\n\n`;

    md += `## Top 3 Opportunity Areas\n`;
    (results.topOpportunities || []).forEach((opp, i) => {
      md += `### ${i + 1}. ${opp.title} [Impact: ${opp.impact}]\n`;
      md += `- **Summary:** ${opp.summary}\n`;
      md += `- **Evidence:** ${opp.evidence}\n`;
      md += `- **Recommended Action:** ${opp.recommendedAction}\n\n`;
    });

    md += `## Retrieval Failure Themes Ranked\n\n`;
    (results.themes || []).forEach((t, i) => {
      md += `### ${i + 1}. ${t.name}\n`;
      md += `- **Frequency:** ${t.frequency} feedback entries | **Severity:** ${t.severity.toUpperCase()}\n`;
      md += `- **Root Cause Hypothesis:** ${t.rootCauseHypothesis}\n`;
      md += `- **What User Remembered:** ${(t.whatUserRemembered || []).join(', ')}\n`;
      md += `- **What User Was Missing:** ${(t.whatUserWasMissing || []).join(', ')}\n`;
      md += `- **Workarounds Used:** ${(t.workarounds || []).join('; ')}\n`;
      md += `- **Key Verbatim Quotes:**\n`;
      (t.quotes || []).forEach(q => {
        md += `  > "${q}"\n`;
      });
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    showToast('Copied PM Briefing as Markdown to clipboard!');
  };

  // Export as CSV
  const handleExportCsv = () => {
    if (!results || !results.themes) return;
    const headers = ['Rank', 'Theme Name', 'Frequency', 'Severity', 'Root Cause Hypothesis', 'What User Remembered', 'What User Was Missing', 'Workarounds', 'Quotes'];
    const rows = results.themes.map((t, index) => [
      index + 1,
      `"${(t.name || '').replace(/"/g, '""')}"`,
      t.frequency,
      t.severity,
      `"${(t.rootCauseHypothesis || '').replace(/"/g, '""')}"`,
      `"${(t.whatUserRemembered || []).join('; ').replace(/"/g, '""')}"`,
      `"${(t.whatUserWasMissing || []).join('; ').replace(/"/g, '""')}"`,
      `"${(t.workarounds || []).join('; ').replace(/"/g, '""')}"`,
      `"${(t.quotes || []).join(' | ').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `photos_retrieval_insights_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded CSV report!');
  };

  // Sort & Filter Themes
  const processedThemes = useMemo(() => {
    if (!results || !results.themes) return [];
    let list = [...results.themes];

    // Filter by severity
    if (severityFilter !== 'ALL') {
      list = list.filter(t => t.severity?.toLowerCase() === severityFilter.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.name?.toLowerCase().includes(q) ||
        t.rootCauseHypothesis?.toLowerCase().includes(q) ||
        t.quotes?.some(quote => quote.toLowerCase().includes(q)) ||
        t.whatUserRemembered?.some(item => item.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'frequency') {
        comp = (b.frequency || 0) - (a.frequency || 0);
      } else if (sortBy === 'severity') {
        const order = { high: 3, medium: 2, low: 1 };
        comp = (order[b.severity?.toLowerCase()] || 0) - (order[a.severity?.toLowerCase()] || 0);
      } else if (sortBy === 'name') {
        comp = (a.name || '').localeCompare(b.name || '');
      } else {
        // Default original rank order
        comp = 0;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [results, severityFilter, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSeverityBadge = (sev) => {
    const s = sev?.toLowerCase();
    if (s === 'high') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          High Blocker
        </span>
      );
    }
    if (s === 'medium') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Medium Friction
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Low
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl shadow-2xl border border-slate-700/40 dark:border-slate-200/50 animate-bounce">
          <svg className="w-5 h-5 text-emerald-400 dark:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Google Photos inspired pinwheel color glyph */}
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
                  Retrieval Insights Engine
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Google Photos PM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Qualitative Failure Taxonomy & Discovery for Photo Search
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* API Key Status Pill */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                apiKey
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="hidden sm:inline">
                {apiKey ? `Gemini API (${selectedModel.replace('gemini-', '')})` : 'Demo Heuristic (Add API Key)'}
              </span>
              <span className="sm:hidden">{apiKey ? 'Gemini Active' : 'Configure Key'}</span>
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {darkMode ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* API Key Banner Prompt if not configured */}
        {!apiKey && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <strong className="font-semibold text-slate-900 dark:text-white">Tip for Google Photos PMs:</strong> You can paste your free Google Gemini API key to run live cloud neural synthesis on any custom text. Currently running on dynamic thematic discovery mode.
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap transition"
            >
              Configure API Key
            </button>
          </div>
        )}

        {/* Feedback Input Section */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Raw Qualitative User Feedback</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Multiple entries separated by blank lines
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paste Play Store reviews, Reddit threads (r/googlephotos), forum issues, or customer interviews.
              </p>
            </div>

            {/* Sample Datasets Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Preload sample:</span>
              {getDatasets().map(dataset => (
                <button
                  key={dataset.id}
                  onClick={() => handleSelectDataset(dataset)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    activeDatasetId === dataset.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={dataset.description}
                >
                  {dataset.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Large Text Area */}
          <div className="relative">
            <textarea
              value={feedbackText}
              onChange={(e) => {
                setFeedbackText(e.target.value);
                setActiveDatasetId(null);
              }}
              rows={8}
              placeholder="Paste qualitative feedback here... e.g.&#10;&#10;Play Store Review - 1 star&#10;I searched 'Sarah and Dave' and it showed photos of Sarah and photos of Dave separately instead of both of them together!&#10;&#10;Reddit post - r/googlephotos&#10;I can't find photos of the vintage yellow car outside the diner..."
              className="w-full rounded-xl p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 text-sm font-mono leading-relaxed text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition resize-y"
            />

            {/* Floating text telemetry */}
            <div className="absolute bottom-3 right-3 flex items-center gap-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono shadow-sm pointer-events-none">
              <span><strong>{textStats.entries}</strong> entries detected</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span><strong>{textStats.words}</strong> words</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>{textStats.characters.toLocaleString()} chars</span>
            </div>
          </div>

          {/* Control Actions & CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFeedbackText('');
                  setActiveDatasetId(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              >
                Clear input
              </button>
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setFeedbackText(text);
                      setActiveDatasetId(null);
                      showToast('Pasted from clipboard!');
                    }
                  } catch {
                    showToast('Clipboard access denied');
                  }
                }}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
              >
                Paste from clipboard
              </button>
            </div>

            <button
              id="analyze-button"
              onClick={() => handleRunAnalysis(false)}
              disabled={isAnalyzing || !feedbackText.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{analysisProgress || 'Analyzing Retrieval Failures...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Analyze Feedback with LLM</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>{error}</div>
            </div>
          )}
        </section>

        {/* Dashboard Results Section */}
        {results && (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  {results.metrics?.totalEntriesParsed || textStats.entries}
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Feedback Entries</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Synthesized</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
                  {results.themes?.length || 0}
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Distinct Failure</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Themes Identified</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
                  {results.themes?.filter(t => t.severity === 'high').length || 0}
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">High Blocker</div>
                  <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">Critical Failures</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="truncate">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Primary Memory Gap</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {results.metrics?.dominantMemoryGap || 'Episodic vs EXIF'}
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 Opportunity Areas Highlights */}
            {results.topOpportunities && results.topOpportunities.length > 0 && (
              <section className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Product Strategy Synthesis
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        Top 3 Opportunity Areas for Photos Retrieval
                      </h2>
                      <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
                        Highest-leverage failure points synthesized directly from qualitative user complaints with supporting evidence.
                      </p>
                    </div>

                    {/* Quick export shortcuts */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyText}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm border border-white/10 transition"
                        title="Copy executive briefing formatted as Markdown"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        Copy as text
                      </button>
                      <button
                        onClick={handleCopyJson}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm border border-white/10 transition"
                        title="Copy raw structured JSON"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Copy results as JSON
                      </button>
                    </div>
                  </div>

                  {/* 3 Opportunity Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {results.topOpportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between transition group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="w-7 h-7 rounded-lg bg-blue-500/30 text-blue-300 font-mono text-xs font-bold flex items-center justify-center border border-blue-400/30">
                              #{opp.rank || idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {opp.impact || 'High'} Impact
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors">
                            {opp.title}
                          </h3>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {opp.summary}
                          </p>

                          <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Evidence in Feedback
                            </div>
                            <p className="text-xs text-slate-200 italic">
                              "{opp.evidence}"
                            </p>
                          </div>
                        </div>

                        {opp.recommendedAction && (
                          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-blue-200 flex items-start gap-1.5">
                            <svg className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span><strong>PM Action:</strong> {opp.recommendedAction}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Summary paragraph */}
                  {results.summary && (
                    <div className="pt-2 text-xs sm:text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
                      <strong className="text-white font-semibold block mb-1">Executive Summary:</strong>
                      {results.summary}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Ranked Opportunity Comparison Table */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Ranked Opportunity-Comparison Dashboard
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {processedThemes.length} {processedThemes.length === 1 ? 'theme' : 'themes'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Click any row to expand verbatim quotes, memory gap breakdown, and mentioned workarounds.
                  </p>
                </div>

                {/* Filters, Search & Table Tools */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search filter */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter themes or quotes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
                    />
                    <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Severity Pill Selector */}
                  <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium">
                    {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          severityFilter === sev
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  {/* Expand/Collapse All */}
                  <button
                    onClick={toggleAllThemes}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800"
                  >
                    Toggle All
                  </button>

                  {/* Export CSV */}
                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800 flex items-center gap-1"
                    title="Export comparison table as CSV file"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Table Component */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th 
                        onClick={() => toggleSort('name')}
                        className="py-3.5 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Retrieval Failure Theme</span>
                          {sortBy === 'name' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => toggleSort('frequency')}
                        className="py-3.5 px-4 w-32 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Frequency</span>
                          {sortBy === 'frequency' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => toggleSort('severity')}
                        className="py-3.5 px-4 w-36 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Severity</span>
                          {sortBy === 'severity' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="py-3.5 px-4 hidden lg:table-cell">Root-Cause Hypothesis</th>
                      <th className="py-3.5 px-4 w-16 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {processedThemes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                          No failure themes match the current filters.
                        </td>
                      </tr>
                    ) : (
                      processedThemes.map((theme, index) => {
                        const themeKey = theme.id || theme.name || String(index);
                        const isExpanded = !!expandedThemeIds[themeKey];

                        return (
                          <React.Fragment key={themeKey}>
                            {/* Main Row */}
                            <tr
                              onClick={() => toggleTheme(themeKey)}
                              className={`cursor-pointer transition-colors group ${
                                isExpanded
                                  ? 'bg-blue-50/50 dark:bg-blue-950/20'
                                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="py-4 px-4 text-center font-mono text-xs text-slate-400 font-semibold">
                                {index + 1}
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <span>{theme.name}</span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-normal lg:hidden mt-1">
                                  {theme.rootCauseHypothesis}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-blue-600 dark:bg-blue-400 h-full rounded-full"
                                      style={{
                                        width: `${Math.min(100, Math.max(20, (theme.frequency / (results.metrics?.totalEntriesParsed || 10)) * 100))}%`
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                                    {theme.frequency} mentions
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {getSeverityBadge(theme.severity)}
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300 hidden lg:table-cell max-w-xs xl:max-w-md">
                                <span className="line-clamp-2">{theme.rootCauseHypothesis}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  type="button"
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                                    isExpanded
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                      : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                                  }`}
                                >
                                  <svg
                                    className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </td>
                            </tr>

                            {/* Expandable Detail Row */}
                            {isExpanded && (
                              <tr className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                                <td colSpan={6} className="p-4 sm:p-6">
                                  <div className="space-y-5 max-w-5xl mx-auto">
                                    {/* Root Cause Hypothesis Banner */}
                                    <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-2.5">
                                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div>
                                        <strong className="font-semibold">One-line Root-Cause Hypothesis: </strong>
                                        <span>{theme.rootCauseHypothesis}</span>
                                      </div>
                                    </div>

                                    {/* Two Column Memory Breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* What User DID Remember */}
                                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-2.5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                                          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          What User DID Remember (Episodic Recall)
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {(theme.whatUserRemembered || []).map((item, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50"
                                            >
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* What User Was MISSING */}
                                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-2.5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
                                          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          What User Was MISSING (Index Mismatch)
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {(theme.whatUserWasMissing || []).map((item, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50"
                                            >
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Workarounds Used */}
                                    {theme.workarounds && theme.workarounds.length > 0 && (
                                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2">
                                        <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          Reported Workarounds & Friction Behaviors
                                        </div>
                                        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                                          {theme.workarounds.map((w, idx) => (
                                            <li key={idx} className="leading-relaxed">
                                              {w}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 2-3 Example Quotes Pulled Verbatim from Raw Text */}
                                    <div className="space-y-2.5">
                                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        Verbatim Quotes from Users
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(theme.quotes || []).map((quote, qIdx) => (
                                          <div
                                            key={qIdx}
                                            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 border-y border-r border-slate-200 dark:border-slate-800 text-xs italic text-slate-800 dark:text-slate-200 leading-relaxed shadow-2xs relative"
                                          >
                                            <span className="text-blue-500 text-lg font-serif absolute -top-1 left-1.5 opacity-40">“</span>
                                            <p className="pl-3">{quote}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Settings Modal (API Key & Model Selection) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  LLM Engine Configuration
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Stored securely in your local browser storage. You can get a free key from{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gemini Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest & Recommended)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deepest reasoning)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Without an API key:</strong> The app executes dynamic heuristic thematic discovery on whatever text you paste, extracting real quotes and memory gap patterns.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                id="save-settings-btn"
                type="button"
                onClick={() => handleSaveSettings(apiKey, selectedModel)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Attach to window for direct browser runtime compatibility
if (typeof window !== 'undefined') {
  window.App = App;
}

export default App;

