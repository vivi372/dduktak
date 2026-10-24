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
});
