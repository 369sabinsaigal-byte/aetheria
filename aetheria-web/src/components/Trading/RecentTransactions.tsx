import React from 'react';

const RecentTransactions: React.FC = () => {
  return (
    <div className="bg-[#1E1E1E] rounded-2xl p-4 border border-gray-800 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-bold text-lg">Recent txs</h3>
        <button className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 hover:bg-gray-700">
            <span>All</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center relative">
            <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-gray-800"></div>
        </div>
        <div className="text-gray-400 text-sm">You have no activities yet.</div>
        <button className="bg-[#00C896] text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:bg-[#00B084] transition-colors text-sm">
            Go to Wallets
        </button>
      </div>
      
      <div className="mt-auto pt-4 flex justify-center">
        <button className="text-gray-600 hover:text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default RecentTransactions;
