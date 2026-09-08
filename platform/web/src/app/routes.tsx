import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AgentWorkspace } from '../features/agents/AgentWorkspace';
import { ModelArena } from '../features/arena/ModelArena';
import { PersonalStyleLab } from '../features/personal-style/PersonalStyleLab';
import { DatasetIntelligence } from '../features/datasets/DatasetIntelligence';
import { FineTuningFactory } from '../features/fine-tuning/FineTuningFactory';
import { KnowledgeView } from '../features/knowledge/KnowledgeView';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* Redirect root to /agents */}
        <Route index element={<Navigate to="/agents" replace />} />
        
        {/* Core Workspace & Feature Routes */}
        <Route path="agents" element={<AgentWorkspace />} />
        <Route path="arena" element={<ModelArena />} />
        <Route path="personal-style" element={<PersonalStyleLab />} />
        <Route path="datasets" element={<DatasetIntelligence />} />
        <Route path="fine-tuning" element={<FineTuningFactory />} />
        <Route path="knowledge" element={<KnowledgeView />} />
        
        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/agents" replace />} />
      </Route>
    </Routes>
  );
};
