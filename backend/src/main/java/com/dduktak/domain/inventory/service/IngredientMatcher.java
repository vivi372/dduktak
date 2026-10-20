package com.dduktak.domain.inventory.service;

import com.dduktak.domain.inventory.entity.IngredientMaster;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

/**
 * 표준 식재료 스마트 유사 매칭 엔진 (IngredientMatcher)
 * 바코드 또는 OCR로 획득한 다양한 유통 상품명(예: '호주산냉장곡물양지국거리', '국내산 냉장 삼겹살 구이용')을
 * 74종 표준 식재료 마스터(ingredient_master)와 의미론적/키워드적으로 매칭합니다.
 */
@Slf4j
@Component
public class IngredientMatcher {

    /**
     * 불필요한 특수문자 및 용량/포장 표기 정규식 패턴
     */
    private static final Pattern REMOVE_NOISE_PATTERN = Pattern.compile("\\[.*?\\]|\\(.*?\\)|[0-9]+(\\.[0-9]+)?(g|kg|ml|l|구|입|개|팩|봉|모)|[^가-힣a-zA-Z0-9\\s]");

    /**
     * 상품명에서 제거할 제조사/원산지/유통 수식어 목록
     */
    private static final List<String> STOP_WORDS = List.of(
            "주식회사", "오뚜기", "풀무원", "cj", "하림", "동원", "청정원", "백설", "삼립", "도드람", "목우촌", "그릭슈바인",
            "호주산", "국내산", "미국산", "한우", "한돈", "국산",
            "냉장", "냉동", "친환경", "무농약", "유기농", "신선", "우리쌀", "생", "곡물", "구이용", "요리용",
            "직화", "바로", "무쳐먹는", "오늘밥상"
    );

    /**
     * 표준 식재료별 유의어/핵심 키워드 매핑 테이블
     * (마스터 표준명 -> 연관 키워드 목록)
     */
    private static final Map<String, List<String>> SYNONYM_MAP = new LinkedHashMap<>();

