import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Search, 
  Upload, 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  FileText, 
  BarChart3, 
  Info,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Key,
  Trash2,
  Languages,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Coffee // 新增 Coffee icon
} from 'lucide-react';

/**
 * 遊戲事件時間軸分析器 V2.8.1 (Brutalist Concrete Edition)
 * * 更新日誌：
 * - 更新 Buy Me a Coffee 連結
 * - 更新 Footer 作者資訊
 */

// 翻譯字典
const translations = {
  'zh-TW': {
    title: "EVENT ANALYZER", 
    subtitle: "V2.8 // Steam追蹤 x 行銷事件分析",
    apiKeyStatus: { set: "KEY ACTIVE", unset: "NO KEY" },
    getKey: "GET KEY",
    step1: "步驟 01：目標設定", 
    step1Placeholder: "GAME NAME (e.g. APEX)",
    step2: "步驟 02：數據來源", 
    step2Loaded: (count) => `DATA LOADED: ${count} ROWS`,
    step2Placeholder: "UPLOAD CSV FILE",
    step3: "步驟 03：存取金鑰", 
    step3Placeholder: "INPUT API KEY",
    analyzeBtn: "INITIATE SCAN",
    analyzing: "PROCESSING...",
    errorTitle: "SYSTEM ERROR",
    chartTitle: "DATA VISUALIZATION",
    chartLegend: { actual: "RAW DATA", trend: "TRENDLINE", growth: "GROWTH ZONE" },
    reportTitle: "分析日誌", 
    reportBadge: (count) => `DETECTED: ${count}`,
    periodLabel: "ZONE",
    windowLabel: "DAY WINDOW",
    growthAttribution: "ATTRIBUTION INTEL",
    waitingForInput: "AWAITING INPUT COMMAND...",
    aiSearching: "SEARCHING NEURAL NET...",
    footerPowered: "SYSTEM: GEMINI 2.5 FLASH // ENGINE: GOOGLE SEARCH",
    footerDisclaimer: "DATA FOR REFERENCE ONLY. VERIFY SOURCES.",
    footerAuthor: "Made by Dawn", // Update: 作者名稱更新
    buyMeCoffee: "贊助開發", 
    help: {
        button: "使用說明",
        title: "OPERATIONAL MANUAL",
        s1: "輸入遊戲名稱", 
        s2: "下載 Pre-release 追蹤 CSV", 
        s2_desc: "建議來源：",
        s3: "輸入你的 Gemini API Key" 
    },
    errors: {
      noGameName: "ERROR: TARGET NAME REQUIRED",
      noPeriods: "ERROR: NO GROWTH ZONES DETECTED",
      noKey: "ERROR: API KEY MISSING",
      csvEmpty: "ERROR: EMPTY OR INVALID CSV",
      csvFormat: "ERROR: INVALID SCHEMA (Need Date/Followers)",
      dataInsufficient: "ERROR: INSUFFICIENT DATA POINTS (<5)",
      apiEmpty: "ERROR: NULL RESPONSE FROM CORE",
      jsonParse: "ERROR: PARSE FAILURE (TRUNCATED DATA)",
      keyInvalid: "ERROR: INVALID CREDENTIALS (401)",
      analysisError: (idx, msg) => `ZONE ${idx} FAIL: ${msg}`
    },
    progress: {
        init: "INITIALIZING SEARCH MODULE...",
        analyzing: (curr, total, start, end) => `SCANNING ZONE (${curr}/${total}): ${start} >> ${end}`,
        done: "SCAN COMPLETE"
    }
  },
  'en-US': {
    title: "EVENT ANALYZER",
    subtitle: "V2.8 // STEAM TRACKING x MARKETING EVENTS",
    apiKeyStatus: { set: "KEY ACTIVE", unset: "NO KEY" },
    getKey: "GET KEY",
    step1: "STEP 01: TARGET",
    step1Placeholder: "GAME NAME (e.g. APEX)",
    step2: "STEP 02: DATA SOURCE",
    step2Loaded: (count) => `DATA LOADED: ${count} ROWS`,
    step2Placeholder: "UPLOAD CSV FILE",
    step3: "STEP 03: ACCESS KEY",
    step3Placeholder: "INPUT API KEY",
    analyzeBtn: "INITIATE SCAN",
    analyzing: "PROCESSING...",
    errorTitle: "SYSTEM ERROR",
    chartTitle: "DATA VISUALIZATION",
    chartLegend: { actual: "RAW DATA", trend: "TRENDLINE", growth: "GROWTH ZONE" },
    reportTitle: "ANALYSIS LOG",
    reportBadge: (count) => `DETECTED: ${count}`,
    periodLabel: "ZONE",
    windowLabel: "DAY WINDOW",
    growthAttribution: "ATTRIBUTION INTEL",
    waitingForInput: "AWAITING INPUT COMMAND...",
    aiSearching: "SEARCHING NEURAL NET...",
    footerPowered: "SYSTEM: GEMINI 2.5 FLASH // ENGINE: GOOGLE SEARCH",
    footerDisclaimer: "DATA FOR REFERENCE ONLY. VERIFY SOURCES.",
    footerAuthor: "Made by Dawn", // Update: 作者名稱更新
    buyMeCoffee: "Buy Me a Coffee", 
    help: {
        button: "MANUAL",
        title: "OPERATIONAL MANUAL",
        s1: "Enter Game Name", 
        s2: "Download Pre-release Tracking CSV", 
        s2_desc: "Recommended Sources:",
        s3: "Enter your Gemini API Key" 
    },
    errors: {
      noGameName: "ERROR: TARGET NAME REQUIRED",
      noPeriods: "ERROR: NO GROWTH ZONES DETECTED",
      noKey: "ERROR: API KEY MISSING",
      csvEmpty: "ERROR: EMPTY OR INVALID CSV",
      csvFormat: "ERROR: INVALID SCHEMA (Need Date/Followers)",
      dataInsufficient: "ERROR: INSUFFICIENT DATA POINTS (<5)",
      apiEmpty: "ERROR: NULL RESPONSE FROM CORE",
      jsonParse: "ERROR: PARSE FAILURE (TRUNCATED DATA)",
      keyInvalid: "ERROR: INVALID CREDENTIALS (401)",
      analysisError: (idx, msg) => `ZONE ${idx} FAIL: ${msg}`
    },
    progress: {
        init: "INITIALIZING SEARCH MODULE...",
        analyzing: (curr, total, start, end) => `SCANNING ZONE (${curr}/${total}): ${start} >> ${end}`,
        done: "SCAN COMPLETE"
    }
  }
};

