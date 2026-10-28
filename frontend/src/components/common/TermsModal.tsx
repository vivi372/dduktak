import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, ShieldCheck, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBodyScrollLock } from '@/hooks';

export type TermsTab = 'terms' | 'privacy';

interface TermsModalProps {
  open: boolean;
  initialTab?: TermsTab;
  onClose: () => void;
}

/**
 * 서비스 이용약관 및 개인정보 처리방침 조회 모달 (USER-PAGE-05 & USER-02)
 * - 법률 문서 표준 양식에 준하는 진지한 어투 및 Pretendard 고딕 계열(font-sans) 적용
 * - 야놀자체 전면 배제 ([&_h1]:!font-sans [&_h2]:!font-sans [&_h3]:!font-sans)
 * - 핵심 서비스 정책: 1인 1냉장고 원칙, 양념류 차감 제외, 회원 탈퇴 시 레시피 익명 전환 보존 필수 정책
 */
export function TermsModal({ open, initialTab = 'terms', onClose }: TermsModalProps) {
  useBodyScrollLock(open, onClose);
  const [activeTab, setActiveTab] = useState<TermsTab>(initialTab);

  // 모달이 열릴 때마다 전달받은 initialTab으로 동기화
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="terms-modal-container"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-modal-title"
        >
          {/* 배경 딤 */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 모달 창 (내부 모든 제목 및 본문에 font-sans 강제 적용하여 야놀자체 배제) */}
          <motion.div
            className="relative flex flex-col w-full max-w-[540px] max-h-[85vh] rounded-3xl border border-border bg-card p-6 shadow-2xl dark:border-white/10 font-sans [&_h1]:!font-sans [&_h2]:!font-sans [&_h3]:!font-sans [&_h4]:!font-sans"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* 상단 헤더 & 닫기 버튼 */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-foreground">
                  {activeTab === 'terms' ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </div>
                <div>
                  <h2 id="terms-modal-title" className="text-base font-bold text-foreground">
                    {activeTab === 'terms' ? '서비스 이용약관' : '개인정보 처리방침'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    오늘의 뚝딱 운영 정책 및 법적 고지 사항
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95 transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 탭 전환 (Segmented Tab) */}
            <div className="mt-4 grid grid-cols-2 rounded-2xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeTab === 'terms'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>서비스 이용약관</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>개인정보 처리방침</span>
              </button>
            </div>

            {/* 본문 스크롤 영역 (격식 있는 법률 문서 어투) */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 text-xs text-muted-foreground leading-relaxed space-y-4 font-sans">
              {activeTab === 'terms' ? (
                /* ========================================================== */
                /* 1. 서비스 이용약관 전문                                    */
                /* ========================================================== */
                <div className="space-y-4">
                  <section className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-foreground">
                    <p className="font-bold text-[11px] text-brand-600 dark:text-brand-400 mb-1">
                      [핵심 정책 고지]
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      본 서비스('오늘의 뚝딱')는 1인 가구 대상 식재료 관리 및 맞춤 요리 솔루션입니다.
                      <strong> 회원 탈퇴 시 작성하신 레시피는 커뮤니티 생태계 보존 및 타 이용자의 스크랩 보호를 위해 삭제되지 않고 작성자 식별자를 영구 파기한 익명(user_id=null) 상태로 안전하게 전환되어 영구 보존됩니다.</strong>
                    </p>
                  </section>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">제1조 (목적)</h3>
                    <p>
                      본 약관은 '오늘의 뚝딱'(이하 "서비스")이 제공하는 식재료 관리, 소비기한 알림, 스마트 레시피 추천 및 커뮤니티 서비스의 이용과 관련하여 서비스 제공자와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">제2조 (1인 1냉장고 운영 원칙)</h3>
                    <p>
                      서비스는 1인 가구 식생활 관리에 특화된 서비스로서 1개 회원 계정당 1개의 독립된 내 냉장고 데이터베이스를 제공하며, 다인 공유 냉장고 기능은 지원하지 아니합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">제3조 (식재료 차감 연산 및 알림 서비스)</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>이용자가 레시피 조리를 완료 처리하는 경우, 냉장고 내 식재료는 소비기한이 가장 임박한 순서(선입선출, FIFO)에 따라 자동 차감 연산됩니다.</li>
                      <li>단, 소금, 설탕, 간장 등 <strong>양념 및 소스류 카테고리 식재료는 차감 연산 대상에서 자동 제외</strong>됩니다.</li>
                      <li>야간 푸시 발송 제한 정책에 따라 이용자가 지정한 방해금지 시간(기본 21:00 ~ 08:00)에는 푸시 알림 발송이 전면 중단됩니다.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5">
                    <h3 className="font-bold text-destructive text-xs mb-1">
                      제4조 (회원 탈퇴 및 작성 레시피의 익명 전환 보존에 관한 특칙)
                    </h3>
                    <p className="text-foreground font-medium mb-1.5">
                      회원 탈퇴 시 서비스 정책(USER-02)에 따라 관련 데이터는 다음과 같이 엄격히 구분하여 처리됩니다:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 text-foreground/90">
                      <li>
                        <strong>개인 데이터의 지체 없는 영구 파기 (Cascade Delete)</strong>: 회원의 개인 식별 정보(이메일, 비밀번호, 닉네임, 프로필 이미지), 내 냉장고 식재료 목록, 알림 내역, 스크랩북 및 좋아요 내역은 탈퇴 완료 즉시 복구 불가능한 방식으로 영구 파기됩니다.
                      </li>
                      <li>
                        <strong>작성 레시피의 익명 전환 보존 (Anonymization)</strong>: <em>회원 탈퇴 시 작성하신 레시피는 커뮤니티 생태계 보존 및 타 이용자의 스크랩 보호를 위해 삭제되지 않고 작성자 식별자를 영구 파기(user_id = NULL)하여 '익명 요리사'로 전환되어 영구 보존됩니다.</em>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">제5조 (게시물의 권리 및 이용자 의무)</h3>
                    <p>
                      회원이 서비스 내에 게시한 레시피 사진 및 조리법 텍스트의 저작권은 해당 작성자에게 귀속되며, 회원은 타인의 저작권 및 초상권 등 제반 권리를 침해하지 아니할 의무를 부담합니다.
                    </p>
                  </div>
                </div>
              ) : (
                /* ========================================================== */
                /* 2. 개인정보 처리방침 전문                                  */
                /* ========================================================== */
                <div className="space-y-4">
                  <section className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-foreground">
                    <p className="font-bold text-[11px] text-brand-600 dark:text-brand-400 mb-1">
                      [개인정보 처리 및 보안 원칙]
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      '오늘의 뚝딱'은 개인정보 보호법 등 관련 법령을 철저히 준수하며, 회원 탈퇴 시 이용자의 개인정보를 지체 없이 영구 파기합니다.
                    </p>
                  </section>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">1. 수집하는 개인정보 항목</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>이메일 회원가입 시</strong>: 이메일 주소, 비밀번호(일방향 암호화), 닉네임, 프로필 이미지(선택)</li>
                      <li><strong>소셜 계정 로그인 시 (Google)</strong>: 소셜 플랫폼 고유 식별자, 이메일 주소, 닉네임, 프로필 이미지</li>
                      <li><strong>서비스 이용 과정에서 생성되는 정보</strong>: 냉장고 식재료 등록 내역, 스크랩 및 좋아요 기록, 알림 환경설정 값</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">2. 개인정보의 수집 및 이용 목적</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>회원 본인 식별, 계정 보안 관리 및 중복 가입 방지</li>
                      <li>보유 식재료 기반 1초 맞춤 레시피 알고리즘 연산 및 소비기한 D-Day 알림 발송</li>
                      <li>커뮤니티 레시피 등록 및 이용자 간 상호작용 서비스 제공</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">3. 개인정보의 보유 및 파기 절차</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>이용자의 개인정보는 원칙적으로 회원 탈퇴 요청 시 지체 없이 데이터베이스에서 영구 삭제됩니다.</li>
                      <li>단, 탈퇴 시 작성한 레시피는 작성자 식별자를 전면 제거한 완전한 익명 데이터(user_id=null)로만 보존되며 어떠한 개인 식별 정보도 포함하지 않습니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-xs mb-1">4. 개인정보의 안전성 확보 조치</h3>
                    <p>
                      비밀번호는 일방향 해시 알고리즘을 통해 암호화되어 관리자를 포함한 제3자가 열람할 수 없으며, 모든 네트워크 데이터 송수신은 HTTPS 보안 프로토콜을 통하여 암호화 전송됩니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 닫기/확인 버튼 */}
            <div className="mt-5 pt-3.5 border-t border-border/80 flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={onClose}
                className="w-full sm:w-auto min-w-[100px] rounded-2xl font-bold flex items-center justify-center gap-1.5 shadow-soft"
              >
                <Check className="h-4 w-4" />
                <span>확인 완료</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
