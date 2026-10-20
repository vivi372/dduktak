package com.dduktak.domain.inventory.repository;

import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.domain.inventory.mapper.IngredientMasterMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 표준 식재료 마스터(ingredient_master) Repository
 * Service와 MyBatis Mapper 사이 계층으로서 안전한 영속성 데이터 접근을 제공합니다.
 */
@Repository
@RequiredArgsConstructor
public class IngredientMasterRepository {

    private final IngredientMasterMapper ingredientMasterMapper;

    /**
     * PK로 마스터 식재료 단건 조회
     */
    public Optional<IngredientMaster> findById(Long id) {
        return ingredientMasterMapper.findById(id);
    }

    /**
     * 표준 식재료명으로 단건 조회
     */
    public Optional<IngredientMaster> findByName(String name) {
        return ingredientMasterMapper.findByName(name);
    }

    /**
     * 키워드로 마스터 식재료 목록 검색
     */
    public List<IngredientMaster> searchByNameLike(String keyword) {
        return ingredientMasterMapper.searchByNameLike(keyword);
    }

    /**
     * 전체 표준 식재료 목록 조회
     */
    public List<IngredientMaster> findAll() {
        return ingredientMasterMapper.findAll();
    }

    /**
     * 표준 식재료 마스터 검색 및 카테고리별 조회
     */
    public List<com.dduktak.domain.inventory.dto.MasterIngredientResponseDto> searchMasterIngredients(String query, Long categoryId) {
        return ingredientMasterMapper.searchMasterIngredients(query, categoryId);
    }
}
