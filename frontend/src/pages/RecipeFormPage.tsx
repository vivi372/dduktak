import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Info,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { IngredientCombobox } from '@/components/inventory';
import { mockRecipeCategories, mockRecipeDetails } from '@/mocks/recipes.mock';
import type { RecipeIngredient, RecipeStep, RecipeDifficulty } from '@/types/recipe';
import type { MasterIngredient } from '@/types/inventory';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

const DIFFICULTY_OPTIONS: { label: RecipeDifficulty; desc: string }[] = [
  { label: '쉬움', desc: '초보자도 뚝딱 가능' },
  { label: '보통', desc: '기본적인 조리 지식 필요' },
  { label: '어려움', desc: '정성과 손길이 필요' },
];

const QUICK_TIMES = [5, 10, 15, 20, 30, 45, 60];

/**
 * 모듈 3: 레시피 등록 및 수정 화면 (RecipeFormPage)
 * - REC-01-1: 기본 정보 (제목, 한줄소개, 대표이미지, 기준인분, 조리시간, 난이도, 카테고리)
 * - REC-01-2: 74종 표준 식재료 바인딩 (주재료/부재료 구분, 대체/생략 옵션, 수량/단위)
 * - REC-01-3: Step별 조리 순서 (설명, 이미지 첨부 미리보기, 순서 이동/삭제)
 */
