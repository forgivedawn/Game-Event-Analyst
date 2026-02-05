import React, { useState } from 'react';
import { Calendar, Search, Upload, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

const GameEventTimeline = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [gameName, setGameName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [growthPeriods, setGrowthPeriods] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [periodSummaries, setPeriodSummaries] = useState([]);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0, status: '' });

  // 解析 CSV 並分析增長區間
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map(row => ({
          date: new Date(row.DateTime),
          followers: parseFloat(row.Followers) || 0,
          change: parseFloat(row['Follower Change']) || 0
        })).filter(row => !isNaN(row.date.getTime()));

        data.sort((a, b) => a.date - b.date);
        setCsvData(data);
        analyzeGrowthPeriods(data);
      },
      error: (error) => {
        alert('CSV 解析錯誤：' + error.message);
      }
    });
  };

  // 分析增長區間
  const analyzeGrowthPeriods = (data) => {
    if (data.length < 7) return;

    const windowSize = 7;
    const smoothed = [];

    // 計算移動平均
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      const avg = window.reduce((sum, d) => sum + d.followers, 0) / window.length;
      smoothed.push({
        ...data[i],
        smoothed: avg
      });
    }

    // 準備圖表數據
    const chart = smoothed.map(d => ({
      date: d.date.toLocaleDateString('zh-TW'),
      followers: d.followers,
      smoothed: Math.round(d.smoothed)
    }));
    setChartData(chart);

    // 找出增長區間
    const periods = [];
    const threshold = 0.10; // 降低到 10% 以捕捉更多增長期

    for (let i = windowSize; i < smoothed.length - windowSize; i++) {
      const beforeWindow = smoothed.slice(i - windowSize, i);
      const afterWindow = smoothed.slice(i, i + windowSize);
      
      const beforeAvg = beforeWindow.reduce((sum, d) => sum + d.smoothed, 0) / windowSize;
      const afterAvg = afterWindow.reduce((sum, d) => sum + d.smoothed, 0) / windowSize;
      
      const growthRate = (afterAvg - beforeAvg) / beforeAvg;
      const absoluteGrowth = afterAvg - beforeAvg;

      // 檢查是否為連續增長
      const isConsecutive = afterWindow.slice(0, 5).every((d, idx) => 
        idx === 0 || d.smoothed >= afterWindow[idx - 1].smoothed * 0.95 // 允許小幅波動
      );

      if (growthRate > threshold && isConsecutive && absoluteGrowth > 100) { // 至少增長100人
        periods.push({
          startDate: smoothed[i].date,
          endDate: smoothed[Math.min(i + windowSize, smoothed.length - 1)].date,
          growthRate: (growthRate * 100).toFixed(1),
          startFollowers: Math.round(beforeAvg),
          endFollowers: Math.round(afterAvg),
          absoluteGrowth: Math.round(absoluteGrowth),
          peakIndex: i
        });
      }
    }

    // 合併相近的增長期（30天內）
    const mergedPeriods = [];
    const sortedPeriods = periods.sort((a, b) => a.startDate - b.startDate);
    
    for (const period of sortedPeriods) {
      const lastMerged = mergedPeriods[mergedPeriods.length - 1];
      const daysDiff = lastMerged 
        ? (period.startDate - lastMerged.endDate) / (1000 * 60 * 60 * 24)
        : Infinity;
      
      // 如果距離上一個增長期少於30天，合併它們
      if (lastMerged && daysDiff < 30) {
        lastMerged.endDate = period.endDate;
        lastMerged.endFollowers = period.endFollowers;
        lastMerged.absoluteGrowth = lastMerged.endFollowers - lastMerged.startFollowers;
        lastMerged.growthRate = ((lastMerged.absoluteGrowth / lastMerged.startFollowers) * 100).toFixed(1);
      } else {
        mergedPeriods.push({...period});
      }
    }

    // 按絕對增長量和增長率排序，取前5個最重要的
    mergedPeriods.sort((a, b) => {
      const scoreA = a.absoluteGrowth * parseFloat(a.growthRate);
      const scoreB = b.absoluteGrowth * parseFloat(b.growthRate);
      return scoreB - scoreA;
    });
    
    setGrowthPeriods(mergedPeriods.slice(0, 5));
  };

  // 搜尋增長期的事件並生成總結
  const searchGrowthPeriodEvents = async (game, period, periodIndex) => {
    try {
      const startStr = period.startDate.toLocaleDateString('zh-TW');
      const endStr = period.endDate.toLocaleDateString('zh-TW');
      
      // 格式化日期為 YYYY-MM-DD 以便搜尋
      const startISO = period.startDate.toISOString().split('T')[0];
      const endISO = period.endDate.toISOString().split('T')[0];
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `請搜尋「${game}」在 ${startISO} 到 ${endISO}（${startStr} 到 ${endStr}）期間發生的重要事件。這段期間追蹤者從 ${period.startFollowers.toLocaleString()} 增長到 ${period.endFollowers.toLocaleString()}（+${period.growthRate}%，增加 ${period.absoluteGrowth.toLocaleString()} 人）。

重要提示：
1. 請搜尋這個完整時間範圍內的事件，包括 2025 年和 2026 年的最新事件
2. 專注找出可能導致追蹤者大幅增長的關鍵事件
3. 只列出最重要的 2-3 個事件，避免瑣碎細節

請用以下 JSON 格式回應（只回傳 JSON）：
{
  "summary": "一句話總結這段增長的主要原因（20-40字）",
  "events": [
    {
      "date": "YYYY-MM-DD",
      "title": "事件標題",
      "description": "簡短描述（30-50字）",
      "category": "更新/賽事/爭議/公告/其他"
    }
  ]
}`
          }],
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search'
          }]
        })
      });

      const data = await response.json();
      
      let responseText = '';
      if (data.content) {
        for (const block of data.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          periodIndex,
          summary: parsed.summary || '該期間有顯著增長',
          events: parsed.events || [],
          period
        };
      }
      
      return {
        periodIndex,
        summary: `${startStr} 至 ${endStr} 期間增長 ${period.growthRate}%`,
        events: [],
        period
      };
    } catch (error) {
      console.error('搜尋錯誤：', error);
      return {
        periodIndex,
        summary: '搜尋發生錯誤',
        events: [],
        period
      };
    }
  };
  const searchEvents = async (game, start, end) => {
    setLoading(true);

    try {
      const startStr = new Date(start).toLocaleDateString('zh-TW');
      const endStr = new Date(end).toLocaleDateString('zh-TW');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `請搜尋「${game}」在 ${startStr} 到 ${endStr} 期間發生的重要事件。

請使用 web_search 工具搜尋相關資訊，然後提供：
1. 該時期的總結（100字內）
2. 事件列表

請用以下 JSON 格式回應（只回傳 JSON，不要其他文字）：
{
  "summary": "這段時間的總體情況總結",
  "events": [
    {
      "date": "YYYY-MM-DD",
      "title": "事件標題",
      "description": "簡短描述（50字內）",
      "category": "更新/賽事/爭議/公告/其他",
      "source": "來源網址（如有）"
    }
  ]
}`
          }],
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search'
          }]
        })
      });

      const data = await response.json();
      
      let responseText = '';
      if (data.content) {
        for (const block of data.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const periodInfo = {
          startDate: startStr,
          endDate: endStr,
          summary: parsed.summary || '已完成搜尋',
          events: parsed.events || []
        };
        
        setEvents(prev => [...prev, periodInfo]);
      } else {
        setEvents(prev => [...prev, {
          startDate: startStr,
          endDate: endStr,
          summary: `已搜尋 ${game} 在 ${startStr} 至 ${endStr} 期間的資訊`,
          events: [{
            date: startStr,
            title: '搜尋完成',
            description: responseText.substring(0, 100) || '未找到明確事件資訊',
            category: '其他'
          }]
        }]);
      }
    } catch (error) {
      console.error('搜尋錯誤：', error);
      setEvents(prev => [...prev, {
        startDate: new Date(start).toLocaleDateString('zh-TW'),
        endDate: new Date(end).toLocaleDateString('zh-TW'),
        summary: '搜尋過程發生錯誤',
        events: [{
          date: new Date(start).toISOString().split('T')[0],
          title: '搜尋遇到問題',
          description: '請稍後再試或調整搜尋條件',
          category: '其他'
        }]
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 手動搜尋
  const handleManualSearch = () => {
    if (!gameName || !startDate || !endDate) {
      alert('請填寫所有欄位');
      return;
    }
    setEvents([]);
    searchEvents(gameName, startDate, endDate);
  };

  // 自動搜尋所有增長區間
  const handleAutoSearch = async () => {
    if (!gameName || growthPeriods.length === 0) {
      alert('請輸入遊戲名稱並上傳 CSV');
      return;
    }

    setLoading(true);
    setPeriodSummaries([]);
    setEvents([]);
    setSearchProgress({ current: 0, total: growthPeriods.length, status: '開始分析...' });

    try {
      const summaries = [];
      
      for (let i = 0; i < growthPeriods.length; i++) {
        setSearchProgress({ 
          current: i + 1, 
          total: growthPeriods.length, 
          status: `正在搜尋第 ${i + 1} 個增長期...` 
        });
        
        const result = await searchGrowthPeriodEvents(gameName, growthPeriods[i], i);
        summaries.push(result);
        
        // 同時更新 events
        setEvents(prev => [...prev, {
          startDate: result.period.startDate.toLocaleDateString('zh-TW'),
          endDate: result.period.endDate.toLocaleDateString('zh-TW'),
          summary: result.summary,
          events: result.events
        }]);
        
        if (i < growthPeriods.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setPeriodSummaries(summaries);
      setSearchProgress({ current: growthPeriods.length, total: growthPeriods.length, status: '分析完成！' });
      
      // 3秒後隱藏進度條
      setTimeout(() => {
        setSearchProgress({ current: 0, total: 0, status: '' });
      }, 3000);
    } catch (error) {
      console.error('自動搜尋錯誤：', error);
      setSearchProgress({ current: 0, total: 0, status: '搜尋失敗' });
      alert('搜尋過程發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    '更新': 'bg-blue-100 text-blue-800',
    '賽事': 'bg-purple-100 text-purple-800',
    '爭議': 'bg-red-100 text-red-800',
    '公告': 'bg-green-100 text-green-800',
    '其他': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">🎮 遊戲事件時間軸分析</h1>
          <p className="text-slate-600">分析遊戲數據增長期並追蹤相關事件</p>
        </header>

        {/* 切換標籤 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Search className="inline-block w-5 h-5 mr-2" />
            手動搜尋
          </button>
          <button
            onClick={() => setActiveTab('auto')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'auto'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="inline-block w-5 h-5 mr-2" />
            CSV 數據分析
          </button>
        </div>

        {/* 手動搜尋 */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">指定時間區間搜尋</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="遊戲名稱"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleManualSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
              >
                {loading ? '搜尋中...' : '搜尋事件'}
              </button>
            </div>
          </div>
        )}

        {/* CSV 分析 */}
        {activeTab === 'auto' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">上傳數據檔案</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="遊戲名稱"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-5 h-5 mr-2 text-slate-600" />
                  <span className="text-slate-600">上傳 CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleAutoSearch}
                  disabled={loading || !csvData}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition-colors"
                >
                  {loading ? '分析中...' : '分析並搜尋'}
                </button>
              </div>
              {csvData && (
                <p className="mt-3 text-sm text-slate-600">
                  ✓ 已載入 {csvData.length} 筆數據
                </p>
              )}
            </div>

            {/* 進度條 */}
            {searchProgress.total > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">{searchProgress.status}</span>
                  <span className="text-sm text-slate-500">
                    {searchProgress.current} / {searchProgress.total}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(searchProgress.current / searchProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-slate-500 text-center">
                  {searchProgress.current === searchProgress.total 
                    ? '✓ 所有增長期已分析完成' 
                    : '正在搜尋 Google 並分析事件...'}
                </p>
              </div>
            )}

            {/* 圖表 */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">追蹤者數量趨勢</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          // 檢查是否在增長期內
                          const matchingSummary = periodSummaries.find(ps => {
                            const currentDate = new Date(label.split('/').reverse().join('-'));
                            return currentDate >= ps.period.startDate && currentDate <= ps.period.endDate;
                          });
                          
                          return (
                            <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-3">
                              <p className="font-semibold text-slate-800 mb-1">{label}</p>
                              <p className="text-sm text-slate-600">
                                追蹤者: {payload[0].value.toLocaleString()}
                              </p>
                              {payload[1] && (
                                <p className="text-sm text-blue-600">
                                  趨勢: {payload[1].value.toLocaleString()}
                                </p>
                              )}
                              {matchingSummary && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <p className="text-xs font-semibold text-green-600 mb-1">
                                    📈 增長期 (+{matchingSummary.period.growthRate}%)
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {matchingSummary.summary}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    
                    {/* 標示增長區間 */}
                    {periodSummaries.map((ps, idx) => {
                      const startDateStr = ps.period.startDate.toLocaleDateString('zh-TW');
                      const endDateStr = ps.period.endDate.toLocaleDateString('zh-TW');
                      return (
                        <React.Fragment key={idx}>
                          <ReferenceLine 
                            x={startDateStr} 
                            stroke="#10b981" 
                            strokeWidth={2}
                            strokeDasharray="3 3"
                          />
                          <ReferenceLine 
                            x={endDateStr} 
                            stroke="#10b981" 
                            strokeWidth={2}
                            strokeDasharray="3 3"
                          />
                        </React.Fragment>
                      );
                    })}
                    
                    <Line 
                      type="monotone" 
                      dataKey="followers" 
                      stroke="#94a3b8" 
                      strokeWidth={1} 
                      name="實際數據" 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="smoothed" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      name="平滑趨勢" 
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* 圖例說明 */}
                {periodSummaries.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="inline-block w-8 h-0.5 bg-green-500" style={{borderTop: '2px dashed #10b981'}}></span>
                      綠色虛線標示增長期的起始和結束時間
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 增長區間 */}
            {growthPeriods.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">檢測到的增長期</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {growthPeriods.map((period, idx) => {
                    const matchingSummary = periodSummaries.find(ps => ps.periodIndex === idx);
                    return (
                      <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-2xl font-bold text-green-600">+{period.growthRate}%</span>
                          <span className="text-xs text-slate-500">第 {idx + 1} 名</span>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {period.startDate.toLocaleDateString('zh-TW')} - {period.endDate.toLocaleDateString('zh-TW')}
                          </p>
                          <p>追蹤者：{period.startFollowers.toLocaleString()} → {period.endFollowers.toLocaleString()}</p>
                          <p className="text-xs text-green-600 font-semibold">淨增長：+{period.absoluteGrowth.toLocaleString()} 人</p>
                          
                          {matchingSummary && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <p className="text-xs font-semibold text-slate-700 mb-1">💡 增長原因：</p>
                              <p className="text-xs text-slate-600 leading-relaxed">{matchingSummary.summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 事件時間軸 */}
        {events.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">搜尋結果</h3>
            <div className="space-y-8">
              {events.map((period, periodIdx) => (
                <div key={periodIdx} className="border-b border-slate-200 last:border-b-0 pb-8 last:pb-0">
                  {/* 時間區間標題 */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-slate-700">
                        {period.startDate} - {period.endDate}
                      </span>
                    </div>
                    <div className="bg-white rounded-md p-3 mt-2">
                      <p className="text-sm font-medium text-slate-600 mb-1">📊 時期總結：</p>
                      <p className="text-slate-700 leading-relaxed">{period.summary}</p>
                    </div>
                  </div>

                  {/* 事件列表 */}
                  <div className="space-y-3 ml-4">
                    {period.events && period.events.map((event, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-slate-50 transition-colors rounded-r">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-500">{event.date}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[event.category] || categoryColors['其他']}`}>
                                {event.category}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-1">{event.title}</h4>
                            <p className="text-sm text-slate-600">{event.description}</p>
                            {event.source && (
                              <a 
                                href={event.source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                              >
                                查看來源 <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEventTimeline;