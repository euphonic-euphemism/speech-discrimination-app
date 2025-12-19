import React, { useState, useMemo } from 'react';
import { Calculator, AlertCircle, CheckCircle2, BookOpen, Info, ArrowRightLeft, Ruler } from 'lucide-react';

const SpeechDiscriminationApp = () => {
    // State
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

    // derived values safely parsed from inputs
    const safeListSize = Number(listSize) || 50;
    const val1 = parseFloat(score1Input.toString()) || 0;
    const val2 = parseFloat(score2Input.toString()) || 0;

    // Helper to clamp values between min and max
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    // Calculate raw counts, clamped to ensure we never exceed list size (e.g. 60/50 words)
    const score1CountRaw = inputMode === 'percent' ? Math.round((val1 / 100) * safeListSize) : val1;
    const score2CountRaw = inputMode === 'percent' ? Math.round((val2 / 100) * safeListSize) : val2;

    const score1Count = clamp(score1CountRaw, 0, safeListSize);
    const score2Count = clamp(score2CountRaw, 0, safeListSize);

    const score1Percent = (score1Count / safeListSize) * 100;
    const score2Percent = (score2Count / safeListSize) * 100;

    // Handle Mode Switching with Conversion
    const handleModeChange = (newMode: 'percent' | 'count') => {
        if (newMode === inputMode) return;

        if (newMode === 'count') {
            // Switching Percent -> Count
            // Convert current percent inputs (e.g. 92) to counts (e.g. 46)
            // We clamp val1/val2 to 100 just in case user typed "150%"
            const p1 = Math.min(val1, 100);
            const p2 = Math.min(val2, 100);
            setScore1Input(Math.round((p1 / 100) * safeListSize));
            setScore2Input(Math.round((p2 / 100) * safeListSize));
        } else {
            // Switching Count -> Percent
            // Convert current count inputs (e.g. 46) to percent (e.g. 92)
            // We clamp val1/val2 to safeListSize just in case user typed "60" words for 50 list
            const c1 = Math.min(val1, safeListSize);
            const c2 = Math.min(val2, safeListSize);
            setScore1Input(((c1 / safeListSize) * 100).toFixed(1));
            setScore2Input(((c2 / safeListSize) * 100).toFixed(1));
        }
        setInputMode(newMode);
    };

    // Analysis Logic
    const analysis = useMemo(() => {
        // 1. Calculate Theta for Score 1
        const theta1 = calculateTheta(safeListSize, score1Count);

        // 2. Calculate Variance of the difference
        const varianceTheta = calculateVariance(safeListSize);
        const stdDevDiff = Math.sqrt(2 * varianceTheta);

        // 3. Determine Z-score based on confidence level
        let zScore = 1.96; // Default to 95%
        if (confidenceLevel === 90) zScore = 1.645;
        if (confidenceLevel === 80) zScore = 1.282;

        // 4. Calculate Angular Critical Limits
        const thetaLowerLimit = theta1 - (zScore * stdDevDiff);
        const thetaUpperLimit = theta1 + (zScore * stdDevDiff);

        // 5. Iterate to find Score Critical Limits (transform back)
        let lowerCriticalScore = 0;
        let upperCriticalScore = safeListSize;
        let foundLower = false;
        let foundUpper = false;

        // Search for Lower Limit (Percent)
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

        // 6. Compare Score 2
        const isSignificant = score2Count < lowerCriticalScore || score2Count > upperCriticalScore;

        return {
            lowerCriticalScore,
            upperCriticalScore,
            lowerCriticalPercent,
            upperCriticalPercent,
            isSignificant
        };
    }, [safeListSize, score1Count, confidenceLevel, score2Count]); // Added score2Count to deps

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between">
        <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
        <Calculator className="w-8 h-8 text-blue-600" />
        Speech Discrimination Comparator
        </h1>
        <p className="text-slate-600">
        Based on the binomial model by <span className="font-semibold text-slate-700">Thornton & Raffin (1978)</span>.
        </p>
        </div>
        <a
        href="#"
        className="hidden md:flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full transition-colors"
        >
        <BookOpen className="w-4 h-4" />
        Reference Model
        </a>
        </div>
        </header>

        {/* Main Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Inputs */}
        <div className="md:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Ruler className="w-5 h-5 text-slate-500" />
        Test Parameters
        </h2>

        {/* List Size */}
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

        {/* Input Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6 w-full">
        <button
        onClick={() => handleModeChange('percent')}
        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
            inputMode === 'percent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
        >
        Percentage (%)
        </button>
        <button
        onClick={() => handleModeChange('count')}
        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
            inputMode === 'count' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
        >
        Word Count
        </button>
        </div>

        {/* Scores */}
        <div className="space-y-4">
        <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Baseline Score (Score 1)</label>
        <div className="relative">
        <input
        type="number"
        value={score1Input}
        onChange={(e) => setScore1Input(e.target.value)}
        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
        {inputMode === 'percent' ? '%' : `/${safeListSize}`}
        </span>
        </div>
        </div>

        <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Comparison Score (Score 2)</label>
        <div className="relative">
        <input
        type="number"
        value={score2Input}
        onChange={(e) => setScore2Input(e.target.value)}
        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
        {inputMode === 'percent' ? '%' : `/${safeListSize}`}
        </span>
        </div>
        </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
        <label className="flex items-center justify-between text-sm text-slate-600">
        <span>Confidence Level</span>
        <select
        value={confidenceLevel}
        onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
        className="ml-2 border-none bg-slate-100 rounded px-2 py-1 text-slate-900 font-semibold focus:ring-0 cursor-pointer"
        >
        <option value={95}>95%</option>
        <option value={90}>90%</option>
        <option value={80}>80%</option>
        </select>
        </label>
        </div>

        </div>
        </div>

        {/* Results */}
        <div className="md:col-span-7 space-y-6">

        {/* Primary Result Card */}
        <div className={`p-6 rounded-2xl shadow-sm border-l-8 transition-all duration-300 ${
            analysis.isSignificant
            ? 'bg-amber-50 border-amber-500'
            : 'bg-emerald-50 border-emerald-500'
        }`}>
        <div className="flex items-start gap-4">
        <div className={`mt-1 p-2 rounded-full ${
            analysis.isSignificant ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
        {analysis.isSignificant ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>
        <div>
        <h3 className={`text-xl font-bold mb-1 ${
            analysis.isSignificant ? 'text-amber-900' : 'text-emerald-900'
        }`}>
        {analysis.isSignificant ? 'Significant Difference' : 'No Significant Difference'}
        </h3>
        <p className={`text-sm leading-relaxed ${
            analysis.isSignificant ? 'text-amber-800' : 'text-emerald-800'
        }`}>
        The difference between {score1Percent.toFixed(1)}% and {score2Percent.toFixed(1)}% is
        {analysis.isSignificant ? ' ' : ' NOT '}
        statistically significant at the {confidenceLevel}% confidence level.
        {analysis.isSignificant
            ? ' It is unlikely that this difference is due to chance alone.'
    : ' This variation is expected within normal test-retest variability.'}
    </p>
    </div>
    </div>
    </div>

    {/* Critical Difference Chart */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
    <div className="flex items-center justify-between mb-6">
    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
    <ArrowRightLeft className="w-5 h-5 text-blue-500" />
    Critical Difference Range
    </h3>
    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
    Baseline: {score1Percent.toFixed(0)}%
    </span>
    </div>

    <div className="relative pt-8 pb-4">
    {/* Range Bar Background */}
    <div className="h-4 bg-slate-100 rounded-full w-full relative">

    {/* The Critical Range */}
    <div
    className="absolute top-0 h-full bg-emerald-200/50 border border-emerald-400 rounded-full transition-all duration-500"
    style={{
        left: `${analysis.lowerCriticalPercent}%`,
        width: `${analysis.upperCriticalPercent - analysis.lowerCriticalPercent}%`
    }}
    ></div>

    {/* Baseline Marker */}
    <div
    className="absolute top-[-8px] w-1 h-8 bg-blue-600 z-10 transition-all duration-500"
    style={{ left: `${score1Percent}%` }}
    >
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-600 whitespace-nowrap">
    Baseline
    </div>
    </div>

    {/* Comparison Marker */}
    <div
    className={`absolute top-[-8px] w-1 h-8 z-20 transition-all duration-500 border-2 border-white shadow-sm ${
        analysis.isSignificant ? 'bg-amber-500' : 'bg-emerald-600'
    }`}
    style={{ left: `${score2Percent}%` }}
    >
    <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap ${
        analysis.isSignificant ? 'text-amber-600' : 'text-emerald-600'
    }`}>
    Score 2
    </div>
    </div>
    </div>

    {/* Scale Labels */}
    <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
    <span>0%</span>
    <span>25%</span>
    <span>50%</span>
    <span>75%</span>
    <span>100%</span>
    </div>
    </div>

    <div className="mt-4 bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
    <p>
    For a baseline score of <span className="font-bold">{score1Percent.toFixed(1)}%</span> ({score1Count}/{safeListSize}),
            any subsequent score between <span className="font-bold text-emerald-700">{analysis.lowerCriticalPercent.toFixed(1)}%</span> and <span className="font-bold text-emerald-700">{analysis.upperCriticalPercent.toFixed(1)}%</span> is considered statistically equivalent.
            </p>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-200 border border-emerald-400 rounded-sm"></div>
            <span>Non-Significant Range</span>
            </div>
            <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            <span>Baseline</span>
            </div>
            <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
            <span>Current Score</span>
            </div>
            </div>
            </div>

            </div>

            {/* Methodology Note */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            Methodology
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
            Calculations use the Freeman-Tukey arc-sine transformation for binomial variables as described by Thornton & Raffin (1978).
            Variance is estimated as <code>1/(n+0.5)</code> for n≥50 and <code>1/(n+1)</code> for n&lt;50.
            Critical differences are derived iteratively to find score boundaries that satisfy the confidence interval in the angular domain.
            </p>
            </div>

            </div>
            </div>
            </div>
            </div>
    );
};

export default SpeechDiscriminationApp;
