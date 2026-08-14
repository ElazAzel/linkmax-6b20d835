# Демо-аккаунты LinkMAX

Все аккаунты имеют тариф **Business** с полным доступом к функциям.

## Учётные данные

Пароли не хранятся в репозитории. Seed-функция получает пароль из Supabase secret `DEMO_ACCOUNT_PASSWORD`; для authenticated E2E используются GitHub Secrets `E2E_TEST_EMAIL` и `E2E_TEST_PASSWORD`.

| # | Email | Пароль | Slug | Ниша |
|---|-------|--------|------|------|
| 1 | demoaccount1@gmail.com | `E2E_TEST_PASSWORD` | anna_beauty | Beauty |
| 2 | demoaccount2@gmail.com | `E2E_TEST_PASSWORD` | salon_elite | Beauty |
| 3 | demoaccount3@gmail.com | `E2E_TEST_PASSWORD` | coach_arman | Fitness |
| 4 | demoaccount4@gmail.com | `E2E_TEST_PASSWORD` | yoga_studio_zen | Fitness |
| 5 | demoaccount5@gmail.com | `E2E_TEST_PASSWORD` | chef_marat | Food |
| 6 | demoaccount6@gmail.com | `E2E_TEST_PASSWORD` | homecakes_asel | Food |
| 7 | demoaccount7@gmail.com | `E2E_TEST_PASSWORD` | english_pro | Education |
| 8 | demoaccount8@gmail.com | `E2E_TEST_PASSWORD` | math_tutor_dana | Education |
| 9 | demoaccount9@gmail.com | `E2E_TEST_PASSWORD` | artist_aizhan | Art |
| 10 | demoaccount10@gmail.com | `E2E_TEST_PASSWORD` | photo_studio_light | Art |
| 11 | demoaccount11@gmail.com | `E2E_TEST_PASSWORD` | dj_sultan | Music |
| 12 | demoaccount12@gmail.com | `E2E_TEST_PASSWORD` | vocal_coach_alina | Music |
| 13 | demoaccount13@gmail.com | `E2E_TEST_PASSWORD` | webdev_timur | Tech |
| 14 | demoaccount14@gmail.com | `E2E_TEST_PASSWORD` | it_courses_astana | Tech |
| 15 | demoaccount15@gmail.com | `E2E_TEST_PASSWORD` | marketing_agency | Business |
| 16 | demoaccount16@gmail.com | `E2E_TEST_PASSWORD` | accountant_aina | Business |
| 17 | demoaccount17@gmail.com | `E2E_TEST_PASSWORD` | psychologist_laura | Health |
| 18 | demoaccount18@gmail.com | `E2E_TEST_PASSWORD` | massage_studio | Health |
| 19 | demoaccount19@gmail.com | `E2E_TEST_PASSWORD` | stylist_kamila | Fashion |
| 20 | demoaccount20@gmail.com | `E2E_TEST_PASSWORD` | showroom_almaty | Fashion |
| 21 | demoaccount21@gmail.com | `E2E_TEST_PASSWORD` | travel_with_azat | Travel |
| 22 | demoaccount22@gmail.com | `E2E_TEST_PASSWORD` | tour_agency_nomad | Travel |
| 23 | demoaccount23@gmail.com | `E2E_TEST_PASSWORD` | realtor_bekzat | Realty |
| 24 | demoaccount24@gmail.com | `E2E_TEST_PASSWORD` | realty_astana | Realty |
| 25 | demoaccount25@gmail.com | `E2E_TEST_PASSWORD` | event_planner_zhanna | Events |
| 26 | demoaccount26@gmail.com | `E2E_TEST_PASSWORD` | animator_kids | Events |
| 27 | demoaccount27@gmail.com | `E2E_TEST_PASSWORD` | cleaning_crystal | Services |
| 28 | demoaccount28@gmail.com | `E2E_TEST_PASSWORD` | handyman_sergey | Services |

## Быстрый доступ к страницам

Все страницы доступны по адресу: `/{slug}`

Например: `/anna_beauty`, `/coach_arman`, `/chef_marat`
