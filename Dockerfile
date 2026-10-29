# ==============================================================================
# Stage 1: Gradle Build Stage (Monorepo Root Context Fallback)
# ==============================================================================
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /app/backend

COPY backend/gradlew .
COPY backend/gradle ./gradle
COPY backend/build.gradle backend/settings.gradle ./

# Windows CRLF 개행 제거 및 실행 권한 부여
RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew

RUN ./gradlew dependencies --no-daemon || true

COPY backend/src ./src
RUN ./gradlew bootJar -x test --no-daemon -Dorg.gradle.jvmargs="-Xmx1024m -XX:MaxMetaspaceSize=512m"

# ==============================================================================
# Stage 2: Production Runtime Stage (Render 512MB RAM 최적화)
# ==============================================================================
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

ENV TZ=Asia/Seoul

COPY --from=builder /app/backend/build/libs/dduktak-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-Xmx350m", \
  "-Xms256m", \
  "-XX:MaxMetaspaceSize=128m", \
  "-XX:+UseSerialGC", \
  "-Duser.timezone=Asia/Seoul", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]