export default function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // 수정 모드인 경우 기존 레시피 불러오기
  const targetRecipe = useMemo(() => {
    if (!id) return null;
    return mockRecipeDetails.find((r) => r.recipeId === Number(id)) ?? null;
  }, [id]);

  // 1. 기본 정보 폼 상태
  const [title, setTitle] = useState(targetRecipe?.title ?? '');
  const [description, setDescription] = useState(targetRecipe?.description ?? '');
  const [recipeCategoryId, setRecipeCategoryId] = useState<number>(
    targetRecipe?.recipeCategoryId ?? 4,
  );
  const [servings, setServings] = useState<number>(targetRecipe?.servings ?? 1);
  const [cookingTime, setCookingTime] = useState<number>(targetRecipe?.cookingTime ?? 15);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>(
    targetRecipe?.difficulty ?? '쉬움',
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    targetRecipe?.thumbnailUrl ?? null,
  );

  // 2. 식재료 목록 폼 상태
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    targetRecipe?.ingredients ?? [
      {
        masterIngredientId: 18, // 기본 계란
        categoryId: 2,
        name: '계란',
        quantity: 1,
        unit: '개',
        typeCode: 'MAIN',
        isOptional: false,
      },
    ],
  );

  // 3. 조리 단계 목록 폼 상태
  const [steps, setSteps] = useState<RecipeStep[]>(
    targetRecipe?.steps ?? [
      { stepNo: 1, description: '재료를 깨끗하게 손질하여 준비합니다.', imageUrl: null },
      { stepNo: 2, description: '팬을 달구고 맛있게 조리합니다.', imageUrl: null },
    ],
  );

  // 대표 이미지 업로드 시뮬레이션
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setThumbnailPreview(fakeUrl);
      toast.success('대표 사진이 등록되었어요! 📸');
    }
  };

  // 재료 행 추가
  const handleAddIngredient = (type: 'MAIN' | 'SUB') => {
    setIngredients((prev) => [
      ...prev,
      {
        masterIngredientId: 1, // 양파
        categoryId: 1,
        name: '양파',
        quantity: 1,
        unit: '개',
        typeCode: type,
        isOptional: type === 'SUB',
      },
    ]);
  };

  // 재료 행 삭제
  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length <= 1) {
      toast.error('최소 1개 이상의 재료가 필요해요.');
      return;
    }
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // 재료 정보 변경
  const handleUpdateIngredient = (index: number, updates: Partial<RecipeIngredient>) => {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  // 마스터 재료 선택 시
  const handleSelectMaster = (index: number, master: MasterIngredient) => {
    handleUpdateIngredient(index, {
      masterIngredientId: master.masterIngredientId,
      categoryId: master.categoryId,
      name: master.name,
      unit: master.defaultUnit,
    });
  };

  // 대체 마스터 재료 선택 시
  const handleSelectAltMaster = (index: number, master: MasterIngredient) => {
    handleUpdateIngredient(index, {
      altIngredientId: master.masterIngredientId,
      altIngredientName: master.name,
    });
  };

  // 조리 Step 추가
  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      { stepNo: prev.length + 1, description: '', imageUrl: null },
    ]);
  };

  // 조리 Step 삭제
  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      toast.error('최소 1개 이상의 조리 순서가 필요해요.');
      return;
    }
    const filtered = steps.filter((_, i) => i !== index);
    // stepNo 재정렬
    const reindexed = filtered.map((s, idx) => ({ ...s, stepNo: idx + 1 }));
    setSteps(reindexed);
  };

  // 조리 Step 위로 이동
  const handleMoveStepUp = (index: number) => {
    if (index === 0) return;
    const copied = [...steps];
    const temp = copied[index - 1];
    copied[index - 1] = copied[index];
    copied[index] = temp;
    setSteps(copied.map((s, idx) => ({ ...s, stepNo: idx + 1 })));
  };

  // 조리 Step 아래로 이동
  const handleMoveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const copied = [...steps];
    const temp = copied[index + 1];
    copied[index + 1] = copied[index];
    copied[index] = temp;
    setSteps(copied.map((s, idx) => ({ ...s, stepNo: idx + 1 })));
  };

  // Step 설명 변경
  const handleUpdateStepDescription = (index: number, text: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, description: text } : s)),
    );
  };

  // Step 사진 변경 시뮬레이션
  const handleStepImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, imageUrl: fakeUrl } : s)),
      );
    }
  };

  // 최종 폼 제출 검증
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('레시피 제목을 입력해 주세요.');
      return;
    }

    const hasMain = ingredients.some((i) => i.typeCode === 'MAIN');
    if (!hasMain) {
      toast.error('스마트 매칭을 위해 최소 1개 이상의 주재료가 필요해요.');
      return;
    }

    const emptyStep = steps.some((s) => !s.description.trim());
    if (emptyStep) {
      toast.error('모든 조리 순서의 설명을 작성해 주세요.');
      return;
    }

    if (isEditMode) {
      toast.success('레시피가 성공적으로 수정되었어요! 🍳');
      navigate(`/recipes/${id}`);
    } else {
      toast.success('새로운 레시피가 커뮤니티에 등록되었어요! 🎉');
      navigate(ROUTES.RECIPES);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      {/* 화면 타이틀 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {isEditMode ? '레시피 수정하기 ✏️' : '나만의 뚝딱 레시피 등록 🍳'}
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          1인 가구를 위한 손쉬운 재료와 순서로 레시피를 공유해 보세요.
        </p>
      </div>

      {/* ===================== 1. 기본 정보 섹션 ===================== */}
      <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-card dark:border-white/10">
        <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
          <span>1. 기본 정보</span>
        </h2>

        {/* 대표 이미지 업로드 */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            대표 사진 <span className="text-muted-foreground font-normal">(선택)</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-muted flex items-center justify-center">
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="대표 사진 미리보기"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-muted-foreground p-2">
                  <Camera className="mx-auto h-6 w-6 stroke-1 mb-1" />
                  <span className="text-[11px]">사진 첨부</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-accent active:scale-95 transition-all">
                <Camera className="h-4 w-4" />
                <span>사진 선택하기</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {thumbnailPreview && (
                <button
                  type="button"
                  onClick={() => setThumbnailPreview(null)}
                  className="block text-xs text-rose-500 font-bold hover:underline"
                >
                  사진 삭제
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                1MB 이하의 WebP 또는 JPEG 이미지를 권장합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 레시피 제목 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-foreground">
              레시피 제목 <span className="text-brand-500">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground">{title.length}/50</span>
          </div>
          <input
            type="text"
            required
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 초간단 5분 버터 간장계란밥"
            className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* 한 줄 소개 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-foreground">
              한 줄 소개 <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <span className="text-[11px] text-muted-foreground">{description.length}/100</span>
          </div>
          <input
            type="text"
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: 퇴근 후 귀찮을 때 뚝딱 만들어 먹는 기본 소울푸드"
            className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* 카테고리 선택 */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            카테고리 <span className="text-brand-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mockRecipeCategories
              .filter((c) => c.recipeCategoryId !== 0)
              .map((c) => (
                <button
                  key={c.recipeCategoryId}
                  type="button"
                  onClick={() => setRecipeCategoryId(c.recipeCategoryId)}
                  className={cn(
                    'min-h-[40px] rounded-xl border text-xs font-bold transition-all active:scale-95 text-center',
                    recipeCategoryId === c.recipeCategoryId
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950/40 dark:text-brand-300'
                      : 'border-border/80 bg-background text-muted-foreground hover:bg-accent',
                  )}
                >
                  {c.categoryName}
                </button>
              ))}
          </div>
        </div>

        {/* 기준 인분 & 조리 시간 & 난이도 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* 기준 인분 */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">기준 인분</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={servings}
                onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm font-bold text-foreground focus:border-brand-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-muted-foreground shrink-0">인분</span>
            </div>
          </div>

          {/* 조리 시간 */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">조리 시간</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="5"
                value={cookingTime}
                onChange={(e) => setCookingTime(Math.max(1, parseInt(e.target.value) || 5))}
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm font-bold text-foreground focus:border-brand-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-muted-foreground shrink-0">분</span>
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">난이도</label>
            <div className="flex gap-1.5">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setDifficulty(d.label)}
                  className={cn(
                    'flex-1 min-h-[38px] rounded-xl border text-xs font-bold transition-all',
                    difficulty === d.label
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-border/80 bg-background text-muted-foreground hover:bg-accent',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 빠른 시간 선택 칩 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground mr-1">빠른 선택:</span>
          {QUICK_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => setCookingTime(time)}
              className={cn(
                'rounded-lg px-2 py-0.5 text-[11px] font-bold border transition-colors',
                cookingTime === time
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-muted border-border/60 text-muted-foreground hover:bg-accent',
              )}
            >
              {time}분
            </button>
          ))}
        </div>
      </section>

      {/* ===================== 2. 표준 식재료 바인딩 섹션 ===================== */}
      <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-card dark:border-white/10">
        <div className="flex items-center justify-between border-b pb-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              2. 식재료 등록 <span className="text-brand-500">({ingredients.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-brand-500 shrink-0" />
              <span>
                식재료를 선택해 주세요. 주재료는 냉장고 매칭의 필수 조건이 됩니다.
              </span>
            </p>
          </div>
        </div>

        {/* 재료 행 목록 */}
        <div className="space-y-3.5">
          {ingredients.map((ing, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/80 bg-background/60 p-3 sm:p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                {/* 주재료 vs 부재료 세그먼트 토글 */}
                <div className="flex items-center gap-1 rounded-xl border bg-muted/50 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateIngredient(idx, { typeCode: 'MAIN' })}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all',
                      ing.typeCode === 'MAIN'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    주재료 (MAIN)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateIngredient(idx, { typeCode: 'SUB' })}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all',
                      ing.typeCode === 'SUB'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    부재료 (SUB)
                  </button>
                </div>

                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(idx)}
                  aria-label={`${ing.name} 재료 삭제`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-500 transition-colors active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* 표준 식재료 Combobox 검색 및 선택 */}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  식재료 선택
                </label>
                <IngredientCombobox
                  value={ing.masterIngredientId}
                  onChange={(master) => handleSelectMaster(idx, master)}
                />
              </div>

              {/* 필요 수량 및 단위 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                    수량 ({servings}인분 기준)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={ing.quantity}
                    onChange={(e) =>
                      handleUpdateIngredient(idx, {
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs sm:text-sm font-bold text-foreground focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                    단위
                  </label>
                  <input
                    type="text"
                    required
                    value={ing.unit}
                    onChange={(e) => handleUpdateIngredient(idx, { unit: e.target.value })}
                    placeholder="개, g, ml 등"
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs sm:text-sm font-bold text-foreground focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 부재료 전용: 대체재료 선택 및 생략 옵션 */}
              {ing.typeCode === 'SUB' && (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-foreground">
                      대체 재료 / 생략 옵션
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={ing.isOptional}
                        onChange={(e) =>
                          handleUpdateIngredient(idx, { isOptional: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-brand-500"
                      />
                      <span>생략 가능 (Optional)</span>
                    </label>
                  </div>

                  <div>
                    <IngredientCombobox
                      value={ing.altIngredientId ?? null}
                      onChange={(master) => handleSelectAltMaster(idx, master)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 재료 추가 버튼군 */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAddIngredient('MAIN')}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-500/40 bg-brand-50/50 text-xs sm:text-sm font-extrabold text-brand-700 hover:bg-brand-50 active:scale-98 transition-all dark:bg-brand-950/20 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" />
            <span>주재료 추가</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddIngredient('SUB')}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background text-xs sm:text-sm font-extrabold text-foreground hover:bg-accent active:scale-98 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>부재료 추가</span>
          </button>
        </div>
      </section>

      {/* ===================== 3. 조리 순서(Step) 작성 섹션 ===================== */}
      <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-card dark:border-white/10">
        <div className="flex items-center justify-between border-b pb-2.5">
          <h2 className="text-sm sm:text-base font-extrabold text-foreground">
            3. 조리 순서 작성 <span className="text-brand-500">({steps.length}단계)</span>
          </h2>
          <span className="text-xs text-muted-foreground">누구나 따라하기 쉽게 작성해 주세요</span>
        </div>

        <div className="space-y-3.5">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/80 bg-background/60 p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">
                  {step.stepNo}
                </span>

                {/* 순서 조정 & 삭제 액션 */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveStepUp(idx)}
                    disabled={idx === 0}
                    aria-label="스텝 위로 이동"
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-20"
                  >
                    <MoveUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveStepDown(idx)}
                    disabled={idx === steps.length - 1}
                    aria-label="스텝 아래로 이동"
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-20"
                  >
                    <MoveDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    aria-label="스텝 삭제"
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 조리 설명 textarea */}
              <textarea
                required
                rows={2}
                value={step.description}
                onChange={(e) => handleUpdateStepDescription(idx, e.target.value)}
                placeholder={`Step ${step.stepNo} 조리 과정을 자세히 적어주세요.`}
                className="w-full rounded-xl border border-border/80 bg-card p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-brand-500 focus:outline-none"
              />

              {/* Step 사진 첨부 미리보기 */}
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-accent active:scale-95 transition-all">
                  <Camera className="h-3.5 w-3.5" />
                  <span>{step.imageUrl ? '사진 변경' : '과정 사진 첨부'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleStepImageChange(idx, e)}
                    className="hidden"
                  />
                </label>

                {step.imageUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={step.imageUrl}
                      alt="스텝 사진 미리보기"
                      className="h-8 w-12 rounded object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSteps((prev) =>
                          prev.map((s, i) => (i === idx ? { ...s, imageUrl: null } : s)),
                        )
                      }
                      className="text-[11px] text-rose-500 font-bold hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 스텝 추가 버튼 */}
        <button
          type="button"
          onClick={handleAddStep}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background/50 text-xs sm:text-sm font-bold text-foreground hover:bg-accent active:scale-98 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>조리 순서(Step) 추가하기</span>
        </button>
      </section>

      {/* ===================== 하단 액션 버튼 ===================== */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-h-[50px] w-1/3 rounded-2xl border border-border bg-background text-sm font-bold text-muted-foreground hover:bg-accent active:scale-98 transition-all"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 font-black text-sm text-white shadow-soft hover:bg-brand-600 active:scale-98 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>{isEditMode ? '레시피 수정 완료' : '레시피 등록 완료'}</span>
        </button>
      </div>
    </form>
  );
}