    static {
        // [정육/계란]
        SYNONYM_MAP.put("돼지고기 (삼겹살/목살)", List.of("삼겹살", "삼겹", "목살", "오겹살", "생삼겹", "돼지삼겹", "돼지목살"));
        SYNONYM_MAP.put("소고기 (국거리/불고기용)", List.of("양지", "국거리", "불고기용", "소불고기", "우양지", "소고기양지", "설도", "우둔"));
        SYNONYM_MAP.put("소고기 (차돌박이/우삼겹)", List.of("차돌박이", "차돌", "우삼겹", "차돌박이구이"));
        SYNONYM_MAP.put("돼지고기 (앞다리살/찌개용)", List.of("앞다리살", "앞다리", "전지", "찌개용돼지고기", "돼지찌개용"));
        SYNONYM_MAP.put("돼지고기 (보쌈용/수육용)", List.of("보쌈용", "수육용", "돼지수육", "돼지보쌈"));
        SYNONYM_MAP.put("돼지고기 (갈비찜/등갈비용)", List.of("돼지갈비", "등갈비", "갈비찜용", "쪽갈비"));
        SYNONYM_MAP.put("소고기 (찜용/갈비용)", List.of("소갈비", "la갈비", "소갈비찜", "소고기갈비"));
        SYNONYM_MAP.put("닭가슴살", List.of("닭가슴살", "닭가슴", "닭가"));
        SYNONYM_MAP.put("닭다리살 정육", List.of("닭다리살", "닭정육", "닭다리정육"));
        SYNONYM_MAP.put("통닭 (생닭 1마리)", List.of("생닭", "통닭", "영계", "토종닭", "볶음탕용닭", "닭볶음탕용"));
        SYNONYM_MAP.put("계란", List.of("일판란", "특란", "대란", "달걀", "계란", "구운란", "유정란", "왕란"));
        SYNONYM_MAP.put("스팸", List.of("스팸", "리챔", "런천미트"));
        SYNONYM_MAP.put("소시지 (프랑크/후랑크)", List.of("비엔나", "후랑크", "프랑크", "소시지", "소세지"));
        SYNONYM_MAP.put("베이컨", List.of("베이컨"));

        // [가공식품/냉동]
        SYNONYM_MAP.put("밥 (공기밥 / 햇반)", List.of("햇반", "즉석밥", "공기밥", "오뚜기밥", "백미밥", "현미밥"));
        SYNONYM_MAP.put("냉동밥 (볶음밥/백미)", List.of("냉동밥", "볶음밥", "김치볶음밥", "새우볶음밥"));
        SYNONYM_MAP.put("라면", List.of("신라면", "진라면", "안성탕면", "삼양라면", "너구리", "짜파게티", "라면"));
        SYNONYM_MAP.put("만두 (냉동)", List.of("비비고만두", "교자만두", "왕만두", "물만두", "군만두", "만두"));
        SYNONYM_MAP.put("배추김치", List.of("배추김치", "포기김치", "맛김치", "김치"));
        SYNONYM_MAP.put("떡국떡", List.of("떡국떡", "떡국용떡"));
        SYNONYM_MAP.put("사골곰탕 (파우치)", List.of("사골곰탕", "사골육수", "사골엑기스"));

        // [수산/해산물]
        SYNONYM_MAP.put("참치캔", List.of("참치캔", "동원참치", "마일드참치", "살코기참치"));
        SYNONYM_MAP.put("냉동 새우", List.of("냉동새우", "칵테일새우", "흰다리새우", "새우살"));
        SYNONYM_MAP.put("오징어", List.of("물오징어", "생물오징어", "오징어"));
        SYNONYM_MAP.put("멸치 (육수용)", List.of("국물용멸치", "육수용멸치", "국물멸치", "다시멸치"));
        SYNONYM_MAP.put("미역", List.of("건미역", "자반미역", "자른미역", "미역"));
        SYNONYM_MAP.put("고등어 (순살/토막)", List.of("자반고등어", "순살고등어", "고등어"));
        SYNONYM_MAP.put("갈치", List.of("제주갈치", "은갈치", "갈치"));
        SYNONYM_MAP.put("조기 (굴비)", List.of("참조기", "영광굴비", "조기", "굴비"));
        SYNONYM_MAP.put("임연수 (순살/토막)", List.of("임연수어", "임연수"));

        // [유제품/시리얼]
        SYNONYM_MAP.put("우유", List.of("흰우유", "멸균우유", "생우유", "우유"));
        SYNONYM_MAP.put("버터", List.of("가염버터", "무염버터", "버터"));
        SYNONYM_MAP.put("슬라이스 치즈", List.of("체다치즈", "슬라이스치즈", "모짜렐라치즈", "치즈"));

        // [채소류]
        SYNONYM_MAP.put("두부", List.of("찌개용두부", "부침용두부", "찌개두부", "부침두부", "손두부", "두부"));
        SYNONYM_MAP.put("다진 마늘", List.of("다진마늘", "간마늘"));
        SYNONYM_MAP.put("마늘", List.of("통마늘", "깐마늘", "마늘"));
        SYNONYM_MAP.put("대파", List.of("대파", "흙대파", "깐대파")); // 파채/파채양념은 의도적으로 제외
        SYNONYM_MAP.put("청양고추", List.of("청양고추", "청양"));
        SYNONYM_MAP.put("홍고추", List.of("홍고추"));
        SYNONYM_MAP.put("양파", List.of("양파", "햇양파", "자주양파"));
        SYNONYM_MAP.put("감자", List.of("감자", "햇감자", "수미감자"));
        SYNONYM_MAP.put("애호박", List.of("애호박", "인큐애호박"));
        SYNONYM_MAP.put("당근", List.of("흙당근", "세척당근", "당근"));
        SYNONYM_MAP.put("양배추", List.of("양배추", "적양배추"));
        SYNONYM_MAP.put("무", List.of("다발무", "세척무", "무"));
        SYNONYM_MAP.put("팽이버섯", List.of("팽이버섯", "팽이"));
        SYNONYM_MAP.put("새송이버섯", List.of("새송이버섯", "새송이"));
        SYNONYM_MAP.put("표고버섯", List.of("표고버섯", "표고"));
        SYNONYM_MAP.put("상추", List.of("적상추", "청상추", "꽃상추", "상추"));
        SYNONYM_MAP.put("깻잎", List.of("깻잎", "바라깻잎"));
        SYNONYM_MAP.put("콩나물", List.of("콩나물"));

        // [양념/소스]
        SYNONYM_MAP.put("진간장", List.of("진간장", "양조간장"));
        SYNONYM_MAP.put("국간장", List.of("국간장", "조선간장"));
        SYNONYM_MAP.put("고추장", List.of("태양초고추장", "고추장"));
        SYNONYM_MAP.put("된장", List.of("재래식된장", "된장"));
        SYNONYM_MAP.put("고춧가루", List.of("고춧가루", "고추가루"));
        SYNONYM_MAP.put("설탕", List.of("백설탕", "갈색설탕", "흑설탕", "설탕"));
        SYNONYM_MAP.put("소금", List.of("꽃소금", "천일염", "구운소금", "맛소금", "소금"));
        SYNONYM_MAP.put("물엿", List.of("물엿", "조청"));
        SYNONYM_MAP.put("굴소스", List.of("이금기굴소스", "굴소스"));
        SYNONYM_MAP.put("참기름", List.of("참기름", "들기름"));
        SYNONYM_MAP.put("식용유", List.of("식용유", "카놀라유", "포도씨유", "해바라기유", "콩기름"));
        SYNONYM_MAP.put("맛술 (미림)", List.of("미림", "맛술", "미향"));
        SYNONYM_MAP.put("액젓 (참치/멸치)", List.of("멸치액젓", "참치액", "까나리액젓", "액젓"));
        SYNONYM_MAP.put("올리고당", List.of("프락토올리고당", "쌀올리고당", "올리고당"));
        SYNONYM_MAP.put("케첩", List.of("토마토케첩", "케찹", "케첩"));
        SYNONYM_MAP.put("마요네즈", List.of("마요네즈", "마요네스", "마요"));
        SYNONYM_MAP.put("다시다 (소고기)", List.of("소고기다시다", "쇠고기다시다"));
        SYNONYM_MAP.put("다시다 (멸치)", List.of("멸치다시다"));
        SYNONYM_MAP.put("미원", List.of("미원", "msg"));
        SYNONYM_MAP.put("코인육수 (해물맛)", List.of("해물코인육수", "코인육수해물"));
        SYNONYM_MAP.put("코인육수 (사골맛)", List.of("사골코인육수", "코인육수사골"));
        SYNONYM_MAP.put("코인육수 (채소맛)", List.of("채소코인육수", "야채코인육수"));
        SYNONYM_MAP.put("통깨 / 간깨", List.of("통깨", "볶음참깨", "볶은참깨", "깨소금"));
    }

