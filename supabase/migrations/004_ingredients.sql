-- =============================================================
-- 오늘 뭐 해먹지 — 요리 재료 (004)
-- dishes에 재료 배열 컬럼을 추가하고, 시드 요리 20개의 재료를 채운다.
-- =============================================================

alter table public.dishes
  add column if not exists ingredients text[] not null default '{}';

-- 시드 요리 재료 채우기 (이름 기준, 이미 값이 있으면 덮어쓰지 않음)
update public.dishes set ingredients = array['김치', '돼지고기', '두부', '대파', '양파'] where name = '김치찌개' and ingredients = '{}';
update public.dishes set ingredients = array['된장', '두부', '애호박', '감자', '양파', '대파'] where name = '된장찌개' and ingredients = '{}';
update public.dishes set ingredients = array['돼지고기', '고추장', '양파', '대파', '마늘'] where name = '제육볶음' and ingredients = '{}';
update public.dishes set ingredients = array['계란', '대파', '당근'] where name = '계란말이' and ingredients = '{}';
update public.dishes set ingredients = array['밥', '계란', '시금치', '당근', '애호박', '고추장'] where name = '비빔밥' and ingredients = '{}';
update public.dishes set ingredients = array['미역', '소고기', '마늘', '국간장'] where name = '미역국' and ingredients = '{}';
update public.dishes set ingredients = array['소고기', '양파', '당근', '대파', '간장'] where name = '불고기' and ingredients = '{}';
update public.dishes set ingredients = array['밥', '김치', '계란', '대파', '참기름'] where name = '김치볶음밥' and ingredients = '{}';
update public.dishes set ingredients = array['두부', '다진 돼지고기', '두반장', '대파', '마늘'] where name = '마파두부' and ingredients = '{}';
update public.dishes set ingredients = array['밥', '계란', '대파', '간장'] where name = '계란볶음밥' and ingredients = '{}';
update public.dishes set ingredients = array['오징어', '새우', '홍합', '양파', '고춧가루', '대파'] where name = '짬뽕탕' and ingredients = '{}';
update public.dishes set ingredients = array['스파게티면', '마늘', '올리브오일', '페페론치노'] where name = '알리오올리오' and ingredients = '{}';
update public.dishes set ingredients = array['스파게티면', '토마토소스', '양파', '마늘'] where name = '토마토 파스타' and ingredients = '{}';
update public.dishes set ingredients = array['밥', '계란', '양파', '당근', '케첩'] where name = '오므라이스' and ingredients = '{}';
update public.dishes set ingredients = array['소고기 스테이크용', '버터', '마늘', '아스파라거스'] where name = '스테이크' and ingredients = '{}';
update public.dishes set ingredients = array['카레가루', '감자', '당근', '양파', '돼지고기', '밥'] where name = '카레라이스' and ingredients = '{}';
update public.dishes set ingredients = array['소고기', '양파', '간장', '미림', '계란', '밥'] where name = '규동' and ingredients = '{}';
update public.dishes set ingredients = array['우동면', '쯔유', '대파', '유부'] where name = '우동' and ingredients = '{}';
update public.dishes set ingredients = array['떡', '어묵', '고추장', '대파', '설탕'] where name = '떡볶이' and ingredients = '{}';
update public.dishes set ingredients = array['라면', '계란', '대파'] where name = '라면' and ingredients = '{}';
