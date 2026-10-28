package com.dduktak.global.config;

import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Supabase PostgreSQL 및 HikariCP, MyBatis 연동 무결성 검증 테스트
 */
@SpringBootTest
class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private SqlSessionFactory sqlSessionFactory;

    @Test
    @DisplayName("HikariCP DataSource 빈 주입 및 설정값(풀 이름, 최대 풀 크기) 검증")
    void testDataSourceInjection() {
        // 1. DataSource 빈 정상 주입 여부 확인
        assertThat(dataSource).isNotNull();
        assertThat(dataSource).isInstanceOf(HikariDataSource.class);

        // 2. application.yml에 명시한 HikariCP 커넥션 풀 속성 검증
        HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
        assertThat(hikariDataSource.getPoolName()).isEqualTo("DduktakHikariPool");
        assertThat(hikariDataSource.getMaximumPoolSize()).isEqualTo(10);
        assertThat(hikariDataSource.getMinimumIdle()).isEqualTo(2);
        assertThat(hikariDataSource.isAutoCommit()).isTrue();
    }

    @Test
    @DisplayName("Supabase PostgreSQL 커넥션 획득 및 SELECT 1 쿼리 정상 실행 검증")
    void testDirectConnection() throws Exception {
        // 커넥션 풀에서 실제 커넥션을 획득하고 SELECT 1 실행 검증
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1")) {

            assertThat(conn).isNotNull();
            assertThat(conn.isValid(5)).isTrue();
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt(1)).isEqualTo(1);
        }
    }

    @Test
    @DisplayName("MyBatis SqlSession 연동 및 ingredient_master 74건 시드 데이터 적재 정합성 검증")
    void testMyBatisConnectionAndData() {
        // 1. SqlSessionFactory 정상 주입 확인
        assertThat(sqlSessionFactory).isNotNull();

        // 2. SqlSession 기반 실제 DB 쿼리 실행 및 식재료 마스터 총 74건 건수 일치 확인
        try (SqlSession sqlSession = sqlSessionFactory.openSession();
             Connection conn = sqlSession.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM ingredient_master")) {

            assertThat(rs.next()).isTrue();
            int count = rs.getInt(1);
            assertThat(count).isEqualTo(74);
        } catch (Exception e) {
            throw new RuntimeException("MyBatis DB 연결 및 데이터 조회 검증 실패: " + e.getMessage(), e);
        }
    }
}
