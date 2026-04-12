import { useState } from 'react';
import { STAGES, STAGE_LABELS, STAGE_PURPOSES, type Stage, type StageStatus, getNextStage } from '../lib/types';

interface StagesTabProps {
  slug: string;
  stages: Record<Stage, StageStatus | null>;
  currentStage: Stage;
  stageData: Record<string, { frontmatter: any; body: string } | null>;
  onStageSelect: (stage: Stage) => void;
  onStageCompleted: (nextStage: Stage) => void;
}

function statusBadge(status: StageStatus | null): { text: string; className: string } {
  if (status === 'complete') return { text: 'Complete', className: 'bg-green-100 text-green-700' };
  if (status === 'wip') return { text: 'In Progress', className: 'bg-yellow-100 text-yellow-700' };
  return { text: 'Not Started', className: 'bg-gray-100 text-gray-500' };
}

export default function StagesTab({ slug, stages, currentStage, stageData, onStageSelect, onStageCompleted }: StagesTabProps) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/lessons/${slug}/${currentStage}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.nextStage) {
        onStageCompleted(data.nextStage);
      } else {
        // Final stage completed — reload to show updated state
        window.location.reload();
      }
    } catch {
      alert('Failed to complete stage. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const nextStage = getNextStage(currentStage);
  const canComplete = stages[currentStage] === 'wip';
  const allComplete = STAGES.every(s => stages[s] === 'complete');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {STAGES.map((stage) => {
          const status = stages[stage];
          const badge = statusBadge(status);
          const data = stageData[stage];
          const isAccessible = status !== null;
          const isCurrent = stage === currentStage;
          const preview = data?.body?.trim().split('\n').slice(0, 3).join(' ').slice(0, 100);

          return (
            <button
              key={stage}
              onClick={() => isAccessible && onStageSelect(stage)}
              disabled={!isAccessible}
              className={`w-full text-left p-4 rounded-xl border ${
                isCurrent
                  ? 'border-blue-300 bg-blue-50'
                  : isAccessible
                    ? 'border-gray-200 bg-white active:bg-gray-50'
                    : 'border-gray-100 bg-gray-50 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-base">{STAGE_LABELS[stage]}</span>
                  <span className="text-sm text-gray-500 ml-2">{STAGE_PURPOSES[stage]}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                  {badge.text}
                </span>
              </div>
              {preview && (
                <p className="text-sm text-gray-400 mt-1.5 truncate">{preview}</p>
              )}
              {data?.frontmatter?.updated_at && (
                <p className="text-xs text-gray-300 mt-1">
                  Updated: {new Date(data.frontmatter.updated_at).toLocaleDateString()}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Complete button */}
      {canComplete && !allComplete && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full bg-green-600 text-white font-medium text-base py-3.5 rounded-lg active:bg-green-700 disabled:opacity-50 min-h-[44px]"
          >
            {completing
              ? 'Completing...'
              : nextStage
                ? `Mark Complete → ${STAGE_LABELS[nextStage]}`
                : 'Mark Final Complete'
            }
          </button>
        </div>
      )}

      {allComplete && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="text-center text-green-600 font-medium py-3">
            All stages complete!
          </div>
        </div>
      )}
    </div>
  );
}
