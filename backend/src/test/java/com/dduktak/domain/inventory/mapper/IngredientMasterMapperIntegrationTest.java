package com.dduktak.domain.inventory.mapper;

import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.global.config.DotenvTestInitializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@ContextConfiguration(initializers = DotenvTestInitializer.class)
@DisplayName("[통합 테스트] IngredientMasterMapper MyBatis SQL 매핑 및 DB 연동 검증")
class IngredientMasterMapperIntegrationTest {

    @Autowired
    private IngredientMasterMapper ingredientMasterMapper;

    @Test
    @DisplayName("표준 식재료 전체 목록 조회 (74종 시드 데이터 검증)")
    void findAll_success() {
        List<IngredientMaster> list = ingredientMasterMapper.findAll();

        assertThat(list).isNotEmpty();
        assertThat(list.size()).isGreaterThanOrEqualTo(70);

        // 첫 번째 항목 검증
        IngredientMaster first = list.get(0);
        assertThat(first.getMasterIngredientId()).isNotNull();
        assertThat(first.getName()).isNotBlank();
        assertThat(first.getDefaultUnit()).isNotBlank();
        assertThat(first.getDefaultShelfDays()).isPositive();
    }

    @Test
    @DisplayName("표준 식재료명으로 정확 일치 단건 조회 ('계란')")
    void findByName_success() {
        Optional<IngredientMaster> eggOpt = ingredientMasterMapper.findByName("계란");

        assertThat(eggOpt).isPresent();
        IngredientMaster egg = eggOpt.get();
        assertThat(egg.getName()).isEqualTo("계란");
        assertThat(egg.getDefaultUnit()).isEqualTo("개");
        assertThat(egg.getDefaultShelfDays()).isEqualTo(21);
    }

    @Test
    @DisplayName("PK로 표준 식재료 단건 조회")
    void findById_success() {
        // '계란' 조회 후 해당 PK로 단건 조회
        IngredientMaster egg = ingredientMasterMapper.findByName("계란").orElseThrow();

        Optional<IngredientMaster> found = ingredientMasterMapper.findById(egg.getMasterIngredientId());

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("계란");
    }

    @Test
    @DisplayName("키워드로 식재료 부분 일치 검색 ('돼지고기')")
    void searchByNameLike_success() {
        List<IngredientMaster> porkList = ingredientMasterMapper.searchByNameLike("돼지고기");

        assertThat(porkList).isNotEmpty();
        assertThat(porkList).allMatch(item -> item.getName().contains("돼지고기"));
    }
}
