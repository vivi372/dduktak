package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.entity.IngredientMaster;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("[단위 테스트] IngredientMatcher 표준 식재료 스마트 유사 매칭 엔진 검증")
class IngredientMatcherTest {

    private IngredientMatcher matcher;
    private List<IngredientMaster> masterList;

    @BeforeEach
    void setUp() {
        matcher = new IngredientMatcher();

        masterList = List.of(
                IngredientMaster.builder().masterIngredientId(1L).name("양파").defaultUnit("개").defaultShelfDays(14).build(),
                IngredientMaster.builder().masterIngredientId(2L).name("대파").defaultUnit("뿌리").defaultShelfDays(7).build(),
                IngredientMaster.builder().masterIngredientId(3L).name("계란").defaultUnit("개").defaultShelfDays(21).build(),
                IngredientMaster.builder().masterIngredientId(4L).name("돼지고기 (삼겹살/목살)").defaultUnit("g").defaultShelfDays(3).build(),
                IngredientMaster.builder().masterIngredientId(5L).name("소고기 (국거리/불고기용)").defaultUnit("g").defaultShelfDays(3).build(),
                IngredientMaster.builder().masterIngredientId(6L).name("소고기 (차돌박이/우삼겹)").defaultUnit("g").defaultShelfDays(3).build(),
                IngredientMaster.builder().masterIngredientId(7L).name("닭가슴살").defaultUnit("팩").defaultShelfDays(5).build(),
                IngredientMaster.builder().masterIngredientId(8L).name("두부").defaultUnit("모").defaultShelfDays(5).build(),
                IngredientMaster.builder().masterIngredientId(9L).name("밥 (공기밥 / 햇반)").defaultUnit("개").defaultShelfDays(180).build(),
                IngredientMaster.builder().masterIngredientId(10L).name("스팸").defaultUnit("개").defaultShelfDays(365).build()
        );
    }

    @Test
    @DisplayName("사용자 지정 케이스 1: '국내산 냉장 삼겹살 구이용' -> '돼지고기 (삼겹살/목살)' 매칭 성공")
    void matchSamgyeopsal() {
        Optional<IngredientMaster> result = matcher.matchToMaster("국내산 냉장 삼겹살 구이용", masterList);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("돼지고기 (삼겹살/목살)");
        assertThat(result.get().getMasterIngredientId()).isEqualTo(4L);
    }

    @Test
    @DisplayName("사용자 지정 케이스 2: '오늘밥상 바로 무쳐먹는 파채양념' 및 '파채' -> 74종 마스터 미등록으로 매칭 실패 (empty)")
    void matchPachaeExcluded() {
        Optional<IngredientMaster> result1 = matcher.matchToMaster("오늘밥상 바로 무쳐먹는 파채양념", masterList);
        Optional<IngredientMaster> result2 = matcher.matchToMaster("파채", masterList);
        Optional<IngredientMaster> result3 = matcher.matchToMaster("신선 파절이 150g", masterList);

        assertThat(result1).isEmpty();
        assertThat(result2).isEmpty();
        assertThat(result3).isEmpty();
    }

    @Test
    @DisplayName("사용자 지정 케이스 3: '호주산냉장곡물양지국거리' -> '소고기 (국거리/불고기용)' 매칭 성공")
    void matchBeefYangji() {
        Optional<IngredientMaster> result = matcher.matchToMaster("호주산냉장곡물양지국거리", masterList);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("소고기 (국거리/불고기용)");
        assertThat(result.get().getMasterIngredientId()).isEqualTo(5L);
    }

    @Test
    @DisplayName("영수증 샘플 케이스 1: '일판란 30구(특란)' -> '계란' 매칭 성공")
    void matchEgg() {
        Optional<IngredientMaster> result = matcher.matchToMaster("일판란 30구(특란)", masterList);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("계란");
        assertThat(result.get().getMasterIngredientId()).isEqualTo(3L);
    }

    @Test
    @DisplayName("영수증 샘플 케이스 2: '호주산냉동차돌박이구' -> '소고기 (차돌박이/우삼겹)' 매칭 성공")
    void matchChadol() {
        Optional<IngredientMaster> result = matcher.matchToMaster("호주산냉동차돌박이구", masterList);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("소고기 (차돌박이/우삼겹)");
        assertThat(result.get().getMasterIngredientId()).isEqualTo(6L);
    }

    @Test
    @DisplayName("영수증 샘플 케이스 3: '삼립 그릭슈바인 닭가' -> '닭가슴살' 매칭 성공")
    void matchChickenBreast() {
        Optional<IngredientMaster> result = matcher.matchToMaster("삼립 그릭슈바인 닭가", masterList);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("닭가슴살");
        assertThat(result.get().getMasterIngredientId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("정확 일치 케이스: '양파', '스팸' -> 해당 마스터 엔티티 반환")
    void matchExact() {
        Optional<IngredientMaster> onion = matcher.matchToMaster("양파", masterList);
        Optional<IngredientMaster> spam = matcher.matchToMaster("스팸", masterList);

        assertThat(onion).isPresent();
        assertThat(onion.get().getName()).isEqualTo("양파");
        assertThat(spam).isPresent();
        assertThat(spam.get().getName()).isEqualTo("스팸");
    }

    @Test
    @DisplayName("무효 입력 방어: null, 빈 문자열, 마스터 목록 비어있음 -> empty 반환")
    void matchInvalidInputs() {
        assertThat(matcher.matchToMaster(null, masterList)).isEmpty();
        assertThat(matcher.matchToMaster("  ", masterList)).isEmpty();
        assertThat(matcher.matchToMaster("양파", List.of())).isEmpty();
    }
}
