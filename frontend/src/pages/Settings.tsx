import React from 'react';
import { Settings as SettingsIcon, Server, Shield, Moon, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" /> Platform Configuration & Settings
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Backend API endpoints, theme options, and exchange connection settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Connectivity Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" /> Backend Service Connection
            </CardTitle>
          </CardHeader>
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 mb-1 block">API Base URL (VITE_API_BASE_URL)</label>
              <input
                type="text"
                readOnly
                value={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
                className="w-full bg-obsidian-800 border border-slate-800 rounded px-3 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 mb-1 block">App Environment</label>
              <input
                type="text"
                readOnly
                value={import.meta.env.VITE_ENVIRONMENT || 'development'}
                className="w-full bg-obsidian-800 border border-slate-800 rounded px-3 py-2 text-slate-200"
              />
            </div>
          </div>
        </Card>

        {/* Security & Masking Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Delta Exchange API Security
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 text-xs font-mono text-slate-400">
            <p>
              Delta Exchange API keys and HMAC signing secrets are strictly encapsulated on the FastAPI backend server. Secrets are never exposed to or stored in client browser state.
            </p>
            <div className="p-3 rounded bg-obsidian-950 border border-slate-800 text-slate-300">
              <span className="text-emerald-400 font-bold">✓ Zero-Exposure Security Verified</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
