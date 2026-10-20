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
}
