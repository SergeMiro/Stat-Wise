# 03 — Ключи и инстансы: что реально нужно, а что нет

Вопрос: «инстанс или ключ — как получить, не понимаю».

Короткий ответ: **для того, что нам нужно в первую очередь, ничего получать не
надо.** Во Франции есть официальные сервисы без ключа и без регистрации. Ниже —
четыре уровня, от «работает сегодня» до «нужна карта».

Этот документ **исправляет** `NOTES/01` §7, где я написал, что нужен
self-hosted GraphHopper. Для расстояний дом↔работа и дом↔магазин он не нужен.

---

## Уровень 0 — работает сегодня, получать нечего

Проверено живыми запросами 2026-07-30.

### BAN — адрес → координаты

```
https://api-adresse.data.gouv.fr/search/?q=1+place+de+la+Liberation+Dijon&limit=1
```

Ключа нет. Регистрации нет. Отдаёт координаты, код коммуны, почтовый индекс.
Лимит публичного инстанса — 50 запросов/с с одного IP, массовый геокодинг
делается отдельным endpoint `/search/csv/`.

### IGN Géoplateforme — маршрут

```
https://data.geopf.fr/navigation/itineraire
  ?resource=bdtopo-osrm&profile=car&optimization=fastest
  &start=5.0415,47.3216&end=4.8357,45.7640
```

Ключа нет. Регистрации нет. Проверено: Dijon → Lyon = **194 664 м, 8 443 с**
(194,7 км, 2 ч 20). Это настоящие значения по дорожной сети, а не по прямой.

Профили: **`car` и `pedestrian`**. Проверил все три ресурса
(`bdtopo-osrm`, `bdtopo-valhalla`, `bdtopo-pgr`) — **велосипеда нет ни в одном**,
API прямо отвечает `value should be one of car,pedestrian`.

### Что это закрывает

Ровно требование **B** из `NOTES/01`: заменить заглушки `distanceToJobKm` и
`distanceToGroceryKm` настоящими маршрутами. Плюс цену топлива по станциям —
там ключ тоже не нужен, датасет prix-carburants открыт.

Правило §2.2 (никаких живых вызовов на пользовательский расчёт) при этом не
нарушается: вызовы делаются **на этапе сборки снапшота**, результат кладётся в
данные. Значит суточные квоты почти не важны — несколько тысяч запросов один раз,
а не на каждого посетителя.

---

## Уровень 1 — бесплатный ключ, 5 минут, без карты

Нужен **только для велосипедных маршрутов**, которых нет у IGN.

**GraphHopper Directions API:** регистрация на `graphhopper.com` → в личном
кабинете появляется API key → подставляется в URL как `?key=...`. Бесплатный
тариф — порядка нескольких сотен запросов в день, карта не требуется.

«Ключ» — это просто длинная строка, которую сервис выдаёт после регистрации и
которую мы кладём в `.env.local` (в git она не попадает, как `ADMIN_PASSWORD`).

Стоит ли: велосипед у нас — режим `actif`, и его стоимость всё равно
пользовательская гипотеза (амортизация), а расстояние можно взять пешеходное.
То есть **можно обойтись без этого ключа**, и я бы обошёлся.

---

## Уровень 2 — свой сервер (инстанс)

«Инстанс» — это когда мы сами запускаем сервис на своём VPS, вместо того чтобы
обращаться к чужому. Плюс: нет лимитов и нет чужих правил. Минус: надо держать.

Нужен **только для общественного транспорта** — публичного бесплатного сервиса,
который считал бы маршруты по всем французским сетям, не существует.

| Сервис                        | Что даёт                                       | Что нужно на сервере                                                        |
| ----------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| **OpenTripPlanner**           | маршруты TC, остановки, расписания, пересадки  | Java, выгрузка OSM по региону + GTFS каждой сети, ориентировочно 4–8 ГБ RAM |
| **GraphHopper** (self-hosted) | авто, пешком, **велосипед**, матрицы, изохроны | Java, выгрузка OSM Франции (~4 ГБ), ориентировочно 8 ГБ RAM                 |
| **Nominatim** (self-hosted)   | геокодинг без лимитов                          | PostgreSQL + PostGIS, десятки ГБ диска, самый тяжёлый из трёх               |

VPS у нас уже есть (Hetzner). Nominatim поднимать смысла нет — BAN лучше для
Франции и бесплатен. OTP — единственный, ради которого сервер действительно
нужен, и только когда возьмёмся за маршруты на транспорте.

---

## Уровень 3 — Google, нужна банковская карта

`@googlemaps/places` и `@googlemaps/routing` из выбранного стека — это
**платные** API Google Cloud. Порядок действий: аккаунт Google Cloud → проект →
привязка **billing account с картой** → включить нужные API → создать API key.
Есть ежемесячный бесплатный кредит, но карту привязать обязательно.

