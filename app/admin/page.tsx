'use client'

import { useState } from 'react'
import UploadTab from '@/components/admin/UploadTab'
import FilmsTab from '@/components/admin/FilmsTab'
import UsageTab from '@/components/admin/UsageTab'
import PayoutsTab from '@/components/admin/PayoutsTab'
import KillSwitch from '@/components/admin/KillSwitch'

const TABS = ['Upload', 'Films', 'Usage', 'Payouts', 'Kill Switch'] as const
type Tab = typeof TABS[number]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Upload')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 bg-accent rounded-full" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-surface rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-surface-2 text-white shadow'
                : 'text-gray-400 hover:text-white'
            } ${tab === 'Kill Switch' && activeTab !== tab ? 'text-red-400 hover:text-red-300' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[500px]">
        {activeTab === 'Upload' && <UploadTab />}
        {activeTab === 'Films' && <FilmsTab />}
        {activeTab === 'Usage' && <UsageTab />}
        {activeTab === 'Payouts' && <PayoutsTab />}
        {activeTab === 'Kill Switch' && <KillSwitch />}
      </div>
    </div>
  )
}
