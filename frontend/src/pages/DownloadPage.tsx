import React, { useState } from 'react';
import { Download, Smartphone, Wifi, CheckCircle2, Copy, Check, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import logoIcon from '@/assets/logo-icon.png';

/**
 * 모바일 실기기 테스트용 APK 다운로드 전용 페이지 (/download)
 * - 사용자가 스마트폰 브라우저로 접속하여 원클릭으로 최신 APK를 다운로드할 수 있도록 지원
 * - 안드로이드 실기기 설치 안내 가이드 및 동일 Wi-Fi 연결 주의사항 제공
 */
export const DownloadPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // 현재 브라우저 URL 또는 로컬 네트워크 IP 기준 다운로드 주소
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://dduktak-one.vercel.app/download';
  const appVersion = 'v1.1.0';
  const apkFileName = `dduktak-app-${appVersion}.apk`;
  const apkDownloadPath = `/downloads/${apkFileName}?v=1.1.0`;
  const apiServerUrl = import.meta.env.VITE_API_BASE_URL || 'https://dduktak.onrender.com';

  /** 스마트폰 접속 주소 클립보드 복사 */
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('다운로드 페이지 링크가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-gray-50/80 px-4 py-8 pb-20">
      <div className="mx-auto max-w-md">
        {/* 상단 앱 브랜딩 & 로고 */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-md ring-1 ring-orange-100">
            <img src={logoIcon} alt="오늘의 뚝딱" className="h-full w-full object-contain" />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Android
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">오늘의 뚝딱</h1>
          <p className="mt-1 text-sm text-gray-500">1인 가구를 위한 냉장고 파먹기 & 맞춤 요리 솔루션</p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>실기기 테스트용 디버그 빌드 ({appVersion} · Build #2)</span>
          </div>
        </div>

        {/* APK 다운로드 메인 CTA 카드 */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <p className="text-xs font-medium text-gray-400">설치 파일 ({appVersion})</p>
              <p className="text-sm font-bold text-gray-800">{apkFileName}</p>
            </div>
            <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-600 ring-1 ring-inset ring-brand-500/20">
              {appVersion} 최신
            </span>
          </div>

          <div className="mt-4">
            <a
              href={apkDownloadPath}
              download={apkFileName}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-base font-black text-white shadow-soft transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <Download className="h-5 w-5 text-white stroke-[2.5]" />
              <span className="text-white font-black tracking-wide">최신 APK 다운로드 ({appVersion})</span>
            </a>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              * 스마트폰 다운로드 폴더에 <strong>{apkFileName}</strong> 이름으로 저장됩니다.
            </p>
          </div>

          {/* v1.1.0 패치 노트 요약 배너 */}
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-[11px] text-emerald-900">
            <span className="flex items-center gap-1 font-bold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              {appVersion} 업데이트 내역 (Cycle 2 패치 반영)
            </span>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-emerald-800">
              <li>소셜 푸시 알림(좋아요/요리완료) 탭 시 해당 레시피 상세 화면 딥링크 이동</li>
              <li>모든 모달/바텀시트 오픈 시 안드로이드 물리 뒤로가기 버튼으로 닫기 지원</li>
              <li>레시피 요리 완료 시 수동 조절한 식재료 차감 수량 서버 정확 반영</li>
            </ul>
          </div>

          {/* .zip 다운로드 시 대처 팁 배너 */}
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50/70 p-2.5 text-[11px] text-orange-800">
            <span className="font-bold">💡 혹시 .zip 파일로 다운로드되나요?</span>
            <p className="mt-0.5 text-orange-700">
              삼성 인터넷 등 일부 브라우저가 .apk를 .zip으로 바꿀 수 있습니다. 파일 관리자에서 <strong>이름 변경</strong>을 눌러 끝의 <code>.zip</code>을 <code>.apk</code>로 수정하면 바로 설치됩니다.
            </p>
          </div>

          {/* 모바일 접속 편의 링크 복사 */}
          <div className="mt-4 rounded-xl bg-gray-50 p-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1 font-medium">
                <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                스마트폰 브라우저 접속 주소:
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? '복사됨' : '주소 복사'}</span>
              </button>
            </div>
            <p className="mt-1.5 break-all font-mono text-xs text-gray-700">{currentUrl}</p>
          </div>
        </div>

        {/* 동일 Wi-Fi 네트워크 확인 중요 안내 */}
        <div className="mt-4 rounded-2xl bg-amber-50/80 p-4 ring-1 ring-amber-200/70">
          <div className="flex gap-3">
            <Wifi className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-xs text-amber-900">
              <p className="font-bold">⚠️ 동일 Wi-Fi 네트워크 필수 확인</p>
              <p className="mt-1 leading-relaxed text-amber-800">
                스마트폰이 개발용 PC와 <strong>동일한 Wi-Fi 공유기</strong>에 연결되어 있어야 로컬 백엔드 서버
                (<code className="rounded bg-amber-100 px-1 py-0.5 font-mono font-semibold">{apiServerUrl}</code>)와
                정상적으로 통신할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 3단계 스마트폰 설치 가이드 */}
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <FileText className="h-4 w-4 text-brand-600" />
            <span>안드로이드 설치 가이드 (3단계)</span>
          </h2>

          <div className="mt-3 space-y-2.5">
            <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-brand-600">
                1
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-semibold text-gray-800">APK 다운로드 및 확인</p>
                <p className="mt-0.5 text-gray-500">
                  위 버튼을 눌러 다운로드 시 <span className="font-semibold text-gray-700">"유해한 파일일 수 있음"</span> 경고가 표시되면 <span className="font-semibold text-brand-600">"무조건 다운로드"</span>를 선택하세요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-brand-600">
                2
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-semibold text-gray-800">출처를 알 수 없는 앱 허용</p>
                <p className="mt-0.5 text-gray-500">
                  다운로드된 파일을 탭할 때 보안 팝업이 뜨면 <span className="font-semibold text-gray-700">[설정]</span> ➔ <span className="font-semibold text-gray-700">[이 출처의 앱 허용]</span> 토글을 켜주세요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-brand-600">
                3
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-semibold text-gray-800">설치 완료 및 앱 실행</p>
                <p className="mt-0.5 text-gray-500">
                  기존 앱이 설치되어 있다면 <span className="font-semibold text-gray-700">[업데이트]</span>를 눌러 덮어쓰기 설치하세요. 설치 후 <span className="font-semibold text-brand-600">[열기]</span>를 눌러 테스트를 시작하세요!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 빌드 환경 정보 */}
        <div className="mt-6 rounded-xl bg-gray-50 p-3.5 text-[11px] text-gray-500">
          <p className="font-semibold text-gray-600">📌 디버그 환경 정보</p>
          <div className="mt-1.5 space-y-1">
            <div className="flex justify-between">
              <span>패키지명 / 버전:</span>
              <span className="font-mono text-gray-700">com.dduktak.app ({appVersion} / versionCode 2)</span>
            </div>
            <div className="flex justify-between">
              <span>API 엔드포인트:</span>
              <span className="font-mono text-gray-700">{apiServerUrl}</span>
            </div>
            <div className="flex justify-between">
              <span>카메라/영수증:</span>
              <span className="font-semibold text-emerald-600">Gemini Flash OCR 지원</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