Плюс ограничения, которые я уже фиксировал в `NOTES/01` §6: рейтинги, отзывы и
фото Places нельзя долго хранить и нельзя показывать вне контекста Google-карты.
Прежде чем закладывать их в платный отчёт, надо прочитать действующие условия.

MapLibre GL JS ключа не требует вообще — это библиотека, а не сервис. Но ей нужны
тайлы карты: бесплатно их отдаёт IGN Géoplateforme (`data.geopf.fr`), то есть
опять без ключа.

---

## Что я предлагаю делать

```text
сейчас   Уровень 0: BAN + IGN → настоящие расстояния и цена топлива по станциям
позже    Уровень 2: OTP на VPS, когда возьмёмся за маршруты общественного транспорта
позже    Уровень 3: Google, только если отзывы и рейтинги реально нужны продукту
пропустить Уровень 1 и self-hosted Nominatim — они нам не нужны
```

Уровень 0 не требует от тебя **ничего**: ни регистрации, ни карты, ни сервера.

## Чего он всё-таки потребует от нас

Это не десять минут работы, и вот почему — честно:

1. **Координаты районов.** Сейчас у 96 районов их нет: район — это имя плюс
   архетип. Чтобы посчитать маршрут, нужна точка на каждый район (центроид IRIS
   или хотя бы точка привязки).
2. **Точки продуктовых магазинов** из INSEE BPE, чтобы искать ближайший, а не
   брать заглушку.
3. **ETL-скрипт**, который один раз обходит всё это, зовёт BAN и IGN, и пишет
   результат в снапшот — с датой снятия.

То есть работа есть, но она **вся на нашей стороне** и не ждёт ничьих ключей.

---

## Résultat de la première passe ETL — 2026-07-31

`node --experimental-strip-types scripts/etl/build-job-distances.ts`

**67 quartiers sur 93 mesurés.** Les 26 autres gardent la valeur du modèle et
portent l'étiquette `modélisé` dans le tableau — jamais une distance mesurée
depuis un autre endroit.

### Ce qui a été appris

**BAN ne convient pas pour ancrer un quartier.** C'est un géocodeur d'adresses :
« Le Marais, Paris » renvoie « Rue Le Marois 75016 », un autre lieu dans un autre
arrondissement, avec un score plausible de 0,56. Les ancrages viennent donc des
nœuds `place` d'OpenStreetMap, qui sont les quartiers eux-mêmes.

**`area[...]` fait tomber Overpass en 504** sous charge. Un bbox autour de la
mairie fonctionne et coûte bien moins cher.

**Overpass répond 429 puis 504 très souvent.** Le script fait quatre tentatives
avec attente croissante ; sans cela la passe échoue à moitié.

### Les deux défauts trouvés, et ce qui a été fait

**1. Le tag OSM `shop=supermarket` couvre aussi les petites épiceries.** Sur les
67 commerces trouvés, **32 ne sont pas une grande enseigne** : Biocoop, Naturalia,
« Alimentation Générale », monop'. La distance mesurée est donc plus courte que
celle des courses hebdomadaires réelles, ce qui flatte le centre-ville.

Ce n'est pas caché : le **nom du commerce est affiché** à côté des kilomètres, et
la mise en garde de la source le dit. Le lecteur voit « 0,4 km — Biocoop » et
juge lui-même. L'impact en euros est petit (1–2 €/mois), l'impact sur la
crédibilité ne l'est pas.

_À faire ensuite :_ refaire la passe commerces en exigeant `shop=hypermarket` ou
une enseigne connue, en réutilisant les ancrages déjà enregistrés — 14 appels
Overpass et 67 itinéraires, pas la passe complète.

**2. Une distance réelle peut s'arrondir à 0,0 km.** Confluence → Carrefour et
Libération → mairie sont tombés à zéro. Dans ce projet un zéro veut dire « ne
coûte rien » et une absence veut dire « inconnu » : ni l'un ni l'autre n'est vrai
ici, le trajet existe, il est juste court. Les distances mesurées sont donc
plancherées à 100 m (`atLeastAStep`). Le test qui exigeait `groceryKm > 0` a
attrapé exactement ça.

### Quartiers sans ancrage

```
Avignon en entier (5)          — aucun nom ne correspond à un nœud place
Nantes presque en entier (6)   — idem
Saint-Apollinaire (2)          — commune trop petite, et 0 commerce trouvé
Isolés : Presqu'île (Lyon), Grande Île / Neustadt / Orangerie (Strasbourg),
Centre / Moulins (Lille), Écusson (Montpellier), Saint-Pierre (Bordeaux),
Cours Julien / Prado – Castellane (Marseille), Riquier (Nice),
Chevreul – Parc (Dijon)
```

La cause est presque toujours un nom différent dans OSM, pas un quartier absent.
Le remède n'est pas un ajustement du script mais une table de correspondance
`notre nom → nom OSM`, à écrire à la main et à relire — donc une décision, pas
un bricolage automatique.
