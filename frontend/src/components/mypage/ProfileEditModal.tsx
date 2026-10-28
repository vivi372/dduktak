import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, X, Info, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProfileCropModal } from './ProfileCropModal';
import { useBodyScrollLock } from '@/hooks';
import { DEFAULT_AVATAR_URL } from '@/constants/images';
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
 * - 사진 삭제(기본 이미지로 변경) 및 디폴트 이미지 미리보기 안전 폴백
 */
export function ProfileEditModal({
  open,
  user,
  onClose,
  onSave,
  onOpenChangeEmail,
  isSaving = false,
}: ProfileEditModalProps) {
  useBodyScrollLock(open, onClose);

  const initialAvatar = user.profileImage || DEFAULT_AVATAR_URL;
  const [nickname, setNickname] = useState(user.nickname);
  const [profileImage, setProfileImage] = useState(initialAvatar);
  const [hasNewAvatar, setHasNewAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 크롭 모달 상태
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 기본 프로필 이미지 여부 판별
  const isDefaultAvatar =
    !profileImage ||
    profileImage === DEFAULT_AVATAR_URL ||
    profileImage.includes('Default%20Profile.png') ||
    profileImage.includes('Default Profile.png');

  const prevOpenRef = useRef(false);

  useEffect(() => {
    // 모달이 새로 열릴 때(false -> true)에만 초기화
    if (open && !prevOpenRef.current) {
      setNickname(user.nickname);
      setProfileImage(user.profileImage || DEFAULT_AVATAR_URL);
      setHasNewAvatar(false);
      setErrorMessage('');
    }
    prevOpenRef.current = open;
  }, [open, user.nickname, user.profileImage]);

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

  // 사진 삭제 (기본 프로필 이미지로 변경) 핸들러
  const handleDeleteAvatar = () => {
    setProfileImage(DEFAULT_AVATAR_URL);
    setHasNewAvatar(true);
    toast.info('기본 프로필 이미지로 설정되었습니다.');
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
      await onSave(trimmed, hasNewAvatar ? (profileImage || DEFAULT_AVATAR_URL) : undefined);
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
          <motion.div
            key="profile-edit-modal-container"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
          >
            {/* 배경 딤 */}
            <div
              className="fixed inset-0 bg-black/60"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* 모달 창 */}
            <motion.div
              className="relative w-full max-w-[420px] rounded-3xl border border-border bg-card p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
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
                {/* 1:1 원형 프로필 아바타 + 사진 변경 및 사진 삭제 버튼 */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={profileImage || DEFAULT_AVATAR_URL}
                      alt="프로필 미리보기"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR_URL;
                      }}
                      className="h-24 w-24 rounded-full bg-brand-100 object-cover ring-4 ring-brand-200 dark:ring-brand-700/60 shadow-md"
                    />

                    {/* 사진 변경(카메라) 버튼 */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="프로필 사진 변경"
                      title="프로필 사진 변경"
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-md ring-2 ring-background transition hover:bg-brand-600 active:scale-95"
                    >
                      <Camera className="h-4 w-4" />
                    </button>

                    {/* 사진 삭제(기본 이미지로) 버튼 - 커스텀 이미지일 때 표시 */}
                    {!isDefaultAvatar && (
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        aria-label="사진 삭제 (기본 이미지로 변경)"
                        title="사진 삭제 (기본 이미지로 변경)"
                        className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow-md ring-2 ring-background transition hover:bg-destructive/90 active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* 하단 보조 안내 및 바로가기 */}
                  <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
                    {!isDefaultAvatar ? (
                      <>
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/20 transition active:scale-95"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>사진 삭제 (기본 이미지로)</span>
                        </button>
                        <span className="text-xs text-muted-foreground/70">
                          또는 카메라를 눌러 교체하세요
                        </span>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        카메라 버튼을 눌러 사진을 등록할 수 있어요
                      </p>
                    )}
                  </div>
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
                    {onOpenChangeEmail && (!('loginProvider' in user) || user.loginProvider === 'email') ? (
                      <button
                        type="button"
                        onClick={onOpenChangeEmail}
                        className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-300"
                      >
                        이메일 변경
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground/70">
                        소셜 연동 계정
                      </span>
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
          </motion.div>
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