// Buy Me a Coffee 懸浮按鈕組件
const BuyMeACoffeeWidget = ({ text }) => (
  <a
    href="https://buymeacoffee.com/dawn31" // Update: 連結更新
    target="_blank"
    rel="noreferrer"
    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-[#FFDD00] border-4 border-[#121212] text-[#121212] font-black font-oswald uppercase tracking-wider brutalist-shadow-btn transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none group text-sm md:text-base hover:bg-white"
    title="Support Development"
  >
    <div className="bg-white rounded-full p-1 border-2 border-[#121212] group-hover:rotate-12 transition-transform">
        <Coffee size={20} strokeWidth={3} className="text-[#121212]" />
    </div>
    <span className="hidden md:inline">{text}</span>
    <span className="md:hidden">BMC</span>
  </a>
);

const App = () => {
  // --- 狀態管理 ---
  const [activeTab, setActiveTab] = useState('auto');
  const [language, setLanguage] = useState('zh-TW'); // 語言狀態
  const [gameName, setGameName] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [growthPeriods, setGrowthPeriods] = useState([]);
  const [periodSummaries, setPeriodSummaries] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0, status: '' });
  const [manualApiKey, setManualApiKey] = useState(''); 
  const [showHelp, setShowHelp] = useState(false); // 使用說明開關
  
  // 系統自動注入的 Key (如果環境支援)
  const systemApiKey = ""; 
  
  // 取得當前語言的文字資源
  const t = translations[language];

  // 切換語言
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh-TW' ? 'en-US' : 'zh-TW');
  };

  // --- CSV 解析邏輯 ---
  const parseCSVLine = (text) => {
    const result = [];
    let startValue = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"') {
        inQuotes = !inQuotes;
      } else if (text[i] === ',' && !inQuotes) {
        let val = text.substring(startValue, i).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        result.push(val);
        startValue = i + 1;
      }
    }
    let lastVal = text.substring(startValue).trim();
    if (lastVal.startsWith('"') && lastVal.endsWith('"')) lastVal = lastVal.slice(1, -1);
    result.push(lastVal);
    return result;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMessage('');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        if (lines.length < 2) throw new Error(t.errors.csvEmpty);

        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
        const followersIdx = headers.findIndex(h => h.includes('follower') || h.includes('count') || h.includes('subscribers'));
        
        if (dateIdx === -1 || followersIdx === -1) {
          throw new Error(t.errors.csvFormat);
        }

        const data = lines.slice(1).map(line => {
          const cols = parseCSVLine(line);
          if (cols.length <= Math.max(dateIdx, followersIdx)) return null;
          
          const dateStr = cols[dateIdx];
          const valStr = cols[followersIdx].replace(/,/g, ''); 
          
          const date = new Date(dateStr);
          const followers = parseFloat(valStr);
          
          if (isNaN(date.getTime()) || isNaN(followers)) return null;
          
          return { date, followers };
        }).filter(item => item !== null).sort((a, b) => a.date - b.date);

        if (data.length < 5) throw new Error(t.errors.dataInsufficient);
        
        setCsvData(data);
        analyzeGrowthPeriods(data);
      } catch (err) {
        console.error(err);
        setErrorMessage(`Parsed Failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    setCsvData([]);
    setChartData([]);
    setGrowthPeriods([]);
    setPeriodSummaries([]);
    setErrorMessage('');
    setSearchProgress({ current: 0, total: 0, status: '' });
  };

  // --- 進階增長區間分析 ---
  const analyzeGrowthPeriods = (data) => {
    const smoothWindow = 3;
    const chartDataProcessed = data.map((d, i) => {
      const start = Math.max(0, i - Math.floor(smoothWindow / 2));
      const end = Math.min(data.length, i + Math.ceil(smoothWindow / 2));
      const window = data.slice(start, end);
      const avg = window.reduce((sum, item) => sum + item.followers, 0) / window.length;
      return {
        ...d,
        smoothed: Math.round(avg)
      };
    });
    setChartData(chartDataProcessed);

    const growthScores = [];
    const windowSizes = [3, 5, 7, 10, 14]; 

    for (let i = 0; i < data.length - 1; i++) {
      let bestScore = -Infinity;
      let bestWindow = 3;
      let bestEndIndex = i;

      for (const windowSize of windowSizes) {
        if (i + windowSize >= data.length) continue;

        const startIndex = i;
        const endIndex = i + windowSize;
        
        const startVal = data[startIndex].followers;
        const endVal = data[endIndex].followers;
        
        const absoluteGrowth = endVal - startVal;
        const growthRate = startVal > 0 ? absoluteGrowth / startVal : 0;
        
        const score = absoluteGrowth * (1 + growthRate) * Math.sqrt(windowSize);

        if (score > bestScore && absoluteGrowth > 0) {
          bestScore = score;
          bestWindow = windowSize;
          bestEndIndex = endIndex;
        }
      }

      if (bestScore > 0) {
        growthScores.push({
          startIndex: i,
          endIndex: bestEndIndex,
          score: bestScore,
          windowSize: bestWindow
        });
      }
    }

    growthScores.sort((a, b) => b.score - a.score);
    const selectedPeriods = [];
    const usedIndices = new Set();

    for (const candidate of growthScores) {
      let hasOverlap = false;
      const buffer = 1; 
      for (let k = candidate.startIndex - buffer; k <= candidate.endIndex + buffer; k++) {
        if (usedIndices.has(k)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        selectedPeriods.push(candidate);
        for (let k = candidate.startIndex; k <= candidate.endIndex; k++) {
          usedIndices.add(k);
        }
      }
      
      if (selectedPeriods.length >= 4) break;
    }

    const finalPeriods = selectedPeriods
      .sort((a, b) => data[a.startIndex].date - data[b.startIndex].date)
      .map(p => {
        const startItem = data[p.startIndex];
        const endItem = data[p.endIndex];
        const absoluteGrowth = endItem.followers - startItem.followers;
        const growthRate = startItem.followers > 0 ? (absoluteGrowth / startItem.followers) * 100 : 0;
        
        return {
          startIndex: p.startIndex,
          endIndex: p.endIndex,
          startDate: startItem.date,
          endDate: endItem.date,
          startFollowers: startItem.followers,
          endFollowers: endItem.followers,
          absoluteGrowth,
          growthRate: growthRate.toFixed(1),
          duration: p.windowSize
        };
      });

    setGrowthPeriods(finalPeriods);
  };

  // --- Gemini API (含 Google Search & 手動 JSON 解析) ---
  const callGemini = async (prompt) => {
    const keyToUse = manualApiKey || systemApiKey;
    if (!keyToUse) throw new Error(t.errors.noKey);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${keyToUse}`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ "google_search": {} }],
      // 增加 token 上限以避免截斷
      generationConfig: {
        maxOutputTokens: 4000, 
        temperature: 0.2
      }
    };

    let retries = 0;
    const maxRetries = 3;
    let lastError = null;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errText = await response.text();
            if (response.status === 401) throw new Error(t.errors.keyInvalid);
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }
        
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        const groundings = result.candidates?.[0]?.groundingMetadata?.groundingAttributions || [];
        
        if (!text) throw new Error(t.errors.apiEmpty);

        // 手動解析與修復 JSON
        let cleanJsonString = '';
        try {
            // 1. 移除 Markdown Code Blocks
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
            cleanJsonString = (jsonMatch ? jsonMatch[1] : text).trim();
            
            // 2. 嘗試解析
            return { 
                data: JSON.parse(cleanJsonString), 
                sources: groundings.map(g => ({ uri: g.web?.uri, title: g.web?.title })) 
            };
        } catch (parseErr) {
            console.warn('JSON Parse Error, attempting repair...', parseErr);
            
            // 3. 自動修復機制：嘗試補全截斷的 JSON
            try {
                // 如果字串結尾是 } 但前面沒有 ]，可能是陣列沒閉合
                // 簡單的啟發式修復：檢查是否以 "events": [ ... 開頭但沒有 ]} 結尾
                let repairedJson = cleanJsonString;
                
                // 移除最後一個逗號(如果有的話)
                if (repairedJson.endsWith(',')) {
                    repairedJson = repairedJson.slice(0, -1);
                }

                // 嘗試補全陣列和物件
                if (repairedJson.lastIndexOf('}') > repairedJson.lastIndexOf(']')) {
                    // 看起來像是在陣列中結束了一個物件，但陣列沒關閉
                    repairedJson += ']}';
                } else if (repairedJson.lastIndexOf(']') === -1 && repairedJson.includes('[')) {
                     repairedJson += ']}';
                } else if (!repairedJson.endsWith('}')) {
                    repairedJson += '}';
                }
                
                return { 
                    data: JSON.parse(repairedJson), 
                    sources: groundings.map(g => ({ uri: g.web?.uri, title: g.web?.title })) 
                };
            } catch (repairErr) {
                console.error('JSON Repair Failed:', repairErr, 'Raw Text:', text);
                throw new Error(t.errors.jsonParse);
            }
        }

      } catch (err) {
        console.warn(`Retry ${retries + 1} failed:`, err);
        lastError = err;
        
        if (err.message.includes('401') || err.message.includes('Key')) throw err;

        retries++;
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, retries - 1))); 
      }
    }
    throw new Error(`${lastError?.message || 'Unknown Error'}`);
  };

  const startAnalysis = async () => {
    if (!gameName) {
      setErrorMessage(t.errors.noGameName);
      return;
    }
    if (growthPeriods.length === 0) {
      setErrorMessage(t.errors.noPeriods);
      return;
    }

    setLoading(true);
    setPeriodSummaries([]);
    setErrorMessage('');
    
    const total = growthPeriods.length;
    setSearchProgress({ current: 0, total, status: t.progress.init });

    for (let i = 0; i < total; i++) {
      const period = growthPeriods[i];
      const startStr = period.startDate.toISOString().split('T')[0];
      const endStr = period.endDate.toISOString().split('T')[0];
      
      setSearchProgress({ 
        current: i + 1, 
        total, 
        status: t.progress.analyzing(i + 1, total, startStr, endStr)
      });

      // 根據語言動態調整 Prompt
      const isEn = language === 'en-US';
      const prompt = isEn 
      ? `Analysis Target: Game "${gameName}".
         Time Range: ${startStr} to ${endStr}.
         Data Change: Followers increased by ${period.absoluteGrowth.toLocaleString()} (+${period.growthRate}%).
         
         Task: Use Google Search to find specific reasons for this growth (e.g., new season, DLC, esports tournament, controversy, steam sale).
         
         Strictly follow this JSON format, do not include any explanatory text or Markdown:
         {
           "summary": "One sentence summary of the main reason for growth (30-50 words, in English)",
           "events": [
             {
               "date": "YYYY-MM-DD",
               "title": "Event Title",
               "description": "Event Description",
               "category": "Update/Esports/Community/Controversy/Other",
               "source": "Source Name"
             }
           ]
         }`
      : `分析目標：遊戲「${gameName}」。
         時間範圍：${startStr} 到 ${endStr}。
         數據變化：追蹤者增加 ${period.absoluteGrowth.toLocaleString()} 人 (+${period.growthRate}%)。
         
         任務：請利用 Google Search 找出導致這波增長的具體原因（例如新賽季、DLC、賽事、爭議、特賣）。
         
         請嚴格遵守以下 JSON 格式回傳，不要包含任何解釋性文字或 Markdown：
         {
           "summary": "一句話總結這段增長的主要原因（30-50字，繁體中文）",
           "events": [
             {
               "date": "YYYY-MM-DD",
               "title": "事件標題",
               "description": "事件簡述",
               "category": "更新/賽事/社群/爭議/其他",
               "source": "來源名稱"
             }
           ]
         }`;

      try {
        const { data, sources } = await callGemini(prompt);
        setPeriodSummaries(prev => [...prev, {
          ...data,
          sources,
          periodIdx: i
        }]);
        
        if (i < total - 1) await new Promise(res => setTimeout(res, 2000));

      } catch (err) {
        setErrorMessage(t.errors.analysisError(i + 1, err.message));
        setLoading(false); 
        return; 
      }
    }

    setLoading(false);
    setSearchProgress({ current: total, total, status: t.progress.done });
  };

  // --- 互動式圖表 ---
  const ChartComponent = () => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 300 });

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) setDimensions({ width: entries[0].contentRect.width, height: 300 });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    if (!chartData.length || dimensions.width === 0) return <div ref={containerRef} className="h-[300px] w-full" />;

    const { width, height } = dimensions;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 }; // 增加 padding 以適應粗邊框
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...chartData.map(d => d.followers));
    const minVal = Math.min(...chartData.map(d => d.followers));
    const range = maxVal - minVal || 1;

    const getX = (index) => padding.left + (index / (chartData.length - 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

    const points = chartData.map((d, i) => `${getX(i)},${getY(d.followers)}`).join(' ');
    const smoothPoints = chartData.map((d, i) => `${getX(i)},${getY(d.smoothed)}`).join(' ');

    return (
      <div ref={containerRef} className="relative w-full bg-[#d1d1cf] border-4 border-[#121212] p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.15)] select-none font-['Oswald']">
         <div className="flex justify-between mb-4 border-b-4 border-[#121212] pb-2">
           <h3 className="text-xl font-bold text-[#121212] uppercase flex items-center gap-2 tracking-wider">
             <BarChart3 size={24} className="text-[#121212]" /> {t.chartTitle}
           </h3>
           <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
             <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#121212]"/> {t.chartLegend.actual}</span>
             <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#555]"/> {t.chartLegend.trend}</span>
             <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ff3e00] opacity-50"/> {t.chartLegend.growth}</span>
           </div>
         </div>
         
         <svg width={width} height={height} className="overflow-visible">
            {growthPeriods.map((p, i) => (
                <rect 
                    key={`bg-${i}`}
                    x={getX(p.startIndex)}
                    y={padding.top}
                    width={getX(p.endIndex) - getX(p.startIndex)}
                    height={chartH}
                    fill="#ff3e00"
                    fillOpacity="0.2"
                />
            ))}

            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = padding.top + chartH * pct;
                const val = maxVal - (range * pct);
                return (
                    <g key={pct}>
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#121212" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                        <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#121212" fontWeight="bold" fontFamily="Oswald">
                            {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </text>
                    </g>
                );
            })}

            <polyline points={points} fill="none" stroke="#121212" strokeWidth="1" strokeOpacity="0.8" />
            <polyline points={smoothPoints} fill="none" stroke="#121212" strokeWidth="3" strokeLinejoin="round" />

            {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((d, i) => {
                const index = chartData.indexOf(d);
                return (
                    <text key={i} x={getX(index)} y={height - 20} textAnchor="middle" fontSize="12" fill="#121212" fontWeight="bold" fontFamily="Oswald">
                        {d.date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </text>
                );
            })}
         </svg>
      </div>
    );
  };

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@900&family=Oswald:wght@700&family=Public+Sans:wght@300;900&display=swap');
      :root { --raw-concrete: #d1d1cf; --ink-black: #121212; --blood-orange: #ff3e00; }
      .font-oswald { font-family: 'Oswald', 'Noto Sans TC', sans-serif; }
      .font-public { font-family: 'Public Sans', sans-serif; }
      .brutalist-shadow { box-shadow: 15px 15px 0px rgba(0,0,0,0.15); }
      .brutalist-shadow-sm { box-shadow: 4px 4px 0px rgba(0,0,0,1); }
      .brutalist-shadow-btn { box-shadow: 6px 6px 0px rgba(0,0,0,1); }
      .bg-concrete { background-color: #bbb; background-image: url('https://www.transparenttextures.com/patterns/concrete-wall.png'); }
    `}</style>
    
    <div className="min-h-screen bg-concrete font-public p-4 md:p-8 flex justify-center items-start">
      <BuyMeACoffeeWidget text={t.buyMeCoffee} />
      <div className="w-full max-w-5xl bg-[var(--raw-concrete)] border-8 border-[var(--ink-black)] brutalist-shadow">
        
        {/* Header Block */}
        <header className="bg-[var(--ink-black)] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-8 border-[var(--ink-black)]">
          <div>
            <h1 className="text-4xl md:text-5xl font-oswald font-black uppercase leading-none tracking-tighter">
              {t.title.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
            </h1>
            <div className="mt-2 inline-block bg-[var(--blood-orange)] text-[var(--ink-black)] font-black px-2 py-1 text-sm transform -rotate-1">
              {t.subtitle}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
             <div className="flex gap-2">
                 {/* 語言切換 */}
                <button 
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-3 py-2 bg-white border-4 border-[var(--ink-black)] text-[var(--ink-black)] font-black uppercase text-sm hover:bg-[var(--blood-orange)] hover:text-white transition-all brutalist-shadow-sm active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                    <Languages size={16} strokeWidth={3} />
                    {language === 'zh-TW' ? 'EN' : '中'}
                </button>
                 {/* 說明書開關 */}
                 <button 
                    onClick={() => setShowHelp(!showHelp)}
                    className={`flex items-center gap-2 px-3 py-2 border-4 border-[var(--ink-black)] font-black uppercase text-sm transition-all brutalist-shadow-sm active:translate-x-1 active:translate-y-1 active:shadow-none
                    ${showHelp ? 'bg-[var(--blood-orange)] text-white' : 'bg-white text-[var(--ink-black)] hover:bg-gray-100'}`}
                >
                    <HelpCircle size={16} strokeWidth={3} />
                    {t.help.button}
                </button>
             </div>

             <div className="flex flex-col items-end w-full">
                <div className="bg-[var(--ink-black)] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-1 w-full text-right border-2 border-white">
                    API STATUS: {manualApiKey ? "ONLINE" : "OFFLINE"}
                </div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs font-bold text-white bg-[var(--blood-orange)] px-2 hover:bg-white hover:text-[var(--blood-orange)] transition-colors uppercase">
                    {t.getKey} &gt;&gt;
                </a>
             </div>
          </div>
        </header>

        {/* Operational Manual Foldout */}
        {showHelp && (
            <div className="bg-white border-x-8 border-b-8 border-[var(--ink-black)] p-6 md:p-8 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="flex items-center gap-3 border-b-4 border-[var(--ink-black)] pb-2 mb-4">
                    <HelpCircle size={28} strokeWidth={3} className="text-[var(--blood-orange)]" />
                    <h2 className="font-oswald text-2xl uppercase">{t.help.title}</h2>
                </div>
                <div className="space-y-4 font-bold text-[var(--ink-black)]">
                    <p className="flex items-start gap-3">
                        <span className="bg-[var(--ink-black)] text-white px-2 py-0.5 text-sm font-mono">01</span>
                        <span>{t.help.s1}</span>
                    </p>
                    <div className="flex items-start gap-3">
                        <span className="bg-[var(--ink-black)] text-white px-2 py-0.5 text-sm font-mono">02</span>
                        <div>
                            <p>{t.help.s2}</p>
                            <div className="mt-2 text-sm text-gray-600 font-normal">
                                {t.help.s2_desc} 
                                <a href="https://plus.gamediscover.co/" target="_blank" rel="noreferrer" className="text-[var(--blood-orange)] hover:underline ml-1 font-bold">GameDiscoverCo Plus</a> / 
                                <a href="https://steamdb.info/" target="_blank" rel="noreferrer" className="text-[var(--blood-orange)] hover:underline ml-1 font-bold">SteamDB</a>
                            </div>
                        </div>
                    </div>
                    <p className="flex items-start gap-3">
                        <span className="bg-[var(--ink-black)] text-white px-2 py-0.5 text-sm font-mono">03</span>
                        <span>{t.help.s3}</span>
                    </p>
                </div>
            </div>
        )}

        <div className="p-6 md:p-10 space-y-10">
            {errorMessage && (
            <div className="bg-[#ffdddd] border-4 border-red-600 p-4 flex items-start gap-4 brutalist-shadow-sm">
                <AlertCircle size={32} className="text-red-600 shrink-0" strokeWidth={3} />
                <div className="flex-1">
                    <p className="font-oswald text-xl text-red-600 uppercase">{t.errorTitle}</p>
                    <p className="font-bold text-red-800 mt-1 uppercase text-sm">{errorMessage}</p>
                </div>
                <button onClick={() => setErrorMessage('')} className="bg-red-600 text-white w-8 h-8 flex items-center justify-center font-bold border-2 border-black hover:bg-black">✕</button>
            </div>
            )}

            {/* Main Controls Slabs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                {/* 1. Target (Col-span adjusted to 3) */}
                <div className="md:col-span-3 space-y-2">
                    <label className="block font-oswald text-lg uppercase tracking-wide border-b-4 border-[var(--ink-black)] pb-1 mb-2 whitespace-nowrap overflow-hidden text-ellipsis" title={t.step1}>{t.step1}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--ink-black)]">
                            <Search size={24} strokeWidth={3} />
                        </div>
                        <input 
                            type="text" 
                            placeholder={t.step1Placeholder} 
                            className="w-full pl-12 pr-4 py-4 bg-white border-4 border-[var(--ink-black)] text-[var(--ink-black)] font-bold uppercase placeholder:text-gray-400 focus:outline-none focus:bg-[#f0f0f0] brutalist-shadow-sm transition-all"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                        />
                    </div>
                </div>

                {/* 2. Upload (Col-span adjusted to 5 to give more width) */}
                <div className="md:col-span-5 space-y-2">
                    <label className="block font-oswald text-lg uppercase tracking-wide border-b-4 border-[var(--ink-black)] pb-1 mb-2 whitespace-nowrap overflow-hidden text-ellipsis" title={t.step2}>{t.step2}</label>
                    
                    {csvData.length > 0 ? (
                      <div className="flex gap-2">
                          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-[var(--ink-black)] text-white border-4 border-[var(--ink-black)] brutalist-shadow-sm overflow-hidden">
                              <CheckCircle2 size={20} className="text-[var(--blood-orange)] shrink-0" />
                              <span className="font-bold uppercase text-sm tracking-wider truncate">{t.step2Loaded(csvData.length)}</span>
                          </div>
                          <button
                              onClick={handleClearData}
                              className="px-4 bg-white text-[var(--ink-black)] border-4 border-[var(--ink-black)] hover:bg-red-600 hover:text-white hover:border-red-800 transition-colors brutalist-shadow-sm shrink-0"
                              title="CLEAR DATA"
                          >
                              <Trash2 size={24} strokeWidth={3} />
                          </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-3 px-4 py-4 bg-white border-4 border-[var(--ink-black)] border-dashed cursor-pointer hover:bg-[#e0e0e0] transition-all group">
                          <Upload size={24} className="group-hover:scale-110 transition-transform" strokeWidth={3} />
                          <span className="font-bold uppercase tracking-wider truncate">{t.step2Placeholder}</span>
                          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                      </label>
                    )}
                </div>

                 {/* 3. API Key & Button (Col-span adjusted to 4) */}
                 <div className="md:col-span-4 space-y-2">
                     <label className="block font-oswald text-lg uppercase tracking-wide border-b-4 border-[var(--ink-black)] pb-1 mb-2 whitespace-nowrap overflow-hidden text-ellipsis" title={t.step3}>
                         {t.step3}
                     </label>
                     <div className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--ink-black)]">
                                <Key size={20} strokeWidth={3} />
                            </div>
                            <input 
                                type="password" 
                                placeholder="************" 
                                className="w-full pl-12 pr-4 py-4 bg-white border-4 border-[var(--ink-black)] text-[var(--ink-black)] font-mono font-bold focus:outline-none focus:bg-[#f0f0f0] brutalist-shadow-sm"
                                value={manualApiKey}
                                onChange={(e) => setManualApiKey(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={startAnalysis}
                            disabled={loading || !csvData.length || !gameName}
                            className={`px-6 py-4 border-4 border-[var(--ink-black)] font-black uppercase tracking-widest brutalist-shadow-btn transition-all active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center shrink-0
                            ${loading || !csvData.length || !gameName
                            ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                            : 'bg-[var(--blood-orange)] text-white hover:bg-[var(--ink-black)]'
                            }`}
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <TrendingUp size={24} strokeWidth={3} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar (Stylized) */}
            {loading && (
                <div className="border-4 border-[var(--ink-black)] bg-white p-4 brutalist-shadow-sm">
                    <div className="flex justify-between items-center mb-2 font-oswald uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                            <Loader2 size={20} className="animate-spin text-[var(--blood-orange)]" />
                            {searchProgress.status}
                        </span>
                        <span className="bg-[var(--ink-black)] text-white px-2 py-0.5 text-sm">
                            {searchProgress.current} / {searchProgress.total}
                        </span>
                    </div>
                    <div className="w-full bg-[#ddd] h-4 border-2 border-[var(--ink-black)]">
                        <div 
                            className="bg-[var(--blood-orange)] h-full transition-all duration-300" 
                            style={{ width: `${(searchProgress.current / Math.max(searchProgress.total, 1)) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Chart Area */}
            <ChartComponent />

            {/* Report Area */}
            {growthPeriods.length > 0 && (
                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b-8 border-[var(--ink-black)] pb-2">
                        <FileText size={32} strokeWidth={3} />
                        <h2 className="font-oswald text-4xl uppercase">{t.reportTitle}</h2>
                        <span className="ml-auto bg-[var(--ink-black)] text-white px-4 py-1 font-bold transform rotate-2 shadow-lg">
                            {t.reportBadge(growthPeriods.length)}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {growthPeriods.map((p, idx) => {
                        const summary = periodSummaries.find(s => s.periodIdx === idx);
                        
                        return (
                        <div key={idx} className="bg-white border-4 border-[var(--ink-black)] brutalist-shadow flex flex-col">
                            {/* Header Slab */}
                            <div className="bg-[var(--ink-black)] text-white p-4 flex justify-between items-center border-b-4 border-[var(--ink-black)]">
                                <div>
                                    <div className="text-[var(--blood-orange)] font-black text-xs uppercase tracking-[0.2em] mb-1">
                                        {t.periodLabel} 0{idx + 1} // {p.duration} {t.windowLabel}
                                    </div>
                                    <h4 className="font-oswald text-2xl flex items-center gap-2">
                                        {p.startDate.toLocaleDateString()}
                                        <ChevronRight size={20} className="text-[var(--blood-orange)]" strokeWidth={4} />
                                        {p.endDate.toLocaleDateString()}
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <div className="font-oswald text-3xl text-[var(--blood-orange)] leading-none">+{p.growthRate}%</div>
                                    <div className="font-bold text-xs text-gray-400">+{p.absoluteGrowth.toLocaleString()} SUBS</div>
                                </div>
                            </div>

                            {/* Content Slab */}
                            <div className="p-6 flex-1 flex flex-col gap-6 bg-[#f4f4f4]">
                            {summary ? (
                                <>
                                {/* AI Summary Box */}
                                <div className="border-l-8 border-[var(--blood-orange)] pl-4 py-1">
                                    <h5 className="font-black text-sm uppercase mb-2 flex items-center gap-2 text-[var(--ink-black)]">
                                    <Info size={16} strokeWidth={4} /> {t.growthAttribution}
                                    </h5>
                                    <p className="font-medium text-[var(--ink-black)] leading-relaxed">
                                    {summary.summary}
                                    </p>
                                </div>

                                {/* Event List */}
                                <div className="space-y-4">
                                    {summary.events.map((ev, eIdx) => (
                                    <div key={eIdx} className="border-2 border-[var(--ink-black)] p-3 bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform brutalist-shadow-sm shadow-none hover:shadow-[4px_4px_0px_black]">
                                        <div className="flex justify-between items-start mb-2 border-b-2 border-gray-200 pb-1">
                                            <span className="font-mono text-xs font-bold bg-[var(--ink-black)] text-white px-1">{ev.date}</span>
                                            <span className={`text-xs font-black uppercase px-2
                                                ${ev.category.includes('賽事') || ev.category.includes('Esports') ? 'text-purple-700' : 
                                                ev.category.includes('更新') || ev.category.includes('Update') ? 'text-green-700' :
                                                ev.category.includes('爭議') || ev.category.includes('Controversy') ? 'text-red-600' : 
                                                'text-gray-600'}`}>
                                                [{ev.category}]
                                            </span>
                                        </div>
                                        <div className="font-bold text-lg leading-tight mb-1">{ev.title}</div>
                                        <p className="text-xs text-gray-600 leading-normal">{ev.description}</p>
                                    </div>
                                    ))}
                                </div>

                                {/* Sources */}
                                {summary.sources?.length > 0 && (
                                    <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-400">
                                    <div className="flex flex-wrap gap-2">
                                        {summary.sources.slice(0, 3).map((s, sIdx) => (
                                        <a 
                                            key={sIdx} 
                                            href={s.uri} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[10px] font-bold uppercase bg-[var(--ink-black)] text-white px-2 py-1 hover:bg-[var(--blood-orange)] transition-colors flex items-center gap-1 truncate max-w-[150px]"
                                        >
                                            <ExternalLink size={10} /> {s.title || 'SOURCE'}
                                        </a>
                                        ))}
                                    </div>
                                    </div>
                                )}
                                </>
                            ) : (
                                <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center border-4 border-dashed border-gray-300 gap-4">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin text-[var(--ink-black)]" size={40} />
                                        <p className="font-oswald text-xl uppercase animate-pulse">{t.aiSearching}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-[var(--ink-black)] text-white flex items-center justify-center rounded-full">
                                            <Search size={32} />
                                        </div>
                                        <p className="font-bold uppercase text-gray-500">{t.waitingForInput}</p>
                                    </>
                                )}
                                </div>
                            )}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </div>
            )}

            <footer className="mt-12 text-center text-[var(--ink-black)] text-sm font-bold py-8 border-t-8 border-[var(--ink-black)] bg-white/50 backdrop-blur-sm">
                <p className="mb-2 uppercase tracking-widest">
                    {t.footerPowered}
                </p>
                <p className="text-xs opacity-60">{t.footerDisclaimer}</p>
                <p className="text-xs font-bold mt-2 opacity-80">{t.footerAuthor}</p>
            </footer>
        </div>
      </div>
    </div>
    </>
  );
};

export default App;