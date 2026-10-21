package com.dduktak.domain.inventory.mapper;

import com.dduktak.domain.inventory.entity.UserIngredient;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 내 냉장고 식재료(user_ingredient) MyBatis Mapper 인터페이스
 */
@Mapper
public interface UserIngredientMapper {

    /**
     * 식재료 신규 등록 (독립 레코드 생성)
     * useGeneratedKeys를 통해 등록된 ingredientId(PK)를 Entity에 바인딩합니다.
     */
    int insert(UserIngredient userIngredient);

    /**
     * 식재료 ID 및 회원 UUID 기반 단건 활성 식재료 조회 (소유권 및 status='ACTIVE' 검증)
     */
    Optional<UserIngredient> findByIdAndUserId(
            @Param("ingredientId") Long ingredientId,
            @Param("userId") UUID userId
    );

    /**
     * 식재료 ID 및 회원 UUID 기반 삭제되지 않은 식재료 조회 (status != 'DELETED')
     */
    Optional<UserIngredient> findByIdAndUserIdAnyStatus(
            @Param("ingredientId") Long ingredientId,
            @Param("userId") UUID userId
    );

    /**
     * 내 냉장고 식재료 목록 조회 (SQL 기반 D-Day 연산 및 정렬, 검색/보관장소/카테고리 필터링)
     */
    List<UserIngredient> findAllByUserIdAndFilter(
            @Param("userId") UUID userId,
            @Param("query") String query,
            @Param("categoryId") Long categoryId,
            @Param("storageType") String storageType,
            @Param("status") String status
    );

    /**
     * 식재료 개별 정보 수정 (수량, 보관장소, 소비기한, 메모)
     */
    int update(UserIngredient userIngredient);

    /**
     * 식재료 소비 차감 후 잔여 수량 및 상태 전이 업데이트
     */
    int updateQuantityAndStatus(
            @Param("ingredientId") Long ingredientId,
            @Param("userId") UUID userId,
            @Param("quantity") BigDecimal quantity,
            @Param("status") String status
    );

    /**
     * 식재료 소프트 삭제 (status = 'DELETED')
     */
    int softDelete(
            @Param("ingredientId") Long ingredientId,
            @Param("userId") UUID userId
    );

    /**
     * FIFO 차감용: 특정 회원의 특정 마스터 식재료에 대한 활성 식재료 목록 조회 (expire_date ASC, created_at ASC)
     */
    List<UserIngredient> findActiveByUserIdAndMasterId(
            @Param("userId") UUID userId,
            @Param("masterIngredientId") Long masterIngredientId
    );

    /**
     * 특정 회원의 특정 마스터 식재료 총 보유 수량 합산 조회 (ACTIVE 상태)
     */
    BigDecimal findTotalQuantityByUserIdAndMasterId(
            @Param("userId") UUID userId,
            @Param("masterIngredientId") Long masterIngredientId
    );
}
