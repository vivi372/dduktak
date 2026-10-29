# ==============================================================================
# Stage 1: Gradle Build Stage (Java 17)
# ==============================================================================
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /app

# Gradle Wrapper 및 설정 파일 먼저 복사 (레이어 캐싱 활용)
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Windows CRLF 개행 제거 및 실행 권한 부여
RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew

# 의존성 다운로드 캐싱
RUN ./gradlew dependencies --no-daemon || true

# 소스 코드 복사 및 실행 가능한 BootJar 빌드 (테스트 제외, 메모리 제한 적용)
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon -Dorg.gradle.jvmargs="-Xmx1024m -XX:MaxMetaspaceSize=512m"

# ==============================================================================
# Stage 2: Production Runtime Stage (Render 512MB RAM 최적화)
# ==============================================================================
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# 타임존 KST(Asia/Seoul) 고정 (소비기한 배치 및 로그 타임스탬프 정합성)
ENV TZ=Asia/Seoul

# 빌드된 JAR 복사
COPY --from=builder /app/build/libs/dduktak-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Render Free Tier (512MB RAM) OOM 방지를 위한 JVM 메모리 및 SerialGC 최적화
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-Xmx350m", \
  "-Xms256m", \
  "-XX:MaxMetaspaceSize=128m", \
  "-XX:+UseSerialGC", \
  "-Duser.timezone=Asia/Seoul", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]

