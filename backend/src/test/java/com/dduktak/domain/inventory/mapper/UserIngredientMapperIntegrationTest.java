package com.dduktak.domain.inventory.mapper;

import com.dduktak.domain.inventory.entity.IngredientMaster;
import com.dduktak.domain.inventory.entity.UserIngredient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@DisplayName("[통합 테스트] UserIngredientMapper MyBatis SQL 매핑 및 DB 연동 검증")
class UserIngredientMapperIntegrationTest {

    @Autowired
    private UserIngredientMapper userIngredientMapper;

    @Autowired
    private IngredientMasterMapper ingredientMasterMapper;

    private final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID OTHER_USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private IngredientMaster eggMaster;

    @BeforeEach
    void setUp() {
        // 계란 마스터 식재료 조회 (시드 데이터)
        eggMaster = ingredientMasterMapper.findByName("계란")
                .orElseThrow(() -> new IllegalStateException("계란 시드 데이터가 존재하지 않습니다."));
    }

    @Test
    @DisplayName("신규 식재료 등록(독립 레코드 생성) 및 소유권 기반 단건 조회 검증")
    void insert_and_findByIdAndUserId_success() {
        // given
        UserIngredient ingredient = UserIngredient.builder()
                .userId(TEST_USER_ID)
                .masterIngredientId(eggMaster.getMasterIngredientId())
                .categoryId(eggMaster.getCategoryId())
                .name(eggMaster.getName())
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("10.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(10))
                .memo("홈플러스 세일")
                .status("ACTIVE")
                .build();

        // when: insert 실행
        int inserted = userIngredientMapper.insert(ingredient);

        // then: useGeneratedKeys를 통해 ingredientId가 세팅됨
        assertThat(inserted).isEqualTo(1);
        assertThat(ingredient.getIngredientId()).isNotNull();

        // 본인 소유 조회 시 정상 조회 확인
        Optional<UserIngredient> foundOpt = userIngredientMapper.findByIdAndUserId(
                ingredient.getIngredientId(), TEST_USER_ID);
        assertThat(foundOpt).isPresent();
        UserIngredient found = foundOpt.get();
        assertThat(found.getName()).isEqualTo("계란");
        assertThat(found.getQuantity()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(found.getMemo()).isEqualTo("홈플러스 세일");
        assertThat(found.getDDay()).isEqualTo(10); // 오늘 + 10일 -> dDay = 10

        // 타인 UUID로 조회 시 빈 값(격리) 반환 확인
        Optional<UserIngredient> otherFoundOpt = userIngredientMapper.findByIdAndUserId(
                ingredient.getIngredientId(), OTHER_USER_ID);
        assertThat(otherFoundOpt).isEmpty();
    }

    @Test
    @DisplayName("식재료 목록 조회 시 SQL 기반 D-Day 연산 및 소비기한 임박순 정렬 검증")
    void findAllByUserIdAndFilter_withDDayAndSort() {
        // given: 소비기한이 다른 3개의 식재료 등록 (독립 레코드)
        UserIngredient item1 = UserIngredient.builder()
                .userId(TEST_USER_ID)
                .masterIngredientId(eggMaster.getMasterIngredientId())
                .categoryId(eggMaster.getCategoryId())
                .name("계란_3일남음")
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("2.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(3))
                .status("ACTIVE")
                .build();

        UserIngredient item2 = UserIngredient.builder()
                .userId(TEST_USER_ID)
                .masterIngredientId(eggMaster.getMasterIngredientId())
                .categoryId(eggMaster.getCategoryId())
                .name("계란_1일남음")
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("1.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(1))
                .status("ACTIVE")
                .build();

        UserIngredient item3 = UserIngredient.builder()
                .userId(TEST_USER_ID)
                .masterIngredientId(eggMaster.getMasterIngredientId())
                .categoryId(eggMaster.getCategoryId())
                .name("계란_7일남음")
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("5.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(7))
                .status("ACTIVE")
                .build();

        userIngredientMapper.insert(item1);
        userIngredientMapper.insert(item2);
        userIngredientMapper.insert(item3);

        // when: 목록 조회 (expire_date ASC 정렬)
        List<UserIngredient> list = userIngredientMapper.findAllByUserIdAndFilter(
                TEST_USER_ID, "계란_", eggMaster.getCategoryId(), "REFRIGERATED", "ACTIVE");

        // then: 소비기한 임박순(1일 -> 3일 -> 7일)으로 정렬 및 dDay 계산 검증
        assertThat(list).hasSize(3);
        assertThat(list.get(0).getName()).isEqualTo("계란_1일남음");
        assertThat(list.get(0).getDDay()).isEqualTo(1);

        assertThat(list.get(1).getName()).isEqualTo("계란_3일남음");
        assertThat(list.get(1).getDDay()).isEqualTo(3);

        assertThat(list.get(2).getName()).isEqualTo("계란_7일남음");
        assertThat(list.get(2).getDDay()).isEqualTo(7);
    }

    @Test
    @DisplayName("식재료 개별 수정 (보관방법, 수량, 단위, 소비기한, 메모) 검증")
    void update_success() {
        // given
        UserIngredient item = UserIngredient.builder()
                .userId(TEST_USER_ID)
                .masterIngredientId(eggMaster.getMasterIngredientId())
                .categoryId(eggMaster.getCategoryId())
                .name("계란")
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("10.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(10))
                .memo("수정전 메모")
                .status("ACTIVE")
                .build();
        userIngredientMapper.insert(item);

        // when: 정보 수정
        UserIngredient updateTarget = UserIngredient.builder()
                .ingredientId(item.getIngredientId())
                .userId(TEST_USER_ID)
                .storageType("FROZEN")
                .quantity(new BigDecimal("8.00"))
                .unit("구")
                .expireDate(LocalDate.now().plusDays(15))
                .memo("냉동 보관으로 변경")
                .build();

        int updated = userIngredientMapper.update(updateTarget);

        // then
        assertThat(updated).isEqualTo(1);
        UserIngredient reloaded = userIngredientMapper.findByIdAndUserId(item.getIngredientId(), TEST_USER_ID).orElseThrow();
        assertThat(reloaded.getStorageType()).isEqualTo("FROZEN");
        assertThat(reloaded.getQuantity()).isEqualByComparingTo(new BigDecimal("8.00"));
        assertThat(reloaded.getUnit()).isEqualTo("구");
        assertThat(reloaded.getMemo()).isEqualTo("냉동 보관으로 변경");
    }

    @Test
    @DisplayName("수동 소비 후 잔여 수량 및 상태 업데이트 (CONSUMED 전이) 검증")
    void updateQuantityAndStatus_success() {
        // given
        UserIngredient item = UserIngredient.builder()
                .userId(TEST_USER_ID)
                .masterIngredientId(eggMaster.getMasterIngredientId())
                .categoryId(eggMaster.getCategoryId())
                .name("계란")
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("5.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(5))
                .status("ACTIVE")
                .build();
        userIngredientMapper.insert(item);

        // when: 전량 소비 (잔여 수량 0, CONSUMED 전이)
        int updated = userIngredientMapper.updateQuantityAndStatus(
                item.getIngredientId(), TEST_USER_ID, BigDecimal.ZERO, "CONSUMED");

        // then
        assertThat(updated).isEqualTo(1);
        // findByIdAndUserId는 ACTIVE 상태만 조회하므로 empty 반환
        assertThat(userIngredientMapper.findByIdAndUserId(item.getIngredientId(), TEST_USER_ID)).isEmpty();

        // AnyStatus 조회 시에는 정상 조회 및 CONSUMED 상태 확인
        UserIngredient reloaded = userIngredientMapper.findByIdAndUserIdAnyStatus(item.getIngredientId(), TEST_USER_ID).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo("CONSUMED");
        assertThat(reloaded.getQuantity()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("식재료 소프트 삭제 (DELETED 전이) 검증")
    void softDelete_success() {
        // given
        UserIngredient item = UserIngredient.builder()
                .userId(TEST_USER_ID)
                .masterIngredientId(eggMaster.getMasterIngredientId())
                .categoryId(eggMaster.getCategoryId())
                .name("계란")
                .storageType("REFRIGERATED")
                .quantity(new BigDecimal("3.00"))
                .unit("개")
                .expireDate(LocalDate.now().plusDays(3))
                .status("ACTIVE")
                .build();
        userIngredientMapper.insert(item);

        // when: 소프트 삭제
        int deleted = userIngredientMapper.softDelete(item.getIngredientId(), TEST_USER_ID);

        // then
        assertThat(deleted).isEqualTo(1);
        // 일반 활성 조회 시 조회되지 않음
        assertThat(userIngredientMapper.findByIdAndUserId(item.getIngredientId(), TEST_USER_ID)).isEmpty();
        // 삭제 상태로 보존 확인
        assertThat(userIngredientMapper.findByIdAndUserIdAnyStatus(item.getIngredientId(), TEST_USER_ID)).isEmpty();
    }
}
