import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, X, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProfileCropModal } from './ProfileCropModal';
import { useBodyScrollLock } from '@/hooks';
import type { UserProfileResponseDto } from '@/types/auth';
import type { UserProfile } from '@/types/user';

interface ProfileEditModalProps {
  open: boolean;
  user: UserProfileResponseDto | UserProfile;
  onClose: () => void;
  onSave: (nickname: string, newAvatarDataUrl?: string) => Promise<void> | void;
  onOpenChangeEmail?: () => void;
  isSaving?: boolean;
}

/**
 * 프로필 정보 수정 모달 (06_UI_UX_GUIDELINES.md 4.6절)
 * - 1:1 원형 아바타 프리뷰 & 카메라 오버레이
 * - 고유 4자리 유저 태그(#1024) 연한 고정 표기
 * - 닉네임 유효성 검사 (2~10자)
 * - 이미지 선택 시 ProfileCropModal 연동
 */
export function ProfileEditModal({
  open,
  user,
  onClose,
  onSave,
  onOpenChangeEmail,
  isSaving = false,
}: ProfileEditModalProps) {
  useBodyScrollLock(open);

  const [nickname, setNickname] = useState(user.nickname);
  const [profileImage, setProfileImage] = useState(user.profileImage);
  const [hasNewAvatar, setHasNewAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 크롭 모달 상태
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setNickname(user.nickname);
      setProfileImage(user.profileImage);
      setHasNewAvatar(false);
      setErrorMessage('');
    }
  }, [open, user]);

  // 사진 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일(JPG, PNG, WebP 등)만 선택할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // 인풋 값 초기화 (동일 파일 재선택 가능)
    e.target.value = '';
  };

  // 크롭 완료 콜백
  const handleCropComplete = (croppedUrl: string) => {
    setProfileImage(croppedUrl);
    setHasNewAvatar(true);
    setCropModalOpen(false);
    toast.success('프로필 사진이 조절되었습니다.');
  };

  // 저장 제출 핸들러
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      setErrorMessage('닉네임은 2자 이상 10자 이하로 입력해 주세요.');
      return;
    }

    try {
      await onSave(trimmed, hasNewAvatar ? profileImage : undefined);
      toast.success('프로필 정보가 수정되었습니다.');
      onClose();
    } catch {
      // 에러 처리는 부모 컴포넌트 또는 Axios Interceptor에서 토스트 노출
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            {/* 배경 딤 */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* 모달 창 */}
            <motion.div
              className="relative w-full max-w-[420px] rounded-3xl border border-border bg-card p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-lg font-bold">프로필 수정</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-4 space-y-5">
                {/* 1:1 원형 프로필 아바타 + 카메라 변경 버튼 */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={profileImage}
                      alt="프로필 미리보기"
                      className="h-24 w-24 rounded-full bg-brand-100 object-cover ring-4 ring-brand-200 dark:ring-brand-700/60 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="프로필 사진 변경"
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-md ring-2 ring-background transition hover:bg-brand-600 active:scale-95"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    사진을 누르면 위치와 크기를 조절할 수 있어요
                  </p>
                </div>

                {/* 닉네임 입력 & 고유 유저 태그(#1024) 표기 */}
                <div>
                  <label
                    htmlFor="nickname-input"
                    className="block text-xs font-bold text-muted-foreground"
                  >
                    닉네임
                  </label>
                  <div className="relative mt-1.5 flex items-center">
                    <input
                      id="nickname-input"
                      type="text"
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      maxLength={10}
                      placeholder="2~10자 이내 닉네임"
                      className="h-12 w-full rounded-2xl border border-input bg-background px-4 pr-16 text-sm font-semibold transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <span className="pointer-events-none absolute right-4 rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground/80">
                      #{user.userTag}
                    </span>
                  </div>
                  {errorMessage ? (
                    <p className="mt-1 text-xs font-semibold text-destructive">{errorMessage}</p>
                  ) : (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      유저 태그(#{user.userTag})는 고유 식별 번호로 변경할 수 없습니다.
                    </p>
                  )}
                </div>

                {/* 이메일 (읽기 전용 안내 및 변경 바로가기) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-muted-foreground">
                      계정 이메일
                    </label>
                    {onOpenChangeEmail && (
                      <button
                        type="button"
                        onClick={onOpenChangeEmail}
                        className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-300"
                      >
                        이메일 변경
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 rounded-2xl bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground">
                    {user.email}
                  </p>
                </div>

                <div className="mt-6 flex flex-row justify-end gap-2 border-t border-border/60 pt-4">
                  <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-full">
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 저장 중...
                      </>
                    ) : (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" /> 저장 완료
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 크롭 모달 */}
      <ProfileCropModal
        open={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        onSelectAnother={() => fileInputRef.current?.click()}
      />
    </>
  );
}
