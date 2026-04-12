import { STAGES, STAGE_LABELS, type Stage, type StageStatus } from '../lib/types';

interface TopBarProps {
  topic: string;
  stages: Record<Stage, StageStatus | null>;
  currentStage: Stage;
  onStageSelect: (stage: Stage) => void;
}

function dotColor(status: StageStatus | null): string {
  if (status === 'complete') return 'bg-green-500';
  if (status === 'wip') return 'bg-yellow-400';
  return 'bg-gray-300';
}

export default function TopBar({ topic, stages, currentStage, onStageSelect }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <a
          href="/"
          className="text-blue-600 text-xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1"
        >
          &larr;
        </a>
        <h1 className="text-base font-semibold truncate flex-1 min-w-0">{topic}</h1>
      </div>
      {/* Stage dots */}
      <div className="flex items-center gap-1 mt-1.5 ml-[40px]">
        {STAGES.map((stage) => {
          const isAccessible = stages[stage] !== null;
          const isCurrent = stage === currentStage;
          return (
            <button
              key={stage}
              onClick={() => isAccessible && onStageSelect(stage)}
              disabled={!isAccessible}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md min-h-[28px] ${
                isCurrent ? 'bg-gray-100' : ''
              } ${isAccessible ? 'active:bg-gray-100' : 'opacity-60'}`}
            >
              <span className={`w-2 h-2 rounded-full ${dotColor(stages[stage])}`} />
              <span className={`text-xs ${isCurrent ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                {STAGE_LABELS[stage]}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
