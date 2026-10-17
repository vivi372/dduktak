import React from 'react';
import { ChefHat, Refrigerator, Sparkles, Bell, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-gray-50 text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-gray-900 dark:text-white">오늘의 뚝딱</h1>
              <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">1인 가구 냉장고 파먹기</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              aria-label="알림"
              className="p-2 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 대시보드 스켈레톤 컨테이너 */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 브리핑 배너 */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 shadow-xl shadow-orange-500/15">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>오늘의 브리핑</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">계란과 대파로 뚝딱 만들 수 있는 요리가 있어요! 🍳</h2>
            <p className="text-orange-100 text-sm">냉장고에 있는 재료를 기반으로 똑똑한 레시피를 추천해 드려요.</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </section>

        {/* 퀵 상태 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 내 냉장고 바로가기 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Refrigerator className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">내 재료 관리소</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">소비기한 임박 재료를 한눈에 확인하고 관리해요.</p>
          </div>

          {/* 맞춤 레시피 탐색 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">스마트 레시피 매칭</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">보유 재료 매칭률 80% 이상의 추천 요리를 만나보세요.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
