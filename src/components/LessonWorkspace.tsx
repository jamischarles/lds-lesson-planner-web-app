import { useState, useEffect, useCallback } from 'react';
import { STAGES, type Stage, type StageStatus } from '../lib/types';
import TopBar from './TopBar';
import BottomTabBar from './BottomTabBar';
import EditorTab from './EditorTab';
import StagesTab from './StagesTab';

interface LessonWorkspaceProps {
  slug: string;
  topic: string;
  date: string;
  audience: string;
  stages: Record<Stage, StageStatus | null>;
  currentStage: Stage;
  initialStageData: Record<string, { frontmatter: any; body: string } | null>;
}

export default function LessonWorkspace({
  slug,
  topic,
  date,
  audience,
  stages: initialStages,
  currentStage: initialCurrentStage,
  initialStageData,
}: LessonWorkspaceProps) {
  const [stages, setStages] = useState(initialStages);
  const [currentStage, setCurrentStage] = useState<Stage>(initialCurrentStage);
  const [viewingStage, setViewingStage] = useState<Stage>(initialCurrentStage);
  const [activeTab, setActiveTab] = useState<'edit' | 'stages'>(
    initialStages[initialCurrentStage] === 'wip' ? 'edit' : 'stages'
  );
  const [stageData, setStageData] = useState(initialStageData);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Keyboard detection via visualViewport
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // If visual viewport height is significantly less than window height, keyboard is open
      const heightDiff = window.innerHeight - vv.height;
      setKeyboardOpen(heightDiff > 150);
    };

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  const handleStageSelect = useCallback((stage: Stage) => {
    setViewingStage(stage);
    setActiveTab('edit');
  }, []);

  const handleBodyChange = useCallback((body: string) => {
    setStageData(prev => {
      const existing = prev[viewingStage];
      if (!existing) return prev;
      return { ...prev, [viewingStage]: { ...existing, body } };
    });
  }, [viewingStage]);

  const handleStageCompleted = useCallback(async (nextStage: Stage) => {
    // Fetch the new stage data
    try {
      const res = await fetch(`/api/lessons/${slug}/${nextStage}`);
      const data = await res.json();

      setStages(prev => ({
        ...prev,
        [currentStage]: 'complete' as StageStatus,
        [nextStage]: 'wip' as StageStatus,
      }));
      setStageData(prev => ({ ...prev, [nextStage]: data }));
      setCurrentStage(nextStage);
      setViewingStage(nextStage);
      setActiveTab('edit');
    } catch {
      // Fallback: reload
      window.location.reload();
    }
  }, [slug, currentStage]);

  const isReadOnly = viewingStage !== currentStage || stages[viewingStage] === 'complete';
  const currentBody = stageData[viewingStage]?.body ?? '';

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <TopBar
        topic={topic}
        stages={stages}
        currentStage={viewingStage}
        onStageSelect={handleStageSelect}
      />

      {/* Main content area — fills between top bar and bottom tab bar */}
      <main className="flex-1 overflow-hidden" style={{ paddingBottom: keyboardOpen ? '0px' : '58px' }}>
        {activeTab === 'edit' && (
          <EditorTab
            slug={slug}
            stage={viewingStage}
            initialBody={currentBody}
            isReadOnly={isReadOnly}
            onBodyChange={handleBodyChange}
          />
        )}
        {activeTab === 'stages' && (
          <StagesTab
            slug={slug}
            stages={stages}
            currentStage={currentStage}
            stageData={stageData}
            onStageSelect={handleStageSelect}
            onStageCompleted={handleStageCompleted}
          />
        )}
      </main>

      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hidden={keyboardOpen}
      />
    </div>
  );
}
