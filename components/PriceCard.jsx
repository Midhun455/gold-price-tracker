'use client'

export default function PriceCard({ title, icon, data, type, onToggle, change }) {
  const getChangeColor = () => {
    if (!change) return 'text-gray-400'
    return change.direction === 'up' ? 'text-green-400' : change.direction === 'down' ? 'text-red-400' : 'text-gray-400'
  }

  return (
    <div className="glass-card p-8 w-full">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${type === 'gold' ? 'from-yellow-400 to-yellow-600' : 'from-gray-300 to-gray-500'} flex items-center justify-center shadow-lg`}>
            <span className="text-3xl font-bold">{icon}</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300 text-sm">
          {type === 'gold' ? '24K · 22K · 18K India Import Landed' : 'XAG/USD · India Import Landed'}
        </p>
        {data?.source && (
          <p className="text-xs text-gray-400 mt-1">Source: {data.source}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="glass p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">{type === 'gold' ? 'XAU/USD' : 'XAG/USD'}</span>
            <div className="text-right">
              <span className="text-white font-mono text-xl">${data?.usd || '—'}</span>
              {change && (
                <p className={`text-xs ${getChangeColor()} mt-1`}>
                  {change.direction === 'up' ? '▲' : change.direction === 'down' ? '▼' : '•'} 
                  ${Math.abs(change.change)} ({change.percentage}%)
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">USD/INR</span>
            <span className="text-white font-mono text-xl">₹{data?.usdInr || '—'}</span>
          </div>
        </div>

        <div className="glass p-4 rounded-xl">
          {type === 'gold' ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300">24K Gold</span>
                <span className="text-yellow-400 font-bold text-xl">₹{data?.rates?.['24K'] || '—'}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300">22K Gold</span>
                <span className="text-yellow-300 font-bold text-xl">₹{data?.rates?.['22K'] || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">18K Gold</span>
                <span className="text-yellow-200 font-bold text-xl">₹{data?.rates?.['18K'] || '—'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300">Silver Price</span>
                <div className="text-right">
                  <span className="text-gray-200 font-bold text-2xl">₹{data?.ratePerGram || '—'}</span>
                  {change && (
                    <p className={`text-xs ${getChangeColor()} mt-1`}>
                      {change.direction === 'up' ? '▲' : change.direction === 'down' ? '▼' : '•'} 
                      ₹{Math.abs(change.change)} ({change.percentage}%)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>per gram</span>
                <span>+ making charges</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">1 kg Bar</span>
                  <span className="text-white font-mono">₹{data?.perKg || '—'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="text-center text-gray-400 text-xs mt-4">
          <p>📊 Live updates every 2 seconds from TradingView</p>
          <p className="mt-1">🔄 Last updated: {data?.lastUpdate || '—'}</p>
          <p className="mt-2 text-gray-500">*Includes 6% duty + making charges + GST</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="mt-6 w-full glass py-3 rounded-xl text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
      >
        <span>🔄</span> Toggle {type === 'gold' ? 'Silver' : 'Gold'} Rates
      </button>
    </div>
  )
}
