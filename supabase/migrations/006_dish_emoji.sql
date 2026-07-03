-- =============================================================
-- 오늘 뭐 해먹지 — 요리별 이모지 (006)
-- 비어 있으면 앱이 종류별 기본 이모지를 사용한다.
-- =============================================================

alter table public.dishes add column if not exists emoji text;

-- 시드 요리 이모지 채우기 (이미 값이 있으면 유지)
update public.dishes set emoji = '🍲' where name = '김치찌개' and emoji is null;
update public.dishes set emoji = '🥣' where name = '된장찌개' and emoji is null;
update public.dishes set emoji = '🥩' where name = '제육볶음' and emoji is null;
update public.dishes set emoji = '🍳' where name = '계란말이' and emoji is null;
update public.dishes set emoji = '🍚' where name = '비빔밥' and emoji is null;
update public.dishes set emoji = '🌊' where name = '미역국' and emoji is null;
update public.dishes set emoji = '🍖' where name = '불고기' and emoji is null;
update public.dishes set emoji = '🥘' where name = '김치볶음밥' and emoji is null;
update public.dishes set emoji = '🌶️' where name = '마파두부' and emoji is null;
update public.dishes set emoji = '🍛' where name = '계란볶음밥' and emoji is null;
update public.dishes set emoji = '🦑' where name = '짬뽕탕' and emoji is null;
update public.dishes set emoji = '🍝' where name = '알리오올리오' and emoji is null;
update public.dishes set emoji = '🍅' where name = '토마토 파스타' and emoji is null;
update public.dishes set emoji = '🥚' where name = '오므라이스' and emoji is null;
update public.dishes set emoji = '🥩' where name = '스테이크' and emoji is null;
update public.dishes set emoji = '🍛' where name = '카레라이스' and emoji is null;
update public.dishes set emoji = '🍜' where name = '우동' and emoji is null;
update public.dishes set emoji = '🍚' where name = '규동' and emoji is null;
update public.dishes set emoji = '🍢' where name = '떡볶이' and emoji is null;
update public.dishes set emoji = '🍜' where name = '라면' and emoji is null;
