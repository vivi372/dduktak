import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Camera,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Info,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { IngredientCombobox } from '@/components/inventory';
import { useRecipeCategories, useRecipeDetail, useCreateRecipe, useUpdateRecipe } from '@/hooks/useRecipe';
import { uploadRecipeImage } from '@/services/storageService';
import type { RecipeDifficulty } from '@/types/recipe';
import type { MasterIngredient } from '@/types/inventory';
import { cn } from '@/utils/cn';


const DIFFICULTY_OPTIONS: { label: RecipeDifficulty; desc: string }[] = [
  { label: '쉬움', desc: '초보자도 뚝딱 가능' },
  { label: '보통', desc: '기본적인 조리 지식 필요' },
  { label: '조금복잡', desc: '정성과 손길이 필요' },
];

const QUICK_TIMES = [5, 10, 15, 20, 30, 45, 60];

/** Zod 유효성 검증 스키마 */
const recipeIngredientSchema = z.object({
  masterIngredientId: z.number().min(1, '식재료를 선택해주세요.'),
  altIngredientId: z.number().nullable().optional(),
  categoryId: z.number(),
  name: z.string().min(1, '식재료명은 필수입니다.'),
  quantity: z.number().min(0.01, '수량은 0보다 커야 합니다.'),
  unit: z.string().min(1, '단위는 필수입니다.'),
  typeCode: z.enum(['MAIN', 'SUB']),
  isOptional: z.boolean(),
});

const recipeStepSchema = z.object({
  stepNo: z.number().min(1),
  description: z.string().min(1, '조리 설명을 작성해 주세요.'),
  imageUrl: z.string().nullable().optional(),
});

const recipeFormSchema = z
  .object({
    recipeCategoryId: z.number().min(1, '카테고리를 선택해 주세요.'),
    title: z
      .string()
      .min(2, '레시피 제목은 최소 2자 이상이어야 합니다.')
      .max(50, '레시피 제목은 최대 50자까지 입력 가능합니다.'),
    description: z.string().max(100, '한 줄 소개는 최대 100자까지 가능합니다.').optional().or(z.literal('')),
    servings: z.number().min(1, '기준 인분은 1 이상이어야 합니다.'),
    cookingTime: z.number().min(1, '조리 시간은 1분 이상이어야 합니다.'),
    difficulty: z.enum(['쉬움', '보통', '조금복잡']),
    thumbnailUrl: z.string().optional().or(z.literal('')),
    ingredients: z.array(recipeIngredientSchema).min(1, '최소 1개 이상의 식재료를 등록해야 합니다.'),
    steps: z.array(recipeStepSchema).min(1, '최소 1개 이상의 조리 순서를 작성해야 합니다.'),
  })
  .refine((data) => data.ingredients.some((i) => i.typeCode === 'MAIN'), {
    message: '스마트 매칭을 위해 최소 1개 이상의 주재료(MAIN)가 필요합니다.',
    path: ['ingredients'],
  });

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

/**
 * 모듈 3: 레시피 등록 및 수정 화면 (RecipeFormPage)
 * - react-hook-form + zod 스키마 검증 기반 구현
 * - REC-01-1: 기본 정보 (제목, 한줄소개, 대표이미지, 기준인분, 조리시간, 난이도, 카테고리)
 * - REC-01-2: 74종 표준 식재료 바인딩 (주재료/부재료 구분, 대체/생략 옵션, 수량/단위)
 * - REC-01-3: Step별 조리 순서 (설명, 이미지 첨부 미리보기, 순서 이동/삭제)
 * - browser-image-compression 압축 후 Supabase Storage recipes 버킷 직업로드 파이프라인
 */
