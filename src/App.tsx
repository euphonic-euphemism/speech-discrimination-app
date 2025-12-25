import React, { useState, useMemo } from 'react';
import { Calculator, AlertCircle, CheckCircle2, BookOpen, Info, ArrowRightLeft, Ruler, Activity, Table2 } from 'lucide-react';

// --- DATA: Dubno et al. (1995) Confidence Limits ---
// Table 5: 95% CL for 25-item NU-6 lists
const dubnoData25 = [
    { pta: -3.3, limit: 97.6 }, { pta: 0.0, limit: 96.7 }, { pta: 1.7, limit: 96.2 }, { pta: 3.3, limit: 95.5 },
{ pta: 5.0, limit: 94.9 }, { pta: 6.7, limit: 94.1 }, { pta: 8.3, limit: 93.2 }, { pta: 10.0, limit: 92.3 },
{ pta: 11.7, limit: 91.3 }, { pta: 13.3, limit: 90.2 }, { pta: 15.0, limit: 89.0 }, { pta: 16.7, limit: 87.7 },
{ pta: 18.3, limit: 86.2 }, { pta: 20.0, limit: 84.7 }, { pta: 21.7, limit: 83.1 }, { pta: 23.3, limit: 81.4 },
{ pta: 25.0, limit: 79.6 }, { pta: 26.7, limit: 77.7 }, { pta: 28.3, limit: 75.8 }, { pta: 30.0, limit: 73.7 },
{ pta: 31.7, limit: 71.6 }, { pta: 33.3, limit: 69.5 }, { pta: 35.0, limit: 67.3 }, { pta: 36.7, limit: 65.0 },
{ pta: 38.3, limit: 62.7 }, { pta: 40.0, limit: 60.4 }, { pta: 41.7, limit: 58.1 }, { pta: 43.3, limit: 55.8 },
{ pta: 45.0, limit: 53.5 }, { pta: 46.7, limit: 51.3 }, { pta: 48.3, limit: 49.0 }, { pta: 50.0, limit: 46.8 },
{ pta: 51.7, limit: 44.7 }, { pta: 53.3, limit: 42.6 }, { pta: 55.0, limit: 40.5 }, { pta: 56.7, limit: 38.5 },
{ pta: 58.3, limit: 36.7 }, { pta: 60.0, limit: 34.8 }, { pta: 61.7, limit: 33.0 }, { pta: 63.3, limit: 31.3 },
{ pta: 65.0, limit: 29.6 }, { pta: 66.7, limit: 28.1 }, { pta: 68.3, limit: 26.6 }, { pta: 70.0, limit: 25.2 },
{ pta: 71.7, limit: 23.8 }
];

// Table 6: 95% CL for 50-item NU-6 lists
const dubnoData50 = [
    { pta: -3.3, limit: 97.5 }, { pta: 0.0, limit: 96.5 }, { pta: 1.7, limit: 96.0 }, { pta: 3.3, limit: 95.3 },
{ pta: 5.0, limit: 94.6 }, { pta: 6.7, limit: 93.8 }, { pta: 8.3, limit: 92.9 }, { pta: 10.0, limit: 91.9 },
{ pta: 11.7, limit: 90.9 }, { pta: 13.3, limit: 89.7 }, { pta: 15.0, limit: 88.5 }, { pta: 16.7, limit: 87.2 },
{ pta: 18.3, limit: 85.7 }, { pta: 20.0, limit: 84.2 }, { pta: 21.7, limit: 82.6 }, { pta: 23.3, limit: 80.9 },
{ pta: 25.0, limit: 79.2 }, { pta: 26.7, limit: 77.3 }, { pta: 28.3, limit: 75.4 }, { pta: 30.0, limit: 73.4 },
{ pta: 31.7, limit: 71.4 }, { pta: 33.3, limit: 69.3 }, { pta: 35.0, limit: 67.2 }, { pta: 36.7, limit: 65.0 },
{ pta: 38.3, limit: 62.8 }, { pta: 40.0, limit: 60.6 }, { pta: 41.7, limit: 58.4 }, { pta: 43.3, limit: 56.2 },
{ pta: 45.0, limit: 54.1 }, { pta: 46.7, limit: 51.9 }, { pta: 48.3, limit: 49.8 }, { pta: 50.0, limit: 47.7 },
{ pta: 51.7, limit: 45.7 }, { pta: 53.3, limit: 43.7 }, { pta: 55.0, limit: 41.7 }, { pta: 56.7, limit: 39.8 },
{ pta: 58.3, limit: 38.0 }, { pta: 60.0, limit: 36.2 }, { pta: 61.7, limit: 34.5 }, { pta: 63.3, limit: 32.8 },
{ pta: 65.0, limit: 31.2 }, { pta: 66.7, limit: 29.7 }, { pta: 68.3, limit: 28.3 }, { pta: 70.0, limit: 26.9 },
{ pta: 71.7, limit: 25.5 }
];

