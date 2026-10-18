package com.dduktak.global.aspect;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 전역 AOP 기반 로깅 및 SLF4J MDC Trace ID 추적 어스펙트
 * 컨트롤러와 서비스 계층의 메서드 진입/이탈(매개변수, 반환값, 실행 시간 ms)을 계측하고,
 * 6자리 무작위 Trace ID를 발급·전파하며 민감 정보 평문 노출을 방지합니다.
 */
@Slf4j
@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LoggingAspect {

    /**
     * SLF4J MDC 내 Trace ID 저장 키 이름
     */
    public static final String TRACE_ID_KEY = "traceId";

    /**
     * Trace ID 자릿수 (6자리 무작위 영숫자)
     */
    private static final int TRACE_ID_LENGTH = 6;

    /**
     * 파라미터명 기준 민감 정보 키워드 목록 (소문자 비교)
     */
    private static final Set<String> SENSITIVE_PARAM_KEYWORDS = Set.of(
            "password", "pwd", "passwd", "newpassword", "currentpassword",
            "token", "accesstoken", "refreshtoken",
            "secret", "secretkey", "credential", "auth", "authorization",
            "apikey", "residentnumber", "creditcard"
    );

    /**
     * DTO toString() 또는 JSON 형식 문자열 내 민감 정보 탐색용 정규표현식
     */
    private static final Pattern SENSITIVE_STRING_PATTERN = Pattern.compile(
            "(?i)(password|pwd|passwd|newPassword|currentPassword|token|accessToken|refreshToken|secret|secretKey|credential|authorization|apiKey)\\s*[:=]\\s*['\"]?([^'\",})\\s]+)['\"]?"
    );

    /**
     * JWT 토큰 문자열 패턴 (Bearer 접두사 포함 또는 순수 JWT)
     */
    private static final Pattern JWT_TOKEN_PATTERN = Pattern.compile(
            "^(Bearer\\s+)?ey[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$"
    );

    /**
     * 컨트롤러 계층 포인트컷: domain 패키지 내 Controller 및 모든 @RestController / @Controller
     */
    @Pointcut("execution(* com.dduktak.domain..*Controller.*(..)) || " +
              "execution(* com.dduktak..*Controller.*(..)) || " +
              "@within(org.springframework.web.bind.annotation.RestController) || " +
              "@within(org.springframework.stereotype.Controller)")
    public void controllerPointcut() {}

    /**
     * 서비스 계층 포인트컷: domain 패키지 내 Service 및 모든 @Service
     */
    @Pointcut("execution(* com.dduktak.domain..*Service.*(..)) || " +
              "execution(* com.dduktak..*Service.*(..)) || " +
              "@within(org.springframework.stereotype.Service)")
    public void servicePointcut() {}

    /**
     * 컨트롤러 및 서비스 계층 통합 AOP 실행 어드바이스
     * 요청 진입 시 Trace ID 발급, 메서드 파라미터 마스킹 로깅,
     * 정상 종료 시 반환값 및 수행 시간(ms) 로깅, 예외 발생 시 에러 로깅,
     * 최초 진입점 종료 시 MDC.clear() 호출을 보장합니다.
     */
    @Around("controllerPointcut() || servicePointcut()")
    public Object logExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        boolean isRoot = false;
        String currentTraceId = MDC.get(TRACE_ID_KEY);

        // MDC에 Trace ID가 없는 경우(최초 진입점) 6자리 신규 Trace ID 발급
        if (currentTraceId == null || currentTraceId.isBlank()) {
            currentTraceId = generateTraceId();
            MDC.put(TRACE_ID_KEY, currentTraceId);
            isRoot = true;
        }

        String layer = resolveLayer(joinPoint);
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        long startTime = System.currentTimeMillis();

        try {
            // 1. 메서드 진입 로깅 (매개변수 마스킹 적용)
            String maskedArgs = maskArguments(joinPoint);
            log.info("--> [START] [{}] {}.{}({})", layer, className, methodName, maskedArgs);

            // 타겟 메서드 실행
            Object result = joinPoint.proceed();

            // 2. 메서드 정상 이탈 로깅 (실행 시간 ms 및 반환값 마스킹 적용)
            long executionTime = System.currentTimeMillis() - startTime;
            String maskedResult = maskReturnValue(result);
            log.info("<-- [END] [{}] {}.{}() - {}ms | Return: {}", layer, className, methodName, executionTime, maskedResult);

            return result;
        } catch (Throwable t) {
            // 3. 메서드 예외 발생 로깅
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("<-- [ERROR] [{}] {}.{}() - {}ms | Exception: {} - {}",
                    layer, className, methodName, executionTime, t.getClass().getSimpleName(), t.getMessage());
            throw t;
        } finally {
            // 4. 최초 진입점인 경우에만 MDC를 정리하여 스레드 재사용 시 컨텍스트 오염 방지
            if (isRoot) {
                MDC.clear();
            }
        }
    }

    /**
     * 6자리 무작위 영숫자 Trace ID 생성 (예: 'A3F8B1')
     */
    private String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, TRACE_ID_LENGTH).toUpperCase();
    }

    /**
     * 클래스명 및 어노테이션 기반 실행 계층 식별 (CONTROLLER / SERVICE)
     */
    private String resolveLayer(ProceedingJoinPoint joinPoint) {
        Class<?> declaringType = joinPoint.getSignature().getDeclaringType();
        String simpleName = declaringType.getSimpleName();

        if (simpleName.endsWith("Controller") ||
                declaringType.isAnnotationPresent(org.springframework.web.bind.annotation.RestController.class) ||
                declaringType.isAnnotationPresent(org.springframework.stereotype.Controller.class)) {
            return "CONTROLLER";
        }
        if (simpleName.endsWith("Service") ||
                declaringType.isAnnotationPresent(org.springframework.stereotype.Service.class)) {
            return "SERVICE";
        }
        return "COMPONENT";
    }

    /**
     * 메서드 파라미터 목록을 순회하여 민감 정보 마스킹 및 포맷팅 처리
     */
    private String maskArguments(ProceedingJoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args == null || args.length == 0) {
            return "";
        }

        String[] paramNames = null;
        if (joinPoint.getSignature() instanceof MethodSignature methodSignature) {
            paramNames = methodSignature.getParameterNames();
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < args.length; i++) {
            if (i > 0) {
                sb.append(", ");
            }
            String paramName = (paramNames != null && paramNames.length > i && paramNames[i] != null)
                    ? paramNames[i]
                    : "arg" + i;
            sb.append(paramName).append("=");
            sb.append(maskSingleValue(paramName, args[i]));
        }
        return sb.toString();
    }

    /**
     * 단일 파라미터 값에 대한 민감 정보 및 직렬화 위험 객체 안전 마스킹
     */
    private String maskSingleValue(String paramName, Object value) {
        if (value == null) {
            return "null";
        }

        // 파라미터명이 민감 정보 키워드에 포함된 경우 즉시 마스킹
        if (isSensitiveParamName(paramName)) {
            return "****";
        }

        // 대용량 또는 순환 참조 위험이 있는 웹 인프라 객체 요약 처리
        if (value instanceof HttpServletRequest) {
            return "[HttpServletRequest]";
        }
        if (value instanceof HttpServletResponse) {
            return "[HttpServletResponse]";
        }
        if (value instanceof HttpSession) {
            return "[HttpSession]";
        }
        if (value instanceof BindingResult bindingResult) {
            return String.format("[BindingResult: %d errors]", bindingResult.getErrorCount());
        }
        if (value instanceof MultipartFile file) {
            return String.format("[MultipartFile: %s, %d bytes]", file.getOriginalFilename(), file.getSize());
        }
        if (value instanceof MultipartFile[] files) {
            return String.format("[MultipartFile[] count=%d]", files.length);
        }

        // 문자열 자체가 JWT 토큰인 경우 마스킹
        String strValue = String.valueOf(value);
        if (JWT_TOKEN_PATTERN.matcher(strValue).matches()) {
            return "[PROTECTED_TOKEN]";
        }

        // 문자열 내 민감 필드 패턴 치환
        return maskSensitiveString(strValue);
    }

    /**
     * 파라미터명이 민감 정보에 해당하는지 판별
     */
    private boolean isSensitiveParamName(String paramName) {
        if (paramName == null) {
            return false;
        }
        String lowerName = paramName.toLowerCase();
        for (String keyword : SENSITIVE_PARAM_KEYWORDS) {
            if (lowerName.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 반환값에 대한 민감 정보 마스킹 및 길이 제한 처리
     */
    private String maskReturnValue(Object result) {
        if (result == null) {
            return "void/null";
        }

        String strValue = String.valueOf(result);

        // JWT 토큰 직접 반환 시 마스킹
        if (JWT_TOKEN_PATTERN.matcher(strValue).matches()) {
            return "[PROTECTED_TOKEN]";
        }

        // 로그 과다 출력을 방지하기 위해 500자 초과 시 축약 처리
        if (strValue.length() > 500) {
            strValue = strValue.substring(0, 500) + "...(truncated)";
        }

        return maskSensitiveString(strValue);
    }

    /**
     * 정규표현식을 활용하여 문자열 내부의 password=xxx, token=yyy 등의 민감 정보를 마스킹
     */
    private String maskSensitiveString(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        Matcher matcher = SENSITIVE_STRING_PATTERN.matcher(input);
        return matcher.replaceAll("$1=****");
    }
}
