package com.dduktak.domain.inventory.repository;

import com.dduktak.domain.inventory.entity.UserIngredient;
import com.dduktak.domain.inventory.mapper.UserIngredientMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 내 냉장고 식재료(user_ingredient) Repository
 * Service와 MyBatis Mapper 사이 계층으로서 안전한 영속성 데이터 접근을 제공합니다.
 */
@Repository
@RequiredArgsConstructor
public class UserIngredientRepository {

    private final UserIngredientMapper userIngredientMapper;

    /**
     * 식재료 신규 저장
     */
    public int insert(UserIngredient userIngredient) {
        return userIngredientMapper.insert(userIngredient);
    }

    /**
     * 활성 식재료 단건 조회 (소유권 및 status='ACTIVE' 검증)
     */
    public Optional<UserIngredient> findByIdAndUserId(Long ingredientId, UUID userId) {
        return userIngredientMapper.findByIdAndUserId(ingredientId, userId);
    }

    /**
     * 식재료 단건 조회 (status != 'DELETED')
     */
    public Optional<UserIngredient> findByIdAndUserIdAnyStatus(Long ingredientId, UUID userId) {
        return userIngredientMapper.findByIdAndUserIdAnyStatus(ingredientId, userId);
    }

    /**
     * 내 냉장고 식재료 목록 조회 (SQL 기반 D-Day 연산 및 임박순 정렬)
     */
    public List<UserIngredient> findAllByUserIdAndFilter(
            UUID userId,
            String query,
            Long categoryId,
            String storageType,
            String status
    ) {
        return userIngredientMapper.findAllByUserIdAndFilter(userId, query, categoryId, storageType, status);
    }

    /**
     * 식재료 수정
     */
    public int update(UserIngredient userIngredient) {
        return userIngredientMapper.update(userIngredient);
    }

    /**
     * 수동 소비 후 잔여 수량 및 상태 업데이트
     */
    public int updateQuantityAndStatus(Long ingredientId, UUID userId, BigDecimal quantity, String status) {
        return userIngredientMapper.updateQuantityAndStatus(ingredientId, userId, quantity, status);
    }

    /**
     * 식재료 소프트 삭제 (status = 'DELETED')
     */
    public int softDelete(Long ingredientId, UUID userId) {
        return userIngredientMapper.softDelete(ingredientId, userId);
    }

    /**
     * FIFO 차감용: 특정 회원의 특정 마스터 식재료에 대한 활성 식재료 목록 조회 (소비기한 임박순)
     */
    public List<UserIngredient> findActiveByUserIdAndMasterId(UUID userId, Long masterIngredientId) {
        return userIngredientMapper.findActiveByUserIdAndMasterId(userId, masterIngredientId);
    }

    /**
     * 특정 회원의 특정 마스터 식재료 총 보유 수량 합산 조회 (ACTIVE 상태)
     */
    public BigDecimal findTotalQuantityByUserIdAndMasterId(UUID userId, Long masterIngredientId) {
        return userIngredientMapper.findTotalQuantityByUserIdAndMasterId(userId, masterIngredientId);
    }

    /**
     * 소비기한 임박 식재료 수 집계 (0 <= D-Day <= 3, status='ACTIVE')
     */
    public long countImminentByUserId(UUID userId) {
        return userIngredientMapper.countImminentByUserId(userId);
    }

    /**
     * 소비기한 가장 임박한 상위 N개 활성 식재료 목록 조회 (0 <= D-Day <= 3, expire_date ASC)
     */
    public List<UserIngredient> findTopImminentByUserId(UUID userId, int limit) {
        return userIngredientMapper.findTopImminentByUserId(userId, limit);
    }
}
