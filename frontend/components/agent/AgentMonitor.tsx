"use client";

import React from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AgentMonitor() {
  const { activeStatuses, showMonitor, toggleMonitor, clearStatuses } = useAgentStore();

  if (!showMonitor) {
    return (
      <button 
        onClick={toggleMonitor}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center"
        title="Open Agent Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-sm text-gray-300 z-50">
      <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
          <Terminal className="w-4 h-4" />
          <span>Agent Monitor</span>
        </div>
        <div className="flex space-x-3">
          <button onClick={clearStatuses} className="text-gray-400 hover:text-white transition-colors">Clear</button>
          <button onClick={toggleMonitor} className="text-gray-400 hover:text-white transition-colors">Close</button>
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        <AnimatePresence>
          {activeStatuses.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">No active agents</div>
          ) : (
            activeStatuses.map((status, idx) => (
              <motion.div 
                key={`${status.timestamp}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start space-x-2 border-b border-gray-800 pb-2 last:border-0"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {status.status === 'running' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                  {status.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {status.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                  {status.status === 'pending' && <div className="w-4 h-4 rounded-full border border-gray-500" />}
                  {status.status === 'retrying' && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-200">{status.agent_name}</span>
                    <span className="text-[10px] text-gray-500">{new Date(status.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-gray-400 mt-0.5 truncate">{status.detail || status.status}</div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