// Linear Interpolation helper
const getDubnoLimit = (pta: number, listSize: 25 | 50) => {
    const data = listSize === 50 ? dubnoData50 : dubnoData25;

    // Clamp PTA to range of data
    if (pta <= data[0].pta) return data[0].limit;
    if (pta >= data[data.length - 1].pta) return data[data.length - 1].limit;

    // Find range
    for (let i = 0; i < data.length - 1; i++) {
        if (pta >= data[i].pta && pta <= data[i + 1].pta) {
            const x1 = data[i].pta;
            const y1 = data[i].limit;
            const x2 = data[i + 1].pta;
            const y2 = data[i + 1].limit;

            // Interpolate
            const ratio = (pta - x1) / (x2 - x1);
            return y1 + ratio * (y2 - y1);
        }
    }
    return 0; // Should not reach here
};

const SpeechDiscriminationApp = () => {
    const [activeTab, setActiveTab] = useState<'thornton' | 'dubno'>('thornton');

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
        <Calculator className="w-8 h-8 text-blue-600" />
        Speech Audiometry Tools
        </h1>
        <p className="text-slate-600">
        Clinical comparison and validation tools for speech recognition scores.
        </p>
        </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-slate-100">
        <button
        onClick={() => setActiveTab('thornton')}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === 'thornton'
            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
        >
        Thornton & Raffin (Comparator)
        </button>
        <button
        onClick={() => setActiveTab('dubno')}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === 'dubno'
            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
        >
        Dubno et al. (PB-Max Limit)
        </button>
        </div>
        </header>

        {activeTab === 'thornton' ? <ThorntonTab /> : <DubnoTab />}

        </div>
        </div>
    );
};