export default function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const recipeId = isEditMode ? Number(id) : 0;

  // 1. 서버 8대 카테고리 목록 조회
  const { data: categories = [] } = useRecipeCategories();

  // 2. 수정 모드일 때 기존 레시피 데이터 조회
  const { data: targetRecipe, isLoading: isRecipeLoading } = useRecipeDetail(recipeId);

  // 3. 등록 및 수정 뮤테이션
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();

  // 4. 업로드 로딩 상태
  const [isThumbnailUploading, setIsThumbnailUploading] = useState<boolean>(false);
  const [uploadingStepIndex, setUploadingStepIndex] = useState<number | null>(null);

  // 5. react-hook-form 폼 인스턴스 초기화
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      recipeCategoryId: 1,
      title: '',
      description: '',
      servings: 1,
      cookingTime: 15,
      difficulty: '쉬움',
      thumbnailUrl: '',
      ingredients: [
        {
          masterIngredientId: 2, // 기본 계란
          categoryId: 2,
          name: '계란',
          quantity: 1,
          unit: '개',
          typeCode: 'MAIN',
          isOptional: false,
        },
      ],
      steps: [
        { stepNo: 1, description: '재료를 깨끗하게 손질하여 준비합니다.', imageUrl: null },
        { stepNo: 2, description: '팬을 달구고 맛있게 조리합니다.', imageUrl: null },
      ],
    },
  });

  // 6. 식재료 FieldArray & 조리 순서 FieldArray
  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    update: updateIngredient,
  } = useFieldArray({ control, name: 'ingredients' });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    move: moveStep,
    update: updateStep,
  } = useFieldArray({ control, name: 'steps' });

  // 수정 모드 데이터 로드 시 폼 리셋
  useEffect(() => {
    if (isEditMode && targetRecipe) {
      reset({
        recipeCategoryId: targetRecipe.recipeCategoryId,
        title: targetRecipe.title,
        description: targetRecipe.description || '',
        servings: targetRecipe.servings,
        cookingTime: targetRecipe.cookingTime,
        difficulty: targetRecipe.difficulty,
        thumbnailUrl: targetRecipe.thumbnailUrl || '',
        ingredients: targetRecipe.ingredients.map((ing) => ({
          masterIngredientId: ing.masterIngredientId,
          altIngredientId: ing.altIngredientId || null,
          categoryId: ing.categoryId,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          typeCode: ing.typeCode,
          isOptional: ing.isOptional,
        })),
        steps: targetRecipe.steps.map((st, idx) => ({
          stepNo: st.stepNo || idx + 1,
          description: st.description,
          imageUrl: st.imageUrl || null,
        })),
      });
    }
  }, [isEditMode, targetRecipe, reset]);

  // watch 필드들
  const watchTitle = watch('title') || '';
  const watchDescription = watch('description') || '';
  const watchThumbnailUrl = watch('thumbnailUrl');
  const watchCategoryId = watch('recipeCategoryId');
  const watchDifficulty = watch('difficulty');
  const watchCookingTime = watch('cookingTime');
  const watchServings = watch('servings');

  // 대표 이미지 업로드 핸들러
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsThumbnailUploading(true);
      toast.info('대표 이미지를 압축하여 업로드하고 있어요... 📸');
      const publicUrl = await uploadRecipeImage(file, 'thumbnails');
      setValue('thumbnailUrl', publicUrl, { shouldValidate: true });
      toast.success('대표 사진이 등록되었어요!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      toast.error(msg);
    } finally {
      setIsThumbnailUploading(false);
    }
  };

  // Step 이미지 업로드 핸들러
  const handleStepImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingStepIndex(index);
      toast.info(`Step ${index + 1} 사진을 업로드하고 있어요... 📷`);
      const publicUrl = await uploadRecipeImage(file, 'steps');
      const currentStep = stepFields[index];
      updateStep(index, { ...currentStep, imageUrl: publicUrl });
      toast.success(`Step ${index + 1} 사진이 등록되었어요!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      toast.error(msg);
    } finally {
      setUploadingStepIndex(null);
    }
  };

  // 재료 추가 핸들러
  const handleAddIngredient = (type: 'MAIN' | 'SUB') => {
    appendIngredient({
      masterIngredientId: 1, // 양파 기본
      categoryId: 1,
      name: '양파',
      quantity: 1,
      unit: '개',
      typeCode: type,
      isOptional: type === 'SUB',
    });
  };

  // 마스터 재료 선택 핸들러
  const handleSelectMaster = (index: number, master: MasterIngredient) => {
    const current = ingredientFields[index];
    updateIngredient(index, {
      ...current,
      masterIngredientId: master.masterIngredientId,
      categoryId: master.categoryId,
      name: master.name,
      unit: master.defaultUnit,
    });
  };

  // 대체 마스터 재료 선택 핸들러
  const handleSelectAltMaster = (index: number, master: MasterIngredient) => {
    const current = ingredientFields[index];
    updateIngredient(index, {
      ...current,
      altIngredientId: master.masterIngredientId,
    });
  };

  // 조리 Step 추가 핸들러
  const handleAddStep = () => {
    appendStep({
      stepNo: stepFields.length + 1,
      description: '',
      imageUrl: null,
    });
  };

  // 폼 제출 핸들러
  const onSubmit = async (values: RecipeFormValues) => {
    try {
      if (isEditMode) {
        const res = await updateMutation.mutateAsync({
          recipeId,
          dto: values,
        });
        toast.success('레시피가 성공적으로 수정되었어요! 🍳');
        navigate(`/recipes/${res.recipeId}`);
      } else {
        const res = await createMutation.mutateAsync(values);
        toast.success('새로운 레시피가 커뮤니티에 등록되었어요! 🎉');
        navigate(`/recipes/${res.recipeId}`);
      }
    } catch (err: unknown) {
      // Axios 에러 처리: _FIELD_ 에러인 경우 폼에 바인딩
      const apiErr = err as { response?: { data?: { code?: string; message?: string } } };
      if (apiErr.response?.data?.code?.includes('_FIELD_')) {
        setError('root', { message: apiErr.response.data.message });
      }
    }
  };

  if (isEditMode && isRecipeLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm font-medium">수정할 레시피 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24">
      {/* 화면 타이틀 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {isEditMode ? '레시피 수정하기 ✏️' : '나만의 뚝딱 레시피 등록 🍳'}
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          1인 가구를 위한 손쉬운 재료와 순서로 레시피를 공유해 보세요.
        </p>
      </div>

      {/* 루트 에러 메시지 */}
      {errors.root && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-50/70 p-3.5 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          {errors.root.message}
        </div>
      )}

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
              {isThumbnailUploading ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500 mb-1" />
                  <span className="text-[10px]">압축 중...</span>
                </div>
              ) : watchThumbnailUrl ? (
                <img
                  src={watchThumbnailUrl}
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
                  onChange={handleThumbnailUpload}
                  disabled={isThumbnailUploading}
                  className="hidden"
                />
              </label>
              {watchThumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setValue('thumbnailUrl', '')}
                  className="block text-xs text-rose-500 font-bold hover:underline"
                >
                  사진 삭제
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                1MB 이하로 자동 압축되어 안전하게 저장됩니다.
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
            <span className="text-[11px] text-muted-foreground">{watchTitle.length}/50</span>
          </div>
          <input
            type="text"
            maxLength={50}
            {...register('title')}
            placeholder="예: 초간단 5분 버터 간장계란밥"
            className={cn(
              'w-full rounded-2xl border bg-background px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:border-brand-500 focus:outline-none',
              errors.title ? 'border-rose-500' : 'border-border/80',
            )}
          />
          {errors.title && (
            <p className="mt-1 text-[11px] text-rose-500 font-bold">{errors.title.message}</p>
          )}
        </div>

        {/* 한 줄 소개 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-foreground">
              한 줄 소개 <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {watchDescription.length}/100
            </span>
          </div>
          <input
            type="text"
            maxLength={100}
            {...register('description')}
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
            {categories.map((c) => (
              <button
                key={c.recipeCategoryId}
                type="button"
                onClick={() => setValue('recipeCategoryId', c.recipeCategoryId, { shouldValidate: true })}
                className={cn(
                  'min-h-[40px] rounded-xl border text-xs font-bold transition-all active:scale-95 text-center',
                  watchCategoryId === c.recipeCategoryId
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-border/80 bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                {c.categoryName}
              </button>
            ))}
          </div>
          {errors.recipeCategoryId && (
            <p className="mt-1 text-[11px] text-rose-500 font-bold">{errors.recipeCategoryId.message}</p>
          )}
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
                value={watchServings}
                onChange={(e) => setValue('servings', Math.max(1, parseInt(e.target.value) || 1))}
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
                value={watchCookingTime}
                onChange={(e) => setValue('cookingTime', Math.max(1, parseInt(e.target.value) || 5))}
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
                  onClick={() => setValue('difficulty', d.label, { shouldValidate: true })}
                  className={cn(
                    'flex-1 min-h-[38px] rounded-xl border text-xs font-bold transition-all',
                    watchDifficulty === d.label
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
              onClick={() => setValue('cookingTime', time)}
              className={cn(
                'rounded-lg px-2 py-0.5 text-[11px] font-bold border transition-colors',
                watchCookingTime === time
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
              2. 식재료 등록 <span className="text-brand-500">({ingredientFields.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-brand-500 shrink-0" />
              <span>
                식재료를 선택해 주세요. 주재료는 냉장고 매칭의 필수 조건이 됩니다.
              </span>
            </p>
          </div>
        </div>

        {errors.ingredients && (
          <p className="text-xs text-rose-500 font-bold">{errors.ingredients.message}</p>
        )}

        {/* 재료 행 목록 */}
        <div className="space-y-3.5">
          {ingredientFields.map((field, idx) => {
            const ing = watch(`ingredients.${idx}`);
            return (
              <div
                key={field.id}
                className="rounded-2xl border border-border/80 bg-background/60 p-3 sm:p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  {/* 주재료 vs 부재료 세그먼트 토글 */}
                  <div className="flex items-center gap-1 rounded-xl border bg-muted/50 p-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateIngredient(idx, { ...ing, typeCode: 'MAIN', isOptional: false })
                      }
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all',
                        ing?.typeCode === 'MAIN'
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      주재료 (MAIN)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateIngredient(idx, { ...ing, typeCode: 'SUB', isOptional: true })
                      }
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all',
                        ing?.typeCode === 'SUB'
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
                    onClick={() => {
                      if (ingredientFields.length <= 1) {
                        toast.error('최소 1개 이상의 재료가 필요해요.');
                        return;
                      }
                      removeIngredient(idx);
                    }}
                    aria-label={`${ing?.name || '재료'} 삭제`}
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
                    value={ing?.masterIngredientId}
                    onChange={(master) => handleSelectMaster(idx, master)}
                  />
                </div>

                {/* 필요 수량 및 단위 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                      수량 ({watchServings}인분 기준)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.1"
                      value={ing?.quantity || 1}
                      onChange={(e) =>
                        updateIngredient(idx, {
                          ...ing,
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
                      value={ing?.unit || ''}
                      onChange={(e) =>
                        updateIngredient(idx, {
                          ...ing,
                          unit: e.target.value,
                        })
                      }
                      placeholder="개, g, ml 등"
                      className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs sm:text-sm font-bold text-foreground focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 부재료 전용: 대체재료 선택 및 생략 옵션 */}
                {ing?.typeCode === 'SUB' && (
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-foreground">
                        대체 재료 / 생략 옵션
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-foreground">
                        <input
                          type="checkbox"
                          checked={ing?.isOptional || false}
                          onChange={(e) =>
                            updateIngredient(idx, {
                              ...ing,
                              isOptional: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded accent-brand-500"
                        />
                        <span>생략 가능 (Optional)</span>
                      </label>
                    </div>

                    <div>
                      <IngredientCombobox
                        value={ing?.altIngredientId ?? null}
                        onChange={(master) => handleSelectAltMaster(idx, master)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
            3. 조리 순서 작성 <span className="text-brand-500">({stepFields.length}단계)</span>
          </h2>
          <span className="text-xs text-muted-foreground">누구나 따라하기 쉽게 작성해 주세요</span>
        </div>

        {errors.steps && (
          <p className="text-xs text-rose-500 font-bold">{errors.steps.message}</p>
        )}

        <div className="space-y-3.5">
          {stepFields.map((field, idx) => {
            const step = watch(`steps.${idx}`);
            const isUploading = uploadingStepIndex === idx;

            return (
              <div
                key={field.id}
                className="rounded-2xl border border-border/80 bg-background/60 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">
                    {idx + 1}
                  </span>

                  {/* 순서 조정 & 삭제 액션 */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveStep(idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label="스텝 위로 이동"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-20"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, idx + 1)}
                      disabled={idx === stepFields.length - 1}
                      aria-label="스텝 아래로 이동"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-20"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (stepFields.length <= 1) {
                          toast.error('최소 1개 이상의 조리 순서가 필요해요.');
                          return;
                        }
                        removeStep(idx);
                      }}
                      aria-label="스텝 삭제"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 조리 설명 textarea */}
                <textarea
                  rows={2}
                  value={step?.description || ''}
                  onChange={(e) =>
                    updateStep(idx, {
                      ...step,
                      stepNo: idx + 1,
                      description: e.target.value,
                    })
                  }
                  placeholder={`Step ${idx + 1} 조리 과정을 자세히 적어주세요.`}
                  className="w-full rounded-xl border border-border/80 bg-card p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-brand-500 focus:outline-none"
                />

                {/* Step 사진 첨부 미리보기 */}
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-accent active:scale-95 transition-all">
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                    <span>{isUploading ? '업로드 중...' : step?.imageUrl ? '사진 변경' : '과정 사진 첨부'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleStepImageUpload(idx, e)}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  {step?.imageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={step.imageUrl}
                        alt="스텝 사진 미리보기"
                        className="h-8 w-12 rounded object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => updateStep(idx, { ...step, imageUrl: null })}
                        className="text-[11px] text-rose-500 font-bold hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
          disabled={isSaving}
          className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 font-black text-sm text-white shadow-soft hover:bg-brand-600 active:scale-98 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{isEditMode ? '레시피 수정 완료' : '레시피 등록 완료'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
