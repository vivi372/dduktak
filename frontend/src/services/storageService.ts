/**
 * Supabase Storage 클라이언트 직업로드 서비스 (01_TECH_STACK_AND_LIBS.md 5.1절)
 *
 * [원칙]:
 * 1. 클라이언트 단에서 browser-image-compression을 사용해 1MB 이하(WebP, 가로 1080px 기준)로 압축 및 리사이징
 * 2. Render 백엔드 서버(512MB RAM 제약)의 메모리/트래픽 부하 및 OOM 방지를 위해 클라이언트에서 Supabase Storage로 직접 업로드
 * 3. 업로드 성공 후 반환된 Public URL만 백엔드 DTO에 전달하여 저장
 */

import imageCompression, { type Options as CompressionOptions } from 'browser-image-compression';
import { supabase } from '@/services/supabaseClient';

/** DataURL 문자열을 File 객체로 변환하는 유틸리티 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/** 이미지 압축 기본 옵션 (1MB 이하, 1080px, WebP 변환) */
const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeMB: 1.0,
  maxWidthOrHeight: 1080,
  useWebWorker: true,
  fileType: 'image/webp',
  initialQuality: 0.85,
};

/**
 * 프로필 아바타 이미지 압축 및 Supabase Storage 'profiles' 버킷 업로드
 *
 * @param userId 로그인 사용자 UUID (경로 및 식별용)
 * @param fileOrDataUrl 원본 파일 객체 또는 크롭 캔버스 DataURL
 * @returns Supabase Storage에 영구 보관된 Public URL 문자열
 */
export async function uploadProfileAvatar(
  userId: string,
  fileOrDataUrl: File | Blob | string,
): Promise<string> {
  // 1. DataURL인 경우 File 객체로 변환
  const sourceFile: File =
    typeof fileOrDataUrl === 'string'
      ? dataUrlToFile(fileOrDataUrl, `avatar_${userId}.jpg`)
      : fileOrDataUrl instanceof File
        ? fileOrDataUrl
        : new File([fileOrDataUrl], `avatar_${userId}.webp`, { type: 'image/webp' });

  // 2. browser-image-compression을 통한 1MB 이하 압축
  const compressedFile = await imageCompression(sourceFile, DEFAULT_COMPRESSION_OPTIONS);

  // 3. 고유 파일 경로 생성 (캐시 방지 타임스탬프)
  const timestamp = Date.now();
  const filePath = `avatars/${userId}_${timestamp}.webp`;

  // 4. Supabase Storage 'profiles' 버킷 직업로드
  const { data, error } = await supabase.storage.from('profiles').upload(filePath, compressedFile, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'image/webp',
  });

  if (error) {
    throw new Error(`프로필 이미지 업로드 실패: ${error.message}`);
  }

  // 5. Public URL 추출 및 반환
  const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * 레시피 대표 썸네일 또는 조리 Step 이미지 압축 및 Supabase Storage 'recipes' 버킷 업로드 (01_TECH_STACK_AND_LIBS.md 5.1절)
 *
 * @param fileOrDataUrl 원본 파일 객체 또는 DataURL
 * @param pathPrefix 'thumbnails' | 'steps' 경로 접두사
 * @returns Supabase Storage Public URL 문자열
 */
export async function uploadRecipeImage(
  fileOrDataUrl: File | Blob | string,
  pathPrefix: 'thumbnails' | 'steps' = 'thumbnails',
): Promise<string> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sourceFile: File =
    typeof fileOrDataUrl === 'string'
      ? dataUrlToFile(fileOrDataUrl, `${pathPrefix}_${timestamp}.jpg`)
      : fileOrDataUrl instanceof File
        ? fileOrDataUrl
        : new File([fileOrDataUrl], `${pathPrefix}_${timestamp}.webp`, { type: 'image/webp' });

  // browser-image-compression을 통한 1MB 이하 압축 (WebP, 가로 1080px 기준)
  const compressedFile = await imageCompression(sourceFile, DEFAULT_COMPRESSION_OPTIONS);

  // 고유 파일 경로 생성
  const filePath = `${pathPrefix}/${timestamp}_${randomSuffix}.webp`;

  // Supabase Storage 'recipes' 버킷 직업로드
  const { data, error } = await supabase.storage.from('recipes').upload(filePath, compressedFile, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'image/webp',
  });

  if (error) {
    throw new Error(`레시피 이미지 업로드 실패: ${error.message}`);
  }

  // Public URL 추출 및 반환
  const { data: publicUrlData } = supabase.storage.from('recipes').getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

/**
 * Supabase Storage Public URL에서 버킷 내부 상대 파일 경로를 안전하게 추출
 * - 시드 레시피 기본 이미지(recipe_1.png ~ recipe_30.png) 등 공용 자산은 삭제되지 않도록 null 반환
 *
 * @param urlOrPath Public URL 또는 스토리지 파일 상대 경로
 * @param bucket 버킷명 (기본: 'recipes')
 * @returns 버킷 내 상대 파일 경로 또는 null
 */
export function extractStoragePathFromUrl(
  urlOrPath?: string | null,
  bucket: string = 'recipes',
): string | null {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  // 1. 공용 시드 이미지 보호 (예: recipe_1.png, recipe_30.png, Default Profile.png)
  if (/recipe_\d+\.png$/i.test(urlOrPath) || urlOrPath.includes('Default%20Profile.png')) {
    return null;
  }

  // 2. 이미 상대 경로인 경우 (예: 'thumbnails/1234_abc.webp', 'steps/1234_abc.webp')
  if (urlOrPath.startsWith('thumbnails/') || urlOrPath.startsWith('steps/') || urlOrPath.startsWith('avatars/')) {
    return urlOrPath;
  }

  // 3. Supabase Public URL 파싱 (예: .../storage/v1/object/public/recipes/thumbnails/...)
  const prefix = `/storage/v1/object/public/${bucket}/`;
  const idx = urlOrPath.indexOf(prefix);
  if (idx !== -1) {
    const relativePath = decodeURIComponent(urlOrPath.substring(idx + prefix.length));
    return relativePath.trim() !== '' ? relativePath : null;
  }

  return null;
}

/**
 * Supabase Storage 버킷에서 지정된 파일들을 일괄 삭제 (고아 이미지 정리 및 롤백용)
 *
 * @param bucket 버킷명 ('recipes' | 'profiles')
 * @param filePathsOrUrls 삭제 대상 URL 또는 상대 파일 경로 배열
 */
export async function deleteStorageFiles(
  bucket: string,
  filePathsOrUrls: (string | null | undefined)[],
): Promise<void> {
  const targetPaths = Array.from(
    new Set(
      filePathsOrUrls
        .map((item) => extractStoragePathFromUrl(item, bucket))
        .filter((path): path is string => Boolean(path)),
    ),
  );

  if (targetPaths.length === 0) return;

  try {
    const { error } = await supabase.storage.from(bucket).remove(targetPaths);
    if (error) {
      console.warn(`[StorageService] 이미지 삭제 경고 (${bucket}):`, error.message);
    }
  } catch (err) {
    console.warn(`[StorageService] 이미지 삭제 중 예외 발생 (${bucket}):`, err);
  }
}

