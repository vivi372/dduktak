# 🍳 오늘의 뚝딱 (Dduktak)

> **1인 가구를 위한 냉장고 관리 및 맞춤 요리 솔루션 서비스**
> 잔반 최소화, 식비 절감, 최적 레시피 매칭 및 유저 간 공유 플랫폼

---

## 📁 프로젝트 구조 (Monorepo)

```text
dduktak/
├── .agent/            # AI 에이전트 설계 명세서 및 작업 이력
│   ├── logs/          # 일자별 작업 로그
│   └── *.md           # 아키텍처, DB, API, UI/UX 등 18개 명세 문서
├── backend/           # Spring Boot 3.x (Java 17/21) 백엔드 API 서버
└── frontend/          # React 18 + TypeScript + Vite + Tailwind CSS 웹 클라이언트
```

---

## 🛠 기술 스택

### 백엔드 (Backend)
- **Language**: Java 17 (Java 21 호환)
- **Framework**: Spring Boot 3.3.x
- **Persistence**: MyBatis 3.x (@Mapper + XML Mapper)
- **Database**: PostgreSQL (Supabase)
- **Security & Auth**: Spring Security + jjwt
- **Tracing**: Spring AOP + log4jdbc-log4j2

### 프론트엔드 (Frontend)
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand (클라이언트 상태) + TanStack React Query (서버 상태)
- **Form/Validation**: react-hook-form + zod
- **UI Components**: lucide-react, sonner, framer-motion

---

## 🚀 빠른 시작 (Quick Start)

### Backend
```bash
cd backend
./gradlew bootRun
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
