package com.dduktak.domain.inventory.mapper;

import com.dduktak.domain.inventory.entity.IngredientMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * 표준 식재료 마스터(ingredient_master) MyBatis Mapper 인터페이스
 */
@Mapper
public interface IngredientMasterMapper {

    /**
     * 식재료 마스터 식별자(PK)로 단건 조회
     */
    Optional<IngredientMaster> findById(@Param("masterIngredientId") Long masterIngredientId);

    /**
     * 표준 식재료명으로 정확 일치 단건 조회
     */
    Optional<IngredientMaster> findByName(@Param("name") String name);

    /**
     * 키워드가 포함된 표준 식재료 목록 검색
     */
    List<IngredientMaster> searchByNameLike(@Param("keyword") String keyword);

    /**
     * 전체 표준 식재료 목록 조회 (캐싱 및 매칭 엔진용)
     */
    List<IngredientMaster> findAll();

    /**
     * 표준 식재료 마스터 검색 및 카테고리별 조회 (카테고리명 조인 포함)
     *
     * @param query 검색 키워드 (선택)
     * @param categoryId 식재료 카테고리 ID (선택)
     * @return 카테고리 정보가 포함된 표준 식재료 DTO 목록
     */
    List<com.dduktak.domain.inventory.dto.MasterIngredientResponseDto> searchMasterIngredients(
            @Param("query") String query,
            @Param("categoryId") Long categoryId
    );
}
