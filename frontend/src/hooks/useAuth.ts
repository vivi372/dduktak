/**
 * 인증 및 사용자 도메인 커스텀 훅 (02_ARCHITECTURE_AND_CONVENTIONS.md 3.3절 관심사 분리 철칙)
 *
 * UI 컴포넌트 내부에서 Raw Axios/Supabase 코드를 직접 호출하지 않고,
 * 본 훅을 통해 상태 조회 및 인증 관련 액션(로그인, 회원가입, 프로필 수정 등)을 수행합니다.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, resolveLoginProvider } from '@/store/useAuthStore';
import * as authApi from '@/services/authApi';
import { uploadProfileAvatar, deleteStorageFiles } from '@/services/storageService';
import { DEFAULT_AVATAR_URL } from '@/constants/images';
import type {
  UpdateProfileRequestDto,
  QuietTimeRequestDto,
  WithdrawRequestDto,
} from '@/types/auth';

/**
 * 전역 유저 인증 및 프로필 관리 훅
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    isInitialized,
    setUser,
    logout: storeLogout,
    syncProfile,
  } = useAuthStore();

  // 1. 프로필 상세 조회 쿼리 (인증 완료된 경우에만 실행)
  const profileQuery = useQuery({
    queryKey: ['auth', 'profile', user?.userId],
    queryFn: async () => {
      const data = await authApi.getMyProfile();
      const loginProvider = resolveLoginProvider(session, user?.loginProvider);
      const updated = { ...data, loginProvider };
      setUser(updated);
      return updated;
    },
    enabled: isAuthenticated && Boolean(user?.userId),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  // 2. 이메일 로그인 뮤테이션
  const loginWithEmailMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const data = await authApi.signInWithEmail(email, password);
      return data;
    },
  });

  // 3. 이메일 회원가입 뮤테이션
  const signupWithEmailMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      nickname,
    }: {
      email: string;
      password: string;
      nickname: string;
    }) => {
      const data = await authApi.signUpWithEmail(email, password, nickname);
      return data;
    },
  });

  // 4. 소셜 OAuth 로그인
  const loginWithOAuth = async (provider: 'google') => {
    return authApi.signInWithOAuth(provider);
  };

  // 5. 비밀번호 재설정 이메일 발송
  const sendPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return authApi.sendPasswordResetEmail(email);
    },
  });

  // 5-1. 비밀번호 재설정 6자리 OTP 인증코드 검증
  const verifyPasswordResetOtpMutation = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      return authApi.verifyPasswordResetOtp(email, token);
    },
  });

  // 6. 로그아웃 뮤테이션
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await storeLogout();
      queryClient.clear();
    },
  });

  // 7. 프로필 수정 뮤테이션
  const updateProfileMutation = useMutation({
    mutationFn: async (dto: UpdateProfileRequestDto) => {
      const updated = await authApi.updateMyProfile(dto);
      await syncProfile();
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  // 8. 프로필 아바타 이미지 압축 & Supabase Storage 직업로드 후 프로필 수정 (방안 3 적용: 에러 시 롤백 및 이전 이미지 버킷 정리)
  const updateProfileWithAvatarMutation = useMutation({
    mutationFn: async ({
      nickname,
      avatarFileOrDataUrl,
    }: {
      nickname: string;
      avatarFileOrDataUrl?: File | Blob | string;
    }) => {
      let profileImageUrl = user?.profileImage;
      const oldProfileImage = user?.profileImage;
      let newlyUploadedUrl: string | null = null;

      try {
        // 새 이미지가 전달된 경우 Supabase Storage 직업로드 수행 (기본 이미지로 리셋인 경우 업로드 스킵)
        if (avatarFileOrDataUrl && user?.userId) {
          if (
            typeof avatarFileOrDataUrl === 'string' &&
            (avatarFileOrDataUrl === DEFAULT_AVATAR_URL ||
              avatarFileOrDataUrl.includes('Default%20Profile.png') ||
              avatarFileOrDataUrl.includes('Default Profile.png'))
          ) {
            profileImageUrl = DEFAULT_AVATAR_URL;
          } else {
            profileImageUrl = await uploadProfileAvatar(user.userId, avatarFileOrDataUrl);
            newlyUploadedUrl = profileImageUrl;
          }
        }

        const updated = await authApi.updateMyProfile({
          nickname,
          profileImage: profileImageUrl,
        });
        await syncProfile();

        // 수정 성공 시: 기존 이미지가 시드가 아니고 새 이미지/디폴트 이미지로 교체된 경우 버킷에서 정리
        if (oldProfileImage && profileImageUrl && oldProfileImage !== profileImageUrl) {
          deleteStorageFiles('profiles', [oldProfileImage]);
        }

        return updated;
      } catch (err) {
        // 백엔드 에러 발생 시: 방금 업로드된 새 프로필 이미지를 즉시 롤백 삭제
        if (newlyUploadedUrl) {
          await deleteStorageFiles('profiles', [newlyUploadedUrl]);
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  // 9. 야간 방해금지 시간 수정 뮤테이션
  const updateQuietTimeMutation = useMutation({
    mutationFn: async (dto: QuietTimeRequestDto) => {
      const updated = await authApi.updateQuietTime(dto);
      await syncProfile();
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  // 10. 회원 탈퇴 뮤테이션 (USER-02 및 버킷 프로필 이미지 정리)
  const withdrawMutation = useMutation({
    mutationFn: async (dto?: WithdrawRequestDto) => {
      const avatarToDelete = user?.profileImage;
      await authApi.withdraw(dto);
      if (avatarToDelete) {
        deleteStorageFiles('profiles', [avatarToDelete]);
      }
      await storeLogout();
      queryClient.clear();
    },
  });

  return {
    // 세션 및 상태
    user,
    session,
    isAuthenticated,
    isLoading: isLoading || profileQuery.isLoading,
    isInitialized,
    loginProvider: resolveLoginProvider(session, user?.loginProvider),

    // 액션 및 뮤테이션
    loginWithEmail: loginWithEmailMutation.mutateAsync,
    isLoggingIn: loginWithEmailMutation.isPending,

    signupWithEmail: signupWithEmailMutation.mutateAsync,
    isSigningUp: signupWithEmailMutation.isPending,

    loginWithOAuth,

    sendPasswordReset: sendPasswordResetMutation.mutateAsync,
    isSendingReset: sendPasswordResetMutation.isPending,

    verifyPasswordResetOtp: verifyPasswordResetOtpMutation.mutateAsync,
    isVerifyingResetOtp: verifyPasswordResetOtpMutation.isPending,

    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,

    updateProfileWithAvatar: updateProfileWithAvatarMutation.mutateAsync,
    isUpdatingProfileWithAvatar: updateProfileWithAvatarMutation.isPending,

    updateQuietTime: updateQuietTimeMutation.mutateAsync,
    isUpdatingQuietTime: updateQuietTimeMutation.isPending,

    withdraw: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,

    // 리프레시
    refetchProfile: syncProfile,
  };
}
