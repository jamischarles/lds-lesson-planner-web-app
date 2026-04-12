interface BottomTabBarProps {
  activeTab: 'edit' | 'stages';
  onTabChange: (tab: 'edit' | 'stages') => void;
  hidden: boolean;
}

export default function BottomTabBar({ activeTab, onTabChange, hidden }: BottomTabBarProps) {
  if (hidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex">
        <button
          onClick={() => onTabChange('edit')}
          className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[50px] ${
            activeTab === 'edit' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          <span className="text-xs mt-0.5">Edit</span>
        </button>
        <button
          onClick={() => onTabChange('stages')}
          className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[50px] ${
            activeTab === 'stages' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <span className="text-xs mt-0.5">Stages</span>
        </button>
      </div>
    </nav>
  );
}
