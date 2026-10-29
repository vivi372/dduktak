package com.dduktak.global.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

/**
 * 프로덕션 배포(Render) 시 SPRING_DATASOURCE_URL 환경변수가 일반 jdbc:postgresql:// 또는 postgresql:// 형식으로
 * 주입되더라도 log4jdbc DriverSpy 호환 포맷(jdbc:log4jdbc:postgresql://) 및 Supabase Transaction Pooler(6543)
 * 필수 옵션(prepareThreshold=0)을 자동으로 보정하는 프로세서입니다.
 */
@Slf4j
@Component
public class DataSourceUrlNormalizer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(@NonNull Object bean, @NonNull String beanName) throws BeansException {
        if (bean instanceof DataSourceProperties props) {
            String url = props.getUrl();
            if (url != null && !url.isBlank()) {
                String normalized = url.trim();
                if (normalized.startsWith("postgresql://")) {
                    normalized = "jdbc:log4jdbc:" + normalized;
                } else if (normalized.startsWith("jdbc:postgresql://")) {
                    normalized = "jdbc:log4jdbc:" + normalized.substring("jdbc:".length());
                }
                if (normalized.contains(":6543") && !normalized.contains("prepareThreshold=")) {
                    normalized += (normalized.contains("?") ? "&" : "?") + "prepareThreshold=0";
                }
                if (!normalized.equals(url)) {
                    log.info("[DataSourceUrlNormalizer] SPRING_DATASOURCE_URL을 log4jdbc 및 Pooler 호환 포맷으로 자동 보정했습니다.");
                    props.setUrl(normalized);
                }
            }
        }
        return bean;
    }
}

