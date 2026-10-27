import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadProfileAvatar, dataUrlToFile } from '@/services/storageService';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/services/supabaseClient';

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('storageService 단위 테스트', () => {
  const mockUpload = vi.fn();
  const mockGetPublicUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.storage.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });
  });

  it('dataUrlToFile은 DataURL을 올바른 File 객체로 변환해야 한다', () => {
    const dummyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const file = dataUrlToFile(dummyDataUrl, 'test.png');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.png');
    expect(file.type).toBe('image/png');
  });

  it('uploadProfileAvatar는 이미지를 압축한 후 profiles 버킷에 업로드하고 Public URL을 반환해야 한다', async () => {
    const dummyFile = new File(['dummy'], 'avatar.jpg', { type: 'image/jpeg' });
    const compressedFile = new File(['compressed'], 'avatar.webp', { type: 'image/webp' });

    (imageCompression as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(compressedFile);
    mockUpload.mockResolvedValue({
      data: { path: 'avatars/user-123_1792850000.webp' },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/profiles/avatars/user-123_1792850000.webp' },
    });

    const result = await uploadProfileAvatar('user-123', dummyFile);

    expect(imageCompression).toHaveBeenCalledWith(
      dummyFile,
      expect.objectContaining({
        maxSizeMB: 1.0,
        maxWidthOrHeight: 1080,
        fileType: 'image/webp',
      }),
    );
    expect(supabase.storage.from).toHaveBeenCalledWith('profiles');
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/user-123_\d+\.webp$/),
      compressedFile,
      expect.objectContaining({ upsert: true, contentType: 'image/webp' }),
    );
    expect(result).toBe('https://example.supabase.co/storage/v1/object/public/profiles/avatars/user-123_1792850000.webp');
  });

  it('Supabase 스토리지 업로드 에러 발생 시 예외를 던져야 한다', async () => {
    const dummyFile = new File(['dummy'], 'avatar.jpg', { type: 'image/jpeg' });
    (imageCompression as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(dummyFile);
    mockUpload.mockResolvedValue({
      data: null,
      error: { message: 'Storage bucket not found' },
    });

    await expect(uploadProfileAvatar('user-123', dummyFile)).rejects.toThrow('프로필 이미지 업로드 실패');
  });

  it('uploadRecipeImage는 이미지를 압축한 후 recipes 버킷에 업로드하고 Public URL을 반환해야 한다', async () => {
    const dummyFile = new File(['dummy'], 'recipe.jpg', { type: 'image/jpeg' });
    const compressedFile = new File(['compressed'], 'recipe.webp', { type: 'image/webp' });

    (imageCompression as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(compressedFile);
    mockUpload.mockResolvedValue({
      data: { path: 'thumbnails/1792850000_abc123.webp' },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/recipes/thumbnails/1792850000_abc123.webp' },
    });

    const result = await (await import('@/services/storageService')).uploadRecipeImage(dummyFile, 'thumbnails');

    expect(supabase.storage.from).toHaveBeenCalledWith('recipes');
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^thumbnails\/\d+_[a-z0-9]+\.webp$/),
      compressedFile,
      expect.objectContaining({ upsert: true, contentType: 'image/webp' }),
    );
    expect(result).toBe('https://example.supabase.co/storage/v1/object/public/recipes/thumbnails/1792850000_abc123.webp');
  });

  describe('extractStoragePathFromUrl 유틸리티 테스트', () => {
    it('Supabase Public URL에서 상대 경로를 정확히 파싱해야 한다', async () => {
      const { extractStoragePathFromUrl } = await import('@/services/storageService');
      const url = 'https://example.supabase.co/storage/v1/object/public/recipes/thumbnails/1792850000_abc.webp';
      expect(extractStoragePathFromUrl(url, 'recipes')).toBe('thumbnails/1792850000_abc.webp');
    });

    it('이미 상대 경로인 경우 그대로 반환해야 한다', async () => {
      const { extractStoragePathFromUrl } = await import('@/services/storageService');
      expect(extractStoragePathFromUrl('steps/step1.webp', 'recipes')).toBe('steps/step1.webp');
    });

    it('시드 기본 이미지(recipe_1.png, Default Profile.png)는 삭제 방지를 위해 null을 반환해야 한다', async () => {
      const { extractStoragePathFromUrl } = await import('@/services/storageService');
      expect(
        extractStoragePathFromUrl(
          'https://example.supabase.co/storage/v1/object/public/recipes/recipe_1.png',
          'recipes',
        ),
      ).toBeNull();
      expect(
        extractStoragePathFromUrl(
          'https://example.supabase.co/storage/v1/object/public/profiles/Default%20Profile.png',
          'profiles',
        ),
      ).toBeNull();
    });

    it('유효하지 않거나 빈 문자열인 경우 null을 반환해야 한다', async () => {
      const { extractStoragePathFromUrl } = await import('@/services/storageService');
      expect(extractStoragePathFromUrl('', 'recipes')).toBeNull();
      expect(extractStoragePathFromUrl(null, 'recipes')).toBeNull();
      expect(extractStoragePathFromUrl(undefined, 'recipes')).toBeNull();
    });
  });

  describe('deleteStorageFiles 일괄 삭제 테스트', () => {
    it('유효한 경로들만 필터링하여 supabase.storage.remove를 호출해야 한다', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      (supabase.storage.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        remove: mockRemove,
      });

      const { deleteStorageFiles } = await import('@/services/storageService');
      await deleteStorageFiles('recipes', [
        'https://example.supabase.co/storage/v1/object/public/recipes/thumbnails/test1.webp',
        'https://example.supabase.co/storage/v1/object/public/recipes/recipe_5.png', // 시드 보호 대상
        'steps/test2.webp',
        null,
      ]);

      expect(supabase.storage.from).toHaveBeenCalledWith('recipes');
      expect(mockRemove).toHaveBeenCalledWith(['thumbnails/test1.webp', 'steps/test2.webp']);
    });

    it('삭제 대상 파일이 없는 경우 remove를 호출하지 않아야 한다', async () => {
      const mockRemove = vi.fn();
      (supabase.storage.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        remove: mockRemove,
      });

      const { deleteStorageFiles } = await import('@/services/storageService');
      await deleteStorageFiles('recipes', [
        'https://example.supabase.co/storage/v1/object/public/recipes/recipe_1.png',
        null,
      ]);

      expect(mockRemove).not.toHaveBeenCalled();
    });
  });
});