    /**
     * 상품명을 74종 표준 식재료 목록과 비교하여 가장 적절한 마스터 엔티티 매칭
     *
     * @param rawProductName 바코드/OCR로 전달된 원천 상품명
     * @param masterList     DB에서 조회한 표준 식재료 전체 목록 (74종)
     * @return 매칭된 마스터 식재료 (매칭 불가 시 Optional.empty())
     */
    public Optional<IngredientMaster> matchToMaster(String rawProductName, List<IngredientMaster> masterList) {
        if (rawProductName == null || rawProductName.isBlank() || masterList == null || masterList.isEmpty()) {
            return Optional.empty();
        }

        String cleanedName = cleanProductName(rawProductName);
        log.debug("[IngredientMatcher] 원천 상품명: '{}' -> 정제 상품명: '{}'", rawProductName, cleanedName);

        // 1. 파채/파채양념 등 74종 마스터 제외 항목 선제 배제
        if (cleanedName.contains("파채") || cleanedName.contains("파절이")) {
            log.info("[IngredientMatcher] 미등록 식재료 감지 (파채/파채양념 제외): '{}'", rawProductName);
            return Optional.empty();
        }

        // 2. 1차 전략: 정확 일치 (Exact Match)
        for (IngredientMaster master : masterList) {
            String masterClean = cleanMasterName(master.getName());
            if (cleanedName.equalsIgnoreCase(masterClean) || cleanedName.equalsIgnoreCase(master.getName())) {
                log.info("[IngredientMatcher] 정확 일치 성공: '{}' -> '{}'", rawProductName, master.getName());
                return Optional.of(master);
            }
        }

        // 3. 2차 전략: 유의어 및 핵심 키워드 사전 매칭 (Synonym / Keyword Match)
        for (Map.Entry<String, List<String>> entry : SYNONYM_MAP.entrySet()) {
            String targetMasterName = entry.getKey();
            for (String keyword : entry.getValue()) {
                if (cleanedName.contains(keyword)) {
                    // 키워드가 일치하면 해당 targetMasterName을 가진 마스터 엔티티 검색
                    Optional<IngredientMaster> found = masterList.stream()
                            .filter(m -> m.getName().equals(targetMasterName))
                            .findFirst();
                    if (found.isPresent()) {
                        log.info("[IngredientMatcher] 유의어/키워드 매칭 성공 (키워드: '{}'): '{}' -> '{}'",
                                keyword, rawProductName, found.get().getName());
                        return found;
                    }
                }
            }
        }

        // 4. 3차 전략: 마스터 식재료 기본명 포함 여부 (Substring Match)
        for (IngredientMaster master : masterList) {
            String coreName = cleanMasterName(master.getName());
            if (coreName.length() >= 2 && cleanedName.contains(coreName)) {
                log.info("[IngredientMatcher] 부분 포함 매칭 성공: '{}' -> '{}'", rawProductName, master.getName());
                return Optional.of(master);
            }
        }

        log.warn("[IngredientMatcher] 표준 식재료 매칭 실패 (미등록): '{}'", rawProductName);
        return Optional.empty();
    }

    /**
     * 상품명 전처리 (노이즈, 용량 단위, 제조사/수식어 제거)
     */
    private String cleanProductName(String name) {
        String cleaned = REMOVE_NOISE_PATTERN.matcher(name).replaceAll(" ").toLowerCase();
        for (String stopWord : STOP_WORDS) {
            cleaned = cleaned.replace(stopWord.toLowerCase(), " ");
        }
        return cleaned.replaceAll("\\s+", "").trim();
    }

    /**
     * 마스터 이름에서 괄호 표기 제거한 정제명 반환 (예: '돼지고기 (삼겹살/목살)' -> '돼지고기')
     */
    private String cleanMasterName(String masterName) {
        if (masterName.contains("(")) {
            return masterName.substring(0, masterName.indexOf('(')).trim();
        }
        return masterName.trim();
    }
}