// --- COMPONENT: Thornton & Raffin Tab ---
const ThorntonTab = () => {
    const [listSize, setListSize] = useState<string | number>(50);
    const [score1Input, setScore1Input] = useState<string | number>(92);
    const [score2Input, setScore2Input] = useState<string | number>(80);
    const [inputMode, setInputMode] = useState<'percent' | 'count'>('percent');
    const [confidenceLevel, setConfidenceLevel] = useState(95);

    // Freeman-Tukey Arc-Sine Transformation (Equation 3)
    const calculateTheta = (n: number, x: number) => {
        const term1 = Math.asin(Math.sqrt(x / (n + 1)));
        const term2 = Math.asin(Math.sqrt((x + 1) / (n + 1)));
        return term1 + term2;
    };

    // Variance of Theta (Equations 4 & 5)
    const calculateVariance = (n: number) => {
        if (n >= 50) return 1 / (n + 0.5);
        return 1 / (n + 1);
    };

    const safeListSize = Number(listSize) || 50;
    const val1 = parseFloat(score1Input.toString()) || 0;
    const val2 = parseFloat(score2Input.toString()) || 0;

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    const score1CountRaw = inputMode === 'percent' ? Math.round((val1 / 100) * safeListSize) : val1;
    const score2CountRaw = inputMode === 'percent' ? Math.round((val2 / 100) * safeListSize) : val2;

    const score1Count = clamp(score1CountRaw, 0, safeListSize);
    const score2Count = clamp(score2CountRaw, 0, safeListSize);

    const score1Percent = (score1Count / safeListSize) * 100;
    const score2Percent = (score2Count / safeListSize) * 100;

    const handleModeChange = (newMode: 'percent' | 'count') => {
        if (newMode === inputMode) return;
        if (newMode === 'count') {
            const p1 = Math.min(val1, 100);
            const p2 = Math.min(val2, 100);
            setScore1Input(Math.round((p1 / 100) * safeListSize));
            setScore2Input(Math.round((p2 / 100) * safeListSize));
        } else {
            const c1 = Math.min(val1, safeListSize);
            const c2 = Math.min(val2, safeListSize);
            setScore1Input(((c1 / safeListSize) * 100).toFixed(1));
            setScore2Input(((c2 / safeListSize) * 100).toFixed(1));
        }
        setInputMode(newMode);
    };

    const analysis = useMemo(() => {
        const theta1 = calculateTheta(safeListSize, score1Count);
        const varianceTheta = calculateVariance(safeListSize);
        const stdDevDiff = Math.sqrt(2 * varianceTheta);

        let zScore = 1.96;
        if (confidenceLevel === 90) zScore = 1.645;
        if (confidenceLevel === 80) zScore = 1.282;

        const thetaLowerLimit = theta1 - (zScore * stdDevDiff);
        const thetaUpperLimit = theta1 + (zScore * stdDevDiff);

        let lowerCriticalScore = 0;
        let upperCriticalScore = safeListSize;
        let foundLower = false;
        let foundUpper = false;

        for (let i = 0; i <= safeListSize; i++) {
            const t = calculateTheta(safeListSize, i);
            if (t >= thetaLowerLimit && !foundLower) {
                lowerCriticalScore = i;
                foundLower = true;
            }
            if (t > thetaUpperLimit && !foundUpper) {
                upperCriticalScore = i - 1;
                foundUpper = true;
            }
        }
        if (!foundUpper) upperCriticalScore = safeListSize;

        const lowerCriticalPercent = (lowerCriticalScore / safeListSize) * 100;
        const upperCriticalPercent = (upperCriticalScore / safeListSize) * 100;
        const isSignificant = score2Count < lowerCriticalScore || score2Count > upperCriticalScore;

        return { lowerCriticalPercent, upperCriticalPercent, isSignificant };
    }, [safeListSize, score1Count, confidenceLevel, score2Count]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Ruler className="w-5 h-5 text-slate-500" />
        Test Parameters
        </h2>
        <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Word List Size (n)</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
        {[10, 25, 50, 100].map(size => (
            <button
            key={size}
            onClick={() => setListSize(size)}
            className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                Number(listSize) === size
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            >
            {size}
            </button>
        ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-slate-400">Custom:</span>
        <input
        type="number"
        value={listSize}
        onChange={(e) => setListSize(e.target.value)}
        className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6 w-full">
        <button onClick={() => handleModeChange('percent')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'percent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Percentage (%)</button>
        <button onClick={() => handleModeChange('count')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'count' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Word Count</button>
        </div>
        <div className="space-y-4">
        <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Baseline Score (Score 1)</label>
        <div className="relative">
        <input type="number" value={score1Input} onChange={(e) => setScore1Input(e.target.value)} className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{inputMode === 'percent' ? '%' : `/${safeListSize}`}</span>
        </div>
        </div>
        <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Comparison Score (Score 2)</label>
        <div className="relative">
        <input type="number" value={score2Input} onChange={(e) => setScore2Input(e.target.value)} className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{inputMode === 'percent' ? '%' : `/${safeListSize}`}</span>
        </div>
        </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
        <label className="flex items-center justify-between text-sm text-slate-600">
        <span>Confidence Level</span>
        <select value={confidenceLevel} onChange={(e) => setConfidenceLevel(parseInt(e.target.value))} className="ml-2 border-none bg-slate-100 rounded px-2 py-1 text-slate-900 font-semibold focus:ring-0 cursor-pointer">
        <option value={95}>95%</option>
        <option value={90}>90%</option>
        <option value={80}>80%</option>
        </select>
        </label>
        </div>
        </div>
        </div>
        <div className="md:col-span-7 space-y-6">
        <div className={`p-6 rounded-2xl shadow-sm border-l-8 transition-all duration-300 ${analysis.isSignificant ? 'bg-amber-50 border-amber-500' : 'bg-emerald-50 border-emerald-500'}`}>
        <div className="flex items-start gap-4">
        <div className={`mt-1 p-2 rounded-full ${analysis.isSignificant ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {analysis.isSignificant ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>
        <div>
        <h3 className={`text-xl font-bold mb-1 ${analysis.isSignificant ? 'text-amber-900' : 'text-emerald-900'}`}>{analysis.isSignificant ? 'Significant Difference' : 'No Significant Difference'}</h3>
        <p className={`text-sm leading-relaxed ${analysis.isSignificant ? 'text-amber-800' : 'text-emerald-800'}`}>The difference between {score1Percent.toFixed(1)}% and {score2Percent.toFixed(1)}% is {analysis.isSignificant ? ' ' : ' NOT '} statistically significant at the {confidenceLevel}% confidence level.</p>
        </div>
        </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-blue-500" /> Critical Difference Range</h3>
        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">Baseline: {score1Percent.toFixed(0)}%</span>
        </div>
        <div className="relative pt-8 pb-4">
        <div className="h-4 bg-slate-100 rounded-full w-full relative">
        <div className="absolute top-0 h-full bg-emerald-200/50 border border-emerald-400 rounded-full transition-all duration-500" style={{ left: `${analysis.lowerCriticalPercent}%`, width: `${analysis.upperCriticalPercent - analysis.lowerCriticalPercent}%` }}></div>
        <div className="absolute top-[-8px] w-1 h-8 bg-blue-600 z-10 transition-all duration-500" style={{ left: `${score1Percent}%` }}><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-600 whitespace-nowrap">Baseline</div></div>
        <div className={`absolute top-[-8px] w-1 h-8 z-20 transition-all duration-500 border-2 border-white shadow-sm ${analysis.isSignificant ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ left: `${score2Percent}%` }}><div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap ${analysis.isSignificant ? 'text-amber-600' : 'text-emerald-600'}`}>Score 2</div></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
        </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Methodology</h4>
        <p className="text-xs text-slate-500 leading-relaxed">Calculations use the Freeman-Tukey arc-sine transformation for binomial variables as described by Thornton & Raffin (1978).</p>
        </div>
        </div>
        </div>
    );
};

// --- COMPONENT: Dubno PB-Max Tab ---
const DubnoTab = () => {
    const [pta500, setPta500] = useState<string | number>(20);
    const [pta1000, setPta1000] = useState<string | number>(30);
    const [pta2000, setPta2000] = useState<string | number>(40);
    const [pbMaxScore, setPbMaxScore] = useState<string | number>(80);
    const [listSize, setListSize] = useState<25 | 50>(50);

    const analysis = useMemo(() => {
        const freq500 = Number(pta500) || 0;
        const freq1000 = Number(pta1000) || 0;
        const freq2000 = Number(pta2000) || 0;

        // Calculate PTA (3-frequency only)
        const calculatedPta = (freq500 + freq1000 + freq2000) / 3;

        const currentScore = Number(pbMaxScore) || 0;

        // Get Limit
        const lowerLimit = getDubnoLimit(calculatedPta, listSize);

        // Determine Status
        const isAbnormal = currentScore < lowerLimit;

        return { calculatedPta, lowerLimit, isAbnormal, currentScore };
    }, [pta500, pta1000, pta2000, pbMaxScore, listSize]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* INPUTS */}
        <div className="md:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-slate-500" />
        Patient Data
        </h2>

        <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">Pure Tone Thresholds (dB HL)</label>
        <div className="grid grid-cols-3 gap-3">
        <div>
        <span className="text-xs text-slate-500 mb-1 block">500 Hz</span>
        <input type="number" value={pta500} onChange={e => setPta500(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
        <span className="text-xs text-slate-500 mb-1 block">1000 Hz</span>
        <input type="number" value={pta1000} onChange={e => setPta1000(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
        <span className="text-xs text-slate-500 mb-1 block">2000 Hz</span>
        <input type="number" value={pta2000} onChange={e => setPta2000(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        </div>

        <p className="text-xs text-slate-400 mt-2">
        Uses standard 3-frequency PTA average.
        </p>
        </div>

        <div className="mb-6 pt-6 border-t border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-2">Word List Size</label>
        <div className="flex bg-slate-100 p-1 rounded-lg w-full">
        <button onClick={() => setListSize(25)} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${listSize === 25 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>25 Words</button>
        <button onClick={() => setListSize(50)} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${listSize === 50 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>50 Words</button>
        </div>
        </div>

        <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Measured PB-Max Score (%)</label>
        <input type="number" value={pbMaxScore} onChange={e => setPbMaxScore(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900" />
        </div>

        </div>
        </div>

        {/* RESULTS */}
        <div className="md:col-span-7 space-y-6">

        {/* Status Card */}
        <div className={`p-6 rounded-2xl shadow-sm border-l-8 transition-all duration-300 ${analysis.isAbnormal ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500'}`}>
        <div className="flex items-start gap-4">
        <div className={`mt-1 p-2 rounded-full ${analysis.isAbnormal ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {analysis.isAbnormal ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>
        <div>
        <h3 className={`text-xl font-bold mb-1 ${analysis.isAbnormal ? 'text-red-900' : 'text-emerald-900'}`}>
        {analysis.isAbnormal ? 'Disproportionately Low Score' : 'Within Normal Limits'}
        </h3>
        <p className={`text-sm leading-relaxed ${analysis.isAbnormal ? 'text-red-800' : 'text-emerald-800'}`}>
        For a PTA of <strong>{analysis.calculatedPta.toFixed(1)} dB HL</strong>, the measured PB-Max score of <strong>{analysis.currentScore}%</strong> is
        {analysis.isAbnormal ? ' BELOW ' : ' above '} the 95% confidence lower limit.
        </p>
        </div>
        </div>
        </div>

        {/* Details Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <Table2 className="w-5 h-5 text-blue-500" />
        Analysis Details
        </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-lg">
        <span className="block text-xs text-slate-500 mb-1">Calculated PTA</span>
        <span className="text-2xl font-bold text-slate-800">{analysis.calculatedPta.toFixed(1)} <span className="text-sm font-normal text-slate-400">dB</span></span>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
        <span className="block text-xs text-slate-500 mb-1">95% Lower Limit</span>
        <span className="text-2xl font-bold text-slate-800">{analysis.lowerLimit.toFixed(1)}%</span>
        </div>
        </div>

        <div className="relative pt-6 pb-2">
        <div className="h-2 bg-slate-100 rounded-full w-full relative">
        {/* Marker for Limit */}
        <div className="absolute top-[-4px] w-0.5 h-4 bg-red-400 z-10" style={{ left: `${analysis.lowerLimit}%` }}></div>
        <div className="absolute top-4 -translate-x-1/2 text-[10px] font-bold text-red-400" style={{ left: `${analysis.lowerLimit}%` }}>Limit</div>

        {/* Marker for Score */}
        <div className={`absolute top-[-6px] w-3 h-3 rounded-full z-20 shadow-sm border-2 border-white ${analysis.isAbnormal ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ left: `${Math.min(analysis.currentScore, 100)}%` }}></div>
        </div>
        <div className="flex justify-between mt-6 text-xs text-slate-400 font-mono"><span>0%</span><span>100%</span></div>
        </div>
        </div>

        {/* Reference Note */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Reference</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
        Based on <strong>Dubno et al. (1995)</strong> "Confidence Limits for Maximum Word-Recognition Scores".
        Values derived from NU-6 word lists (Auditec recordings).
        <br/><br/>
        <em>Note: 80% confidence limits are not available as the original study only provided data for 95% limits based on their computer simulation.</em>
        </p>
        </div>

        </div>
        </div>
    );
};

export default SpeechDiscriminationApp;
