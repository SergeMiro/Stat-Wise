# StatWise — технический и продуктовый план V1

> **Статус:** спецификация для AI-агента, который реализует приложение.
>
> **Цель документа:** описать, что именно строить, в каком порядке, какие сущности и данные использовать, какие ограничения соблюдать и каким должен быть результат каждой стадии.
>
> **Стек:** Next.js + TypeScript + Supabase + PostgreSQL/PostGIS.
>
> **Подход:** Mobile First, App Router, Server Components по умолчанию, строгая типизация, проверяемые расчёты, официальные данные Франции.

---

## 0. Краткое резюме проекта

**StatWise** — веб-приложение для Франции, которое превращает официальные пространственные и социальные данные в понятные решения о выборе места для жизни.

### Название и слоганы

**Бренд:** `StatWise`

**Английский слоган:**

> Make better life decisions with data.

**Французский слоган:**

> Prenez de meilleures décisions pour votre vie grâce aux données.

На одной локализованной странице всегда показывать **только один** слоган: французский для `fr`, английский для `en`. Не показывать два слогана одновременно в шапке или hero-блоке.

### Продуктовое обещание V1

> Помочь человеку понять, какие районы выбранного французского города подходят именно его образу жизни, бюджету и семье — и объяснить это через прозрачные данные.

### V1 включает только два симулятора

1. **Trouver mon quartier / Find my neighbourhood**
   - поиск и ранжирование подходящих районов выбранного города;
   - учёт жилья, бюджета, транспорта, услуг, медицины, спокойствия и пользовательских приоритетов.

2. **Grandir ici / Raising a child here**
   - сравнение районов для семьи и ребёнка;
   - учёт crèches, школ, медицины, спорта, парков, повседневной инфраструктуры, транспорта и доступных показателей спокойствия/безопасности.

### V1 не включает

- международные сравнения и переезды между странами;
- расчёт налогов, CAF, пособий, ипотеки или зарплаты по профессии;
- объявления недвижимости;
- платежи и подписки;
- чат-бота и сложных AI-агентов;
- пользовательские отзывы как основной источник данных;
- точные домашние адреса, документы, доходы, медицинские данные или данные о ребёнке;
- «магический» единый балл качества жизни без объяснения факторов.

---

# 1. Основные продуктовые принципы

## 1.1. Что пользователь должен получить

Пользователь не должен увидеть просто карту и 200 показателей. Он должен получить ответ:

> «Какие зоны этого города стоит реально рассматривать с моими ограничениями и почему?»

Для семейного сценария:

> «Какой из выбранных районов практичнее для жизни с ребёнком сейчас и в ближайшие годы?»

## 1.2. Что нельзя обещать

Приложение не должно писать:

- «Этот район объективно лучший»;
- «Этот район безопасен для детей»;
- «Вам гарантировано место в crèche»;
- «Ваш ребёнок точно попадёт в эту школу»;
- «Вы будете жить на X% лучше»;
- «Это точная цена аренды конкретной квартиры».

Допустимые формулировки:

- «Этот район лучше соответствует выбранным вами критериям»;
- «Показатель доступен на уровне commune, а не микрорайона»;
- «Ориентировочный диапазон, рассчитанный по доступным данным»;
- «Наличие учреждения не означает наличие свободных мест»;
- «Проверьте конкретный адрес и условия перед принятием решения».

## 1.3. Принцип прозрачности

Каждый значимый балл в интерфейсе должен иметь:

- понятное название;
- краткое объяснение, что он измеряет;
- источники;
- дату/версию данных;
- географический уровень точности (`IRIS`, `commune`, `département` и т. п.);
- уровень уверенности (`high`, `medium`, `low`, `unavailable`);
- список факторов, которые повлияли на оценку.

## 1.4. Разделение типов данных

Нельзя смешивать в одной метрике без явного пояснения:

- зарплаты работников;
- `revenu médian par unité de consommation`;
- расходы домохозяйств;
- стоимость покупки жилья;
- стоимость аренды;
- показатели инфраструктуры;
- зарегистрированную преступность.

Это разные показатели с разной методологией и географической точностью.

---

# 2. Технические цели и ограничения

## 2.1. Обязательный стек

- **Next.js** с **App Router**;
- **TypeScript** в строгом режиме;
- **Supabase**:
  - PostgreSQL;
  - Auth;
  - Storage;
  - Row Level Security;
  - SQL migrations;
- **PostGIS** для географических запросов;
- Mobile First UI;
- серверная обработка расчётов;
- формулы расчёта должны быть независимы от React/UI;
- библиотеки интерфейса, карт, форм, валидации и тестов выбираются отдельно, но архитектура не должна быть к ним жёстко привязана.

## 2.2. Обязательные инженерные правила

- `strict: true` в TypeScript;
- не использовать `any` без явного и документированного исключения;
- не помещать бизнес-логику в React-компоненты;
- не обращаться к внешним государственным API при каждом пользовательском расчёте;
- не использовать Supabase service key в браузере;
- не хранить секреты в git;
- все мутации должны проходить серверную авторизацию;
- RLS включить на всех пользовательских таблицах, доступных через Supabase API;
- все расчёты должны быть воспроизводимы по версии формулы и версии данных;
- не публиковать raw-DVF данные по адресам или сделкам;
- не выдавать ноль там, где данных просто нет.

---

# 3. Целевая архитектура

```text
Публичные официальные источники
        ↓
Импортёр / job / ручной запуск администратора
        ↓
Raw storage + import log
        ↓
Валидация и нормализация
        ↓
PostgreSQL + PostGIS агрегаты
        ↓
Scoring engine (чистая TypeScript-доменная логика)
        ↓
Next.js Server Components / Server Actions / Route Handlers
        ↓
Mobile-first интерфейс StatWise
```

## 3.1. Роли Next.js

### Server Components

Использовать для:

- публичных SEO-страниц;
- загрузки агрегированных данных;
- страницы результата;
- страниц методологии и источников;
- dashboard пользователя;
- безопасного server-side чтения данных.

### Client Components

Использовать только для интерактива:

- пошаговый мастер симуляции;
- карта;
- фильтры;
- слайдеры бюджета;
- выбор приоритетов;
- сравнение районов;
- локальное сохранение черновика.

### Server Actions

Использовать для:

- создания симуляции;
- сохранения черновика;
- сохранения результатов;
- добавления избранного района;
- удаления симуляции;
- обновления профиля;
- экспорта результатов в будущем.

Любая Server Action должна повторно проверять авторизацию и право пользователя на запись/изменение сущности.

### Route Handlers

Использовать для:

- внутренних endpoint для запуска импорта;
- администраторских операций;
- PDF export в будущей версии;
- webhooks в будущем;
- health check;
- защищённой выдачи агрегатов для карты, если Server Components недостаточно.

---

# 4. Географическая модель Франции

Слово `quartier` не является единым техническим уровнем во всех городах Франции. Поэтому использовать стандартизированную многоуровневую географию.

| Уровень | Технический объект | Основное использование |
|---|---|---|
| Город/коммуна | `commune` | поиск города, аренда, APL, преступность, общие показатели |
| Внутригородская зона | `IRIS` | основной уровень ранжирования районов |
| Особый городской уровень | `arrondissement` / `secteur` | Paris, Lyon, Marseille, когда нужен понятный слой интерфейса |
| Точка/радиус | `point of interest` | школа, crèche, врач, парк, спортивный объект, транспорт |

## 4.1. Базовое правило V1

- использовать **IRIS** как основной уровень расчёта внутри города;
- если для территории нет IRIS или покрытие недостаточное — использовать `commune`;
- всегда отображать фактический уровень точности в UI;
- не называть IRIS «официальным районом», если его название не соответствует привычному району города; в UI можно писать «zone analysée» / «analysed area».

---

# 5. Источники данных для V1

Все источники должны быть зарегистрированы в таблице `reference.data_sources` с URL, лицензией, периодичностью обновления, географическим уровнем, ограничениями использования и версией импорта.

## 5.1. Обязательные источники

| Источник | Что использовать | Географический уровень | Ограничение |
|---|---|---|---|
| INSEE BPE | магазины, услуги, спорт, здоровье, транспорт, культура, часть образования | точка / commune / иногда мелкая зона | наличие объекта не равно качеству или свободным местам |
| DVF / API données foncières | реальные сделки продажи жилья, агрегаты цены м² | адрес/сделка → агрегировать до IRIS/commune | нельзя допускать реидентификацию или SEO-индексацию сделок |
| Carte des loyers | ориентиры арендной платы | прежде всего commune | не использовать как точную районную аренду без локального источника |
| Annuaire Éducation nationale | адреса и типы школ | точка | не гарантирует sectorisation или зачисление |
| APL | доступность медицинской помощи | commune | показатель не заменяет ближайшего врача и запись к нему |
| Délinquance enregistrée | зарегистрированные преступления | commune / département / région | не называть это «реальной преступностью» или районной безопасностью |
| INSEE local statistics / Filosofi при необходимости | доходы, бедность, демография | commune / IRIS / grid по доступности | не путать с индивидуальной зарплатой |

## 5.2. Проверяемые официальные точки входа

Перед реализацией агент обязан проверить актуальность URL, лицензию, формат файлов и доступность API.

- Next.js App Router: `https://nextjs.org/docs/app`
- Next.js Route Handlers: `https://nextjs.org/docs/app/getting-started/route-handlers`
- Next.js Server Actions/Data Security: `https://nextjs.org/docs/app/guides/data-security`
- Supabase SSR: `https://supabase.com/docs/guides/auth/server-side`
- Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase PostGIS: `https://supabase.com/docs/guides/database/extensions/postgis`
- DVF: `https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres`
- API données foncières: `https://www.data.gouv.fr/dataservices/api-donnees-foncieres`
- INSEE BPE: `https://www.insee.fr/fr/metadonnees/source/serie/s1161`
- Carte des loyers: `https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025`
- Éducation nationale: `https://data.education.gouv.fr/explore/assets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/`
- APL: `https://www.data.gouv.fr/datasets/laccessibilite-potentielle-localisee-apl`
- Délinquance enregistrée: `https://www.data.gouv.fr/datasets/bases-statistiques-communale-departementale-et-regionale-de-la-delinquance-enregistree-par-la-police-et-la-gendarmerie-nationales`

## 5.3. Политика данных недвижимости

Для стоимости покупки:

- использовать медиану `price_per_m2`, не среднее между минимумом и максимумом;
- считать `P25`, `P50`, `P75`;
- сегментировать минимум по `appartement` и `maison`;
- по возможности сегментировать по диапазону площади и количеству комнат;
- не строить оценку, если недостаточно сделок;
- показывать `transaction_count` и `confidence`;
- фильтровать выбросы и некорректные значения;
- хранить агрегаты, а не давать публичный доступ к сырым сделкам.

Неверная формула, которую нельзя использовать:

```text
(min price/m² + max price/m²) / 2
```

## 5.4. Политика отсутствующих данных

В модели должны существовать отдельные состояния:

```text
value = 0                 → действительно ноль
value = null              → значение неизвестно
coverage = unavailable    → источник не покрывает территорию
confidence = low          → данные есть, но их недостаточно для сильного вывода
```

---

# 6. Функционал V1 №1 — Trouver mon quartier

## 6.1. Цель

Дать пользователю короткий список зон, которые подходят его критериям в выбранном французском городе.

Главный вопрос интерфейса:

> «В каких районах мне стоит смотреть жильё?»

## 6.2. Входные данные пользователя

### Шаг 1. Город

- поиск `commune` по названию;
- поиск по postal code;
- выбор из списка;
- в V1 — один город на одну симуляцию.

### Шаг 2. Тип жилья

- `rent` / `buy` / `both`;
- `apartment` / `house` / `any`;
- желаемое число комнат: опционально;
- желаемая площадь: опционально.

### Шаг 3. Бюджет

Для аренды:

- максимальный ежемесячный бюджет;
- флаг: бюджет с charges или без charges;
- сумма необязательна, если пользователь хочет только исследовать районы.

Для покупки:

- максимальный бюджет покупки;
- желаемая площадь;
- тип жилья.

Не включать ипотечную модель в V1.

### Шаг 4. Жизненная ситуация

- один человек;
- пара;
- семья;
- семья с ребёнком;
- наличие автомобиля;
- готовность пользоваться общественным транспортом;
- наличие конкретной точки: работа, центр, вокзал, адрес родственников — только как опциональная пользовательская точка, не сохранять её по умолчанию.

### Шаг 5. Приоритеты

Показывать понятные уровни:

- Не важно;
- Немного важно;
- Важно;
- Критично.

Категории:

- доступность жилья;
- транспорт;
- близость к центру / заданной точке;
- ежедневные услуги;
- медицина;
- спорт и досуг;
- спокойствие;
- семья и ребёнок;
- природа и прогулки.

Внутреннее преобразование весов:

```text
not_important = 0
somewhat_important = 1
important = 2
critical = 3
```

### Шаг 6. Жёсткие ограничения

Жёсткое ограничение исключает зону до ранжирования.

Примеры:

- жильё не должно быть дороже заданного бюджета;
- нужна школа / crèche рядом;
- нужен общественный транспорт;
- максимум N минут до указанной точки;
- нужен тип жилья;
- требуется определённое число комнат.

## 6.3. Порядок расчёта

```text
1. Получить все IRIS выбранной commune.
2. Загрузить доступные агрегаты и POI.
3. Применить hard constraints.
4. Исключить зоны, не соответствующие критичным условиям.
5. Рассчитать категориальные scores.
6. Нормализовать значения внутри сравниваемой территории.
7. Применить веса пользователя.
8. Рассчитать confidence.
9. Сформировать ранжированный список.
10. Сформировать объяснение: почему зона вошла в топ и какие есть ограничения.
```

## 6.4. Категории score

### Housing Score

Компоненты:

- соответствие бюджету;
- `median_price_per_m2`;
- `P25/P75`;
- число сделок;
- тип жилья;
- доступность аренды на уровне commune;
- качество и покрытие данных.

### Mobility Score

Компоненты:

- близость к транспортным точкам;
- расстояние/время до центра или пользовательской точки;
- наличие базового транспорта;
- пешая доступность ежедневных услуг;
- если маршрутная матрица отсутствует в V1 — использовать честно обозначаемое геометрическое расстояние, а не выдавать его за реальное время в пути.

### Daily Services Score

Компоненты:

- магазины;
- аптеки;
- почтовые/административные сервисы;
- базовые услуги;
- культурные и спортивные объекты.

### Health Score

Компоненты:

- врачи, аптеки, медицинские центры рядом;
- hospital/urgences как расстояние до объекта;
- APL на уровне commune;
- не смешивать локальные точки и APL без отметки уровня данных.

### Tranquillité Score

Компоненты:

- доступные показатели зарегистрированной преступности по commune;
- динамика, если доступна;
- плотность/городской контекст при наличии проверяемых данных;
- парки и прогулочные зоны могут влиять на отдельный `NatureScore`, а не маскироваться под безопасность.

### Family Score

Компоненты:

- crèches;
- школы;
- спорт;
- медицина;
- парки;
- транспорт;
- ежедневные услуги.

## 6.5. Формула ранжирования

Все расчёты должны быть реализованы в domain layer, без React.

```text
rawScore(area) =
  housingScore    × housingWeight
+ mobilityScore   × mobilityWeight
+ servicesScore   × servicesWeight
+ healthScore     × healthWeight
+ tranquillityScore × tranquillityWeight
+ familyScore     × familyWeight
+ natureScore     × natureWeight
```

```text
finalScore(area) = rawScore(area) × dataConfidence(area)
```

### Важное правило

`dataConfidence` не должен несправедливо «наказывать» зону, если показатель вообще не нужен пользователю. Confidence вычислять по используемым критериям, а не по всем существующим метрикам.

## 6.6. Результат симулятора

Показывать:

- топ 3–10 зон;
- карту;
- карточку каждого района;
- сравнение до 3 зон;
- категории score;
- сильные стороны;
- ограничения;
- источники;
- версию данных;
- уровень точности;
- кнопку «Перейти к симулятору для ребёнка» с уже выбранными зонами.

Пример структуры карточки:

```text
Zone: [название]
Overall match: 82/100
Data confidence: Medium

Why it fits:
- budget compatibility is above average
- strong access to daily services
- several schools and sports facilities nearby

Things to verify:
- rent value is commune-level only
- safety data is commune-level only
- crèche availability is not guaranteed
```

---

# 7. Функционал V1 №2 — Grandir ici

## 7.1. Цель

Помочь семье сравнить до трёх районов через потребности ребёнка и повседневной жизни.

Главный вопрос:

> «Подходит ли этот район для нашей семьи и ребёнка?»

## 7.2. Минимальные входные данные

Не собирать персональные данные ребёнка. Нужны только:

- количество детей: `1`, `2`, `3+`;
- возрастная группа:
  - `0–2`;
  - `3–5`;
  - `6–10`;
  - `11–14`;
  - `15–17`;
- нужны ли crèches;
- важны ли школы;
- важен ли спорт;
- важны ли врачи;
- важна ли природа;
- важен ли общественный транспорт;
- важна ли спокойная среда.

## 7.3. Возрастные сценарии

### 0–2 года

Усиливать веса:

- crèches;
- аптеки;
- врачи/медицинские центры;
- продуктовые магазины;
- парки;
- транспорт родителей;
- спокойствие.

### 3–5 лет

Усиливать веса:

- école maternelle;
- crèche/garderie;
- парки;
- спорт;
- близкие услуги;
- короткие маршруты.

### 6–10 лет

Усиливать веса:

- école élémentaire;
- спорт;
- библиотеки;
- парки;
- кружки/культурные точки, если доступны;
- безопасная и удобная повседневная среда.

### 11–14 лет

Усиливать веса:

- collège;
- транспорт;
- спорт;
- культурные места;
- возможность самостоятельного перемещения;
- медицина.

### 15–17 лет

Усиливать веса:

- lycée;
- транспорт;
- спорт;
- учебные и культурные места;
- доступность большого города/вокзала, если это приоритет пользователя.

## 7.4. Категории результата

1. **Éducation**
   - учреждения поблизости;
   - тип и сектор: public/privé;
   - пешая/геометрическая доступность;
   - без утверждений о качестве школы и зачислении.

2. **Petite enfance**
   - crèches, relais, детские услуги;
   - расстояние;
   - без утверждения о свободных местах.

3. **Santé**
   - врачи, аптеки, медцентры;
   - уровень APL на уровне commune;
   - расстояние до больницы/urgences, если есть корректный источник.

4. **Sport, loisirs et nature**
   - спортзалы;
   - бассейны;
   - стадионы;
   - библиотеки;
   - парки;
   - культурные объекты;
   - пешая доступность.

5. **Vie quotidienne et mobilité**
   - магазины;
   - транспорт;
   - доступность услуг;
   - удобство ежедневной логистики.

6. **Tranquillité**
   - только аккуратно сформулированные официальные показатели зарегистрированной преступности;
   - обязательное указание географического уровня;
   - без эмоциональных заключений.

## 7.5. Результат симулятора

Для каждой зоны показывать:

- `Family fit score`;
- категориальные подоценки;
- возрастной контекст;
- сильные стороны;
- что проверить вручную;
- источники;
- ограничения данных.

Пример:

```text
Подходит лучше всего для:
- семьи с ребёнком 3–10 лет;
- семьи, которой важны школа, спорт и ежедневные услуги;
- семьи с автомобилем или готовностью пользоваться транспортом.

Нужно проверить перед переездом:
- наличие мест в crèche;
- sectorisation scolaire по конкретному адресу;
- реальную стоимость аренды конкретной квартиры;
- время пути в часы пик.
```

---

# 8. Mobile First UX-спецификация

## 8.1. Базовые правила

Проектировать сначала для ширины `360–430px`, затем адаптировать под tablet и desktop.

- один основной CTA на экран;
- крупные click/tap targets;
- короткие шаги формы;
- прогресс-бар мастера;
- карта не должна быть единственным способом понять результаты;
- карточки и сравнения должны читаться без горизонтальной прокрутки;
- длинные объяснения скрывать в раскрывающиеся блоки;
- данные сохранять в черновик после каждого значимого шага;
- пользователь должен иметь кнопку «назад» без потери ввода;
- учитывать плохую сеть и повторное открытие страницы.

## 8.2. Основные маршруты

```text
/
/fr
/en

/[locale]/methodology
/[locale]/sources
/[locale]/coverage
/[locale]/privacy
/[locale]/terms

/[locale]/sign-in
/[locale]/sign-up
/[locale]/auth/callback

/[locale]/app
/[locale]/app/dashboard
/[locale]/app/simulations
/[locale]/app/simulations/new
/[locale]/app/simulations/[simulationId]
/[locale]/app/simulations/[simulationId]/result

/[locale]/app/quartier/new
/[locale]/app/quartier/result/[simulationId]

/[locale]/app/family/new
/[locale]/app/family/result/[simulationId]

/[locale]/app/favorites
/[locale]/app/account
```

## 8.3. Навигация

На мобильном после входа:

```text
Accueil | Simuler | Favoris | Résultats | Compte
```

На desktop можно использовать sidebar или верхнюю навигацию.

## 8.4. Главная страница

Hero для французской версии V1:

```text
Trouvez le quartier adapté à votre vie et à votre famille.
```

Hero для английской версии V1:

```text
Find the right neighbourhood for your life and family.
```

На главной:

- карточка симулятора района;
- карточка симулятора семьи/ребёнка;
- кратко «как это работает»;
- ссылки на методологию и источники;
- disclaimer: результаты являются ориентировочными и основаны на доступных официальных данных.

---

# 9. Структура исходного кода

```text
src/
├── app/
│   ├── [locale]/
│   ├── api/
│   ├── actions/
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── simulation/
│   ├── maps/
│   ├── score-cards/
│   ├── data-confidence/
│   ├── sources/
│   └── mobile/
│
├── domain/
│   ├── geography/
│   ├── housing/
│   ├── mobility/
│   ├── services/
│   ├── education/
│   ├── health/
│   ├── safety/
│   ├── family/
│   ├── scoring/
│   ├── simulations/
│   └── reporting/
│
├── server/
│   ├── supabase/
│   ├── repositories/
│   ├── services/
│   ├── data-connectors/
│   ├── importers/
│   ├── jobs/
│   ├── validators/
│   └── auth/
│
├── lib/
│   ├── i18n/
│   ├── security/
│   ├── dates/
│   ├── geo/
│   └── formatting/
│
├── types/
├── config/
└── tests/
```

## 9.1. Правила зависимостей

- `components` не должны содержать расчётную логику;
- `domain` не должен импортировать React, Next.js или Supabase client;
- `server` может импортировать `domain`, но не наоборот;
- `data-connectors` отвечают только за получение/нормализацию данных источников;
- `repositories` отвечают только за доступ к БД;
- `services` оркестрируют use cases;
- `app` собирает UI и серверные вызовы;
- UI получает уже подготовленные view models, а не сырые database rows.

---

# 10. Supabase и модель базы данных

## 10.1. PostgreSQL extensions

Обязательно включить:

```sql
create extension if not exists postgis;
create extension if not exists pgcrypto;
```

Опционально в будущем:

```sql
create extension if not exists pg_trgm;
```

`pg_trgm` можно использовать для быстрого поиска коммун и альтернативных названий.

## 10.2. Схемы БД

Рекомендуемая логическая организация:

```text
reference  — справочники и география
analytics  — агрегаты, метрики, результаты импорта
public     — минимальные таблицы, доступные пользователю через API с RLS
private    — внутренние/чувствительные данные, не expose через client API
audit      — технические журналы
```

Если Supabase-проект expose только `public`, не выдавать API-доступ к `reference`, `analytics`, `private` напрямую. Для публичного чтения использовать безопасные views/RPC или server-side access.

## 10.3. Географические таблицы

### `reference.geo_communes`

```text
id uuid primary key
insee_code text unique not null
name text not null
normalized_name text not null
postal_codes text[]
department_code text
region_code text
population integer null
geometry geometry(MultiPolygon, 4326)
centroid geometry(Point, 4326)
created_at timestamptz
updated_at timestamptz
```

Индексы:

- GIST на `geometry`;
- GIST на `centroid`;
- индекс на `insee_code`;
- trigram/normalised search index на `normalized_name`.

### `reference.geo_iris`

```text
id uuid primary key
iris_code text unique not null
commune_id uuid references reference.geo_communes(id)
name text null
area_type text null
population integer null
geometry geometry(MultiPolygon, 4326) not null
centroid geometry(Point, 4326) not null
data_coverage_score numeric null
created_at timestamptz
updated_at timestamptz
```

Индексы:

- GIST на `geometry`;
- GIST на `centroid`;
- btree на `commune_id`;
- btree на `iris_code`.

### `reference.points_of_interest`

```text
id uuid primary key
source_id uuid references reference.data_sources(id)
external_id text null
category text not null
subcategory text null
name text null
commune_id uuid references reference.geo_communes(id)
iris_id uuid references reference.geo_iris(id)
geometry geometry(Point, 4326) not null
metadata jsonb not null default '{}'
source_updated_at timestamptz null
imported_at timestamptz not null
```

Индексы:

- GIST на `geometry`;
- btree на `commune_id`;
- btree на `iris_id`;
- btree на `(category, subcategory)`;
- уникальность `(source_id, external_id)` если `external_id` доступен.

## 10.4. Каталог источников и метрик

### `reference.data_sources`

```text
id uuid primary key
code text unique not null
name text not null
publisher text not null
source_url text not null
license text null
refresh_frequency text null
geographic_level text[] not null
legal_notes text null
is_active boolean not null default true
last_verified_at timestamptz null
created_at timestamptz
updated_at timestamptz
```

### `reference.metric_definitions`

```text
id uuid primary key
metric_code text unique not null
label_fr text not null
label_en text not null
description_fr text not null
description_en text not null
unit text not null
direction text not null
calculation_method text not null
minimum_coverage_required numeric null
expected_geographic_level text[] not null
source_id uuid references reference.data_sources(id)
is_public boolean not null default true
created_at timestamptz
updated_at timestamptz
```

`direction`:

```text
higher_is_better
lower_is_better
neutral
contextual
```

### `analytics.metric_values`

```text
id uuid primary key
area_type text not null
area_id uuid not null
metric_id uuid references reference.metric_definitions(id)
value numeric null
value_text text null
year integer null
period_start date null
period_end date null
source_version text not null
confidence_score numeric not null
coverage_score numeric not null
calculated_at timestamptz not null
metadata jsonb not null default '{}'
```

Уникальный ключ:

```text
(area_type, area_id, metric_id, source_version, period_start, period_end)
```

## 10.5. Жильё

### `analytics.housing_sale_aggregates`

```text
id uuid primary key
area_type text not null
area_id uuid not null
property_type text not null
surface_bucket text null
rooms_bucket text null
period_start date not null
period_end date not null
transaction_count integer not null
median_price_m2 numeric null
p25_price_m2 numeric null
p75_price_m2 numeric null
median_sale_price numeric null
confidence_score numeric not null
source_version text not null
created_at timestamptz
```

### `analytics.housing_rent_aggregates`

```text
id uuid primary key
area_type text not null
area_id uuid not null
property_type text null
surface_bucket text null
period_start date not null
period_end date not null
median_rent_m2 numeric null
median_rent_month numeric null
source_scope text not null
confidence_score numeric not null
source_version text not null
created_at timestamptz
```

`source_scope` примеры:

```text
commune
iris
agglomeration
local_observatory
```

## 10.6. Импорты

### `analytics.import_runs`

```text
id uuid primary key
source_id uuid references reference.data_sources(id)
status text not null
started_at timestamptz not null
finished_at timestamptz null
records_received integer null
records_valid integer null
records_rejected integer null
source_version text null
checksum text null
error_log jsonb not null default '[]'
created_at timestamptz not null
```

`status`:

```text
queued
running
succeeded
failed
partial
rolled_back
```

## 10.7. Пользовательские таблицы

### `public.profiles`

```text
id uuid primary key references auth.users(id) on delete cascade
display_name text null
locale text not null default 'fr'
created_at timestamptz not null
updated_at timestamptz not null
```

### `public.simulations`

```text
id uuid primary key
user_id uuid references auth.users(id) on delete cascade
simulation_type text not null
status text not null
title text null
created_at timestamptz not null
updated_at timestamptz not null
deleted_at timestamptz null
```

`simulation_type`:

```text
quartier
family
```

`status`:

```text
draft
processing
completed
failed
archived
```

### `public.simulation_inputs`

```text
id uuid primary key
simulation_id uuid references public.simulations(id) on delete cascade
schema_version text not null
inputs_json jsonb not null
created_at timestamptz not null
```

### `public.simulation_results`

```text
id uuid primary key
simulation_id uuid references public.simulations(id) on delete cascade
engine_version text not null
dataset_version text not null
result_json jsonb not null
confidence_score numeric null
generated_at timestamptz not null
```

### `public.saved_areas`

```text
id uuid primary key
user_id uuid references auth.users(id) on delete cascade
area_type text not null
area_id uuid not null
label text null
created_at timestamptz not null
```

### `public.user_consents`

```text
id uuid primary key
user_id uuid references auth.users(id) on delete cascade
consent_type text not null
consent_version text not null
granted_at timestamptz not null
revoked_at timestamptz null
```

## 10.8. RLS-политики

Включить RLS для всех `public.*` пользовательских таблиц.

Правила:

```text
profiles:
- пользователь читает/обновляет только строку с id = auth.uid()

simulations:
- пользователь читает/создаёт/изменяет/удаляет только строки с user_id = auth.uid()

simulation_inputs:
- доступ только если simulation.user_id = auth.uid()

simulation_results:
- доступ только если simulation.user_id = auth.uid()

saved_areas:
- доступ только если user_id = auth.uid()

user_consents:
- доступ только если user_id = auth.uid()
```

Не полагаться только на RLS: серверные use cases также должны проверять ownership.

---

# 11. TypeScript contracts

## 11.1. Вход симулятора района

```ts
export type PriorityLevel = 0 | 1 | 2 | 3;

export type NeighbourhoodSimulationInput = {
  cityId: string;
  housingMode: 'rent' | 'buy' | 'both';
  propertyType: 'apartment' | 'house' | 'any';
  maxMonthlyRent?: number;
  rentIncludesCharges?: boolean;
  maxPurchaseBudget?: number;
  minSurfaceM2?: number;
  minRooms?: number;
  householdType: 'single' | 'couple' | 'family' | 'family_with_child';
  hasCar?: boolean;
  targetPoint?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
  priorities: {
    housing: PriorityLevel;
    mobility: PriorityLevel;
    dailyServices: PriorityLevel;
    health: PriorityLevel;
    tranquillity: PriorityLevel;
    family: PriorityLevel;
    sportAndLeisure: PriorityLevel;
    nature: PriorityLevel;
  };
  hardConstraints: {
    requireTransport?: boolean;
    requireSchoolNearby?: boolean;
    requireCrecheNearby?: boolean;
    maxDistanceToTargetKm?: number;
    maxBudgetStrict?: boolean;
  };
};
```

## 11.2. Вход симулятора семьи

```ts
export type ChildAgeGroup = '0_2' | '3_5' | '6_10' | '11_14' | '15_17';

export type FamilySimulationInput = {
  cityId: string;
  selectedAreaIds: string[]; // 1–3
  childrenCount: '1' | '2' | '3_plus';
  childAgeGroup: ChildAgeGroup;
  priorities: {
    earlyChildhood: PriorityLevel;
    education: PriorityLevel;
    health: PriorityLevel;
    sportsAndLeisure: PriorityLevel;
    nature: PriorityLevel;
    mobility: PriorityLevel;
    tranquillity: PriorityLevel;
    dailyServices: PriorityLevel;
  };
};
```

## 11.3. Результат расчёта

```ts
export type DataConfidence = 'high' | 'medium' | 'low' | 'unavailable';

export type AreaScore = {
  areaId: string;
  areaName: string;
  overallScore: number | null;
  confidence: DataConfidence;
  categoryScores: Record<string, number | null>;
  strengths: string[];
  caveats: string[];
  sources: Array<{
    code: string;
    label: string;
    sourceUrl: string;
    geographicLevel: string;
    sourceVersion: string;
  }>;
};

export type SimulationResult = {
  simulationType: 'quartier' | 'family';
  engineVersion: string;
  datasetVersion: string;
  generatedAt: string;
  rankedAreas: AreaScore[];
  excludedAreas: Array<{
    areaId: string;
    areaName: string;
    reasons: string[];
  }>;
};
```

---

# 12. Scoring engine

## 12.1. Расположение

```text
src/domain/scoring/
```

Минимальные модули:

```text
normalizeMetric.ts
calculateHousingScore.ts
calculateMobilityScore.ts
calculateServicesScore.ts
calculateHealthScore.ts
calculateTranquillityScore.ts
calculateFamilyScore.ts
calculateNatureScore.ts
calculateDataConfidence.ts
applyHardConstraints.ts
buildAreaRanking.ts
buildResultExplanation.ts
```

## 12.2. Обязательные правила

Scoring engine:

- не импортирует React;
- не импортирует Next.js;
- не вызывает HTTP;
- не выполняет SQL;
- принимает подготовленные domain objects;
- возвращает типизированный результат;
- не скрывает пропуски данных;
- не добавляет AI-генерируемые значения;
- покрывается unit tests.

## 12.3. Нормализация

Нормализация должна выполняться внутри сравниваемого набора зон, а не по всей Франции, если пользователь выбирает один город.

Примеры:

```text
Для метрик «больше лучше»:
normalized = (x - min) / (max - min)

Для метрик «меньше лучше»:
normalized = 1 - ((x - min) / (max - min))
```

Обработка крайних случаев:

- если `max === min`, не делить на ноль;
- если значение отсутствует, не подставлять 0;
- если метрика недоступна только для части зон, снижать confidence и явно пояснять ограничение;
- избегать ложной точности: хранить цифры точно, но выводить пользователю разумно округлённые значения.

## 12.4. Hard constraints до ranking

Пример:

```text
if maxPurchaseBudget exists and p75 purchase price exceeds budget:
  do not automatically exclude unless user selected strict budget;
  mark as weak fit or exclude according to hard constraint.

if requireSchoolNearby and no school exists within configured radius:
  exclude area.

if requireTransport and no eligible transport point exists:
  exclude area.
```

## 12.5. Result explanation

Для каждого результата генерировать структурированное объяснение из фактов, не из LLM:

```text
strengths[]
caveats[]
missingData[]
metricHighlights[]
```

Будущий AI должен получать именно эту структуру и перефразировать её, но не менять числа или делать новые выводы.

---

# 13. Data pipeline

## 13.1. Запрещённая схема

Не делать так:

```text
Пользователь открыл страницу
→ приложение сделало 10 API calls в INSEE/data.gouv
→ формула посчиталась на лету
```

Причины:

- медленно;
- нестабильно;
- зависимость от внешних API;
- сложности с rate limits;
- невозможность версионировать результат;
- плохой UX на мобильном;
- нет контроля качества.

## 13.2. Правильная схема

```text
Source
→ Download/API fetch
→ Raw file in Supabase Storage
→ Validation
→ Normalization
→ Aggregation
→ PostGIS/PostgreSQL tables
→ Data quality checks
→ Publish source version
→ User simulation reads local aggregates
```

## 13.3. Процесс импорта

Для каждого источника создать connector с одинаковым контрактом:

```ts
export interface DataSourceImporter {
  sourceCode: string;
  fetch(): Promise<RawImportArtifact>;
  validate(artifact: RawImportArtifact): Promise<ValidationResult>;
  normalize(artifact: RawImportArtifact): Promise<NormalizedRecord[]>;
  persist(records: NormalizedRecord[]): Promise<PersistResult>;
  aggregate(): Promise<AggregationResult>;
}
```

### Стадии

1. `fetch` — скачать CSV/GeoJSON/API response;
2. `raw storage` — сохранить исходный файл в закрытый bucket;
3. `validate` — схема, колонки, даты, дубликаты, геокоды, значения;
4. `normalize` — привести категории, коды, координаты, даты и названия;
5. `persist` — сохранить в staging/raw tables;
6. `aggregate` — построить метрики по IRIS/commune;
7. `quality checks` — проверить распределения и аномалии;
8. `publish` — активировать новую версию данных;
9. `audit` — записать итог в `analytics.import_runs`.

## 13.4. Staging tables

Для сложных источников использовать временные raw/staging таблицы, не смешивать raw с финальными агрегатами.

Примеры:

```text
staging.dvf_transactions_raw
staging.bpe_raw
staging.education_raw
staging.apl_raw
staging.crime_raw
```

После успешного завершения:

- агрегировать;
- обновить `source_version`;
- не разрушать предыдущую опубликованную версию, пока новая не прошла проверки.

## 13.5. Data quality checks

Обязательные проверки:

- корректность `INSEE code`;
- координаты находятся во Франции;
- цена/площадь/сумма не отрицательные;
- `price_per_m2` находится в допустимом диапазоне, выбросы маркируются;
- нет массового провала числа записей против прошлого импорта;
- обязательные категории BPE не исчезли;
- геометрии валидны;
- количество IRIS и communes ожидаемое;
- процент записей без координат виден в import summary;
- dataset version и дата источника сохраняются.

---

# 14. Аутентификация, сессии и аккаунты

## 14.1. Гостевой режим

Гость должен иметь возможность:

- начать симуляцию;
- пройти все шаги;
- увидеть ограниченный результат;
- сохранить черновик в local storage/secure browser storage;
- зарегистрироваться только при попытке сохранить в аккаунт.

## 14.2. Авторизованный режим

Авторизованный пользователь может:

- сохранять симуляции;
- просматривать историю;
- переименовывать симуляции;
- добавлять зоны в избранное;
- удалять свои симуляции;
- удалять аккаунт;
- экспортировать свои данные в будущей версии.

## 14.3. Supabase SSR

- использовать server-side Supabase client с cookies;
- разделить browser client и server client;
- не использовать service role для обычных пользовательских запросов;
- после логина корректно обновлять session/cookies;
- защищать app routes на сервере, а не только в UI.

---

# 15. Privacy, безопасность и правовые ограничения

## 15.1. Минимизация данных

Не собирать в V1:

- точный домашний адрес;
- имя ребёнка;
- дату рождения ребёнка;
- медицинские данные;
- школьные документы;
- payslips;
- банковские данные;
- идентифицирующие данные третьих лиц;
- постоянную историю геолокации.

Разрешённые данные:

- выбранный город;
- выбранные IRIS;
- примерный бюджет;
- возрастная группа ребёнка;
- тип домохозяйства;
- приоритеты;
- избранные зоны;
- email и минимальные данные аккаунта.

## 15.2. Чувствительные пользовательские точки

Если пользователь указывает точку работы/вокзала/родственников:

- по умолчанию не сохранять координаты в аккаунт;
- использовать только в текущем browser session;
- перед сохранением спросить явное согласие;
- не логировать эту точку в analytics;
- для сохранения предпочтительнее сохранять только округлённую зону/ID, а не точную координату.

## 15.3. DVF

- не публиковать сырые записи сделок;
- не создавать публичные страницы по точным адресам сделок;
- не позволять поисковикам индексировать данные сделок;
- показывать только агрегированную аналитику;
- проверять актуальные ограничения повторного использования при подключении источника.

## 15.4. Secret management

- все секреты в environment variables;
- `.env.local` не коммитить;
- service role key доступен только server runtime/jobs;
- отключить логирование токенов/headers/PII;
- добавить `.env.example` без секретов;
- документировать необходимые environment variables.

## 15.5. Security checklist

- RLS включен;
- server actions проверяют auth/ownership;
- service key не в клиентском bundle;
- rate limiting для публичных endpoints;
- input validation на сервере;
- CSRF-safe настройки и same-origin правила;
- строгий Content Security Policy после выбора карты/внешних ресурсов;
- audit log для admin imports;
- signed URLs для будущих PDF;
- нет публичного доступа к private Storage buckets;
- регулярная проверка зависимостей.

---

# 16. Локализация

## 16.1. Языки V1

- французский `fr` — основной;
- английский `en` — полноценный второй язык;
- русский не является публичным языком V1, но может использоваться в внутренних документах.

## 16.2. Обязательные правила i18n

- не хранить интерфейсные фразы в компонентах;
- использовать словари переводов;
- URLs локализованы через `[locale]`;
- единицы и форматы:
  - французский: `1 250 €`, `3,2 km`;
  - английский: `€1,250`, `3.2 km`;
- даты форматировать по locale;
- не переводить официальные географические названия искусственно;
- в результатах выводить понятные локальные термины: `commune`, `zone analysée`, `école maternelle`, `college`, и т. д.

---

# 17. UI-компоненты V1

Минимальный набор reusable-компонентов:

```text
AppShell
MobileBottomNavigation
LanguageSwitcher
SimulationStepper
ProgressIndicator
CitySearch
BudgetInput
PropertyTypeSelector
PrioritySelector
HardConstraintToggle
MapPanel
AreaList
AreaCard
AreaComparisonTable
ScoreCard
ScoreBreakdown
DataConfidenceBadge
SourceDisclosure
CaveatList
EmptyState
ErrorState
LoadingState
SaveSimulationDialog
AuthGate
```

## 17.1. Data Confidence Badge

Всегда использовать один словарь:

| Код | FR | EN | Смысл |
|---|---|---|---|
| `high` | Données solides | Strong data | хороший объём и подходящий географический уровень |
| `medium` | Données partielles | Partial data | часть данных на уровне commune или ограниченное покрытие |
| `low` | Données limitées | Limited data | мало сделок/точек/устаревшие данные |
| `unavailable` | Données indisponibles | Data unavailable | нет данных, не равно нулю |

---

# 18. Public pages

## 18.1. `/[locale]`

Содержит:

- бренд и локальный слоган;
- две карточки симуляторов;
- объяснение в 3 шага;
- короткий блок о данных;
- ссылку на методологию;
- ссылку на источники;
- disclaimer.

## 18.2. `/[locale]/methodology`

Обязательная страница.

Содержит:

- что рассчитывается;
- что не рассчитывается;
- уровни географии;
- понятие `data confidence`;
- как работают веса;
- почему данные не равны гарантии;
- почему не следует смешивать зарплату, `revenu médian`, аренду и цену покупки;
- как обрабатываются пропуски;
- версия scoring engine.

## 18.3. `/[locale]/sources`

Содержит:

- список источников;
- издателя;
- назначение;
- географический уровень;
- дату последнего обновления в StatWise;
- ссылку на источник;
- правовые ограничения.

## 18.4. `/[locale]/coverage`

Показывает:

- какие communes/IRIS имеют хороший coverage;
- какие метрики доступны;
- где результаты ограничены уровнем commune;
- где симулятор временно недоступен из-за недостатка данных.

---

# 19. Тестирование

## 19.1. Unit tests

Покрыть минимум:

- нормализацию метрик;
- разные направления `higher_is_better` / `lower_is_better`;
- расчёт weights;
- hard constraints;
- обработку null/unavailable;
- расчёт confidence;
- ranking;
- объяснения результата;
- age profiles ребёнка;
- форматирование данных.

## 19.2. Repository/integration tests

Проверить:

- RLS;
- пользователь не видит чужие симуляции;
- пользователь не может изменить чужой результат по ID;
- migrations применяются с нуля;
- PostGIS запросы корректно находят POI внутри/рядом с IRIS;
- импорт создаёт versioned records;
- ошибки импорта не публикуют частичные данные.

## 19.3. End-to-end tests

Критические сценарии:

```text
1. Гость открывает симулятор района.
2. Выбирает город.
3. Вводит бюджет и приоритеты.
4. Получает ranking.
5. Переходит к family simulation.
6. Выбирает ребёнка 3–5 лет.
7. Сравнивает до 3 зон.
8. Регистрируется.
9. Сохраняет симуляцию.
10. Повторно открывает её из dashboard.
11. Удаляет симуляцию.
```

## 19.4. Golden datasets

Создать фиксированные наборы, чтобы изменения формулы были контролируемыми:

```text
Dijon — семья с ребёнком 5 лет
Lyon — пара без детей
Versailles — семья с ребёнком 10 лет
Avignon — один человек
Небольшая commune с низким покрытием данных
```

После изменения engine тест должен показывать:

- изменился ли ranking;
- какая метрика вызвала изменение;
- не изменилась ли логика случайно.

---

# 20. Observability и аналитика продукта

## 20.1. Технические события

Логировать без PII:

- status imports;
- время выполнения расчёта;
- ошибки маршрутов;
- ошибки форм;
- ошибки карты;
- ошибки auth;
- dataset version;
- engine version.

## 20.2. Продуктовые события

Отслеживать:

```text
landing_viewed
simulator_started
city_selected
budget_step_completed
priorities_step_completed
result_generated
area_opened
comparison_opened
family_simulator_started
simulation_saved
auth_started
auth_completed
simulation_abandoned
```

Не отправлять в аналитику:

- точный адрес;
- координаты target point;
- текстовые персональные заметки;
- данные ребёнка более детально, чем агрегированная возрастная группа.

---

# 21. Пошаговый план реализации

Каждая фаза должна завершаться работающим, проверяемым результатом. Не пытаться реализовать всё параллельно.

## Фаза 0 — Product specification и repository setup

### Задачи

- создать Next.js project с App Router и TypeScript strict;
- настроить форматирование, lint, typecheck, test scripts;
- создать Supabase project и локальный workflow migrations;
- создать `.env.example`;
- завести базовую документацию в `README.md`;
- создать `docs/`:
  - `product-spec.md`;
  - `data-catalog.md`;
  - `scoring-methodology.md`;
  - `privacy-scope.md`;
  - `architecture.md`.

### Definition of Done

```text
- приложение запускается локально;
- typecheck проходит;
- lint проходит;
- Supabase migration workflow документирован;
- нет секретов в репозитории;
- базовая FR/EN локализация работает.
```

## Фаза 1 — Дизайн foundation и layout

### Задачи

- mobile-first AppShell;
- header;
- footer;
- language switcher;
- mobile bottom navigation;
- design tokens;
- состояния loading/error/empty;
- базовые public pages;
- accessibility baseline.

### Definition of Done

```text
- интерфейс корректен на 360px;
- нет горизонтальной прокрутки;
- все интерактивные элементы доступны с клавиатуры;
- locale переключается без поломки маршрута;
- public pages доступны без auth.
```

## Фаза 2 — Supabase Auth и пользовательские сущности

### Задачи

- sign-up/sign-in/callback;
- SSR session handling;
- profile trigger или server-side profile creation;
- profiles/simulations/simulation_inputs/simulation_results/saved_areas;
- RLS policies;
- dashboard skeleton;
- guest draft storage.

### Definition of Done

```text
- пользователь создаёт аккаунт;
- пользователь сохраняет свою симуляцию;
- другой пользователь не имеет к ней доступа;
- гость не теряет черновик до регистрации;
- logout корректно очищает session.
```

## Фаза 3 — География

### Задачи

- импорт communes;
- импорт IRIS;
- PostGIS geometry;
- city search;
- map layer;
- выбор IRIS;
- fallback to commune;
- базовые data coverage flags.

### Definition of Done

```text
- пользователь находит Dijon/Lyon/Versailles;
- видит границы доступных анализируемых зон;
- может выбрать зону и открыть базовую карточку;
- spatial indexes установлены;
- нет тяжёлых full-table scans на обычных запросах.
```

## Фаза 4 — Data catalog и import framework

### Задачи

- `data_sources`;
- `metric_definitions`;
- `import_runs`;
- raw file storage;
- connector interface;
- validation framework;
- source versioning;
- internal admin status page;
- CI checks для data schema.

### Definition of Done

```text
- минимум один источник импортируется воспроизводимо;
- import failure не ломает опубликованную версию;
- run log содержит статус и ошибки;
- есть понятный отчёт об import quality.
```

## Фаза 5 — Первые источники для MVP

Подключать последовательно, а не все сразу:

1. communes + IRIS;
2. BPE/POI;
3. школы;
4. DVF агрегаты покупки;
5. Carte des loyers на уровне commune;
6. APL;
7. зарегистрированная преступность.

### Definition of Done

```text
- минимум для 3 pilot cities доступен;
- каждая показанная метрика имеет источник и версию;
- raw data не публикуется пользователям;
- missing data отображается корректно.
```

## Фаза 6 — Trouver mon quartier

### Задачи

- multi-step wizard;
- city selection;
- housing and budget inputs;
- priorities;
- hard constraints;
- scoring engine;
- area ranking;
- map and area cards;
- source/caveat disclosures;
- save simulation.

### Definition of Done

```text
- пользователь получает 3–10 зон;
- зоны исключаются по hard constraints;
- каждому результату есть объяснение;
- budget/price/coverage не маскируются;
- результат можно сохранить и открыть повторно.
```

## Фаза 7 — Grandir ici

### Задачи

- age group selector;
- family priorities;
- переход выбранных зон из quartier simulation;
- family scoring;
- side-by-side comparison;
- образовательные, health, sport, nature, mobility, tranquillity blocks;
- disclaimers.

### Definition of Done

```text
- пользователь сравнивает 1–3 зоны;
- результат отличается для возрастов 0–2 и 11–14;
- нет медицинских/образовательных гарантий;
- есть сильные стороны и действия для ручной проверки.
```

## Фаза 8 — QA, закрытая beta и запуск

### Задачи

- unit/integration/E2E tests;
- performance audit mobile;
- accessibility audit;
- privacy review;
- method/source pages;
- beta feedback flow;
- error monitoring;
- launch checklist.

### Definition of Done

```text
- core journey tested end-to-end;
- RLS tested;
- tests pass in CI;
- mobile scores acceptable;
- privacy/source/methodology pages live;
- pilot cities validated manually.
```

---

# 22. AI-функции после V1

AI не участвует в расчётной математике V1.

## Разрешённые будущие AI-функции

- объяснить готовый результат простыми словами;
- сравнить зоны на основе уже рассчитанных метрик;
- сформировать краткий report;
- помочь пользователю понять, какие приоритеты выбрать;
- ответить на вопрос «Почему Zone A выше Zone B?» строго на основе structured data;
- подсказать, что проверить вручную перед переездом.

## Запрещённые будущие AI-функции

- выдумывать статистику;
- менять scores;
- выдавать медицинские/правовые/финансовые гарантии;
- делать заключение без доступных источников;
- подменять отсутствие данных выдуманным ответом;
- получать больше личных данных, чем нужно для объяснения результата.

## AI contract

Будущий AI получает только структурированный `SimulationResult`, user locale и допустимый набор фраз/ограничений. AI не должен получать raw sensitive input, если он не нужен для ответа.

---

# 23. Что делать после V1

Только после подтверждения, что первые два симулятора полезны и понятны пользователям.

Возможные модули:

1. **Reste à vivre**
   - доход;
   - жильё;
   - транспорт;
   - обязательные расходы;
   - ориентировочный остаток.

2. **Travail et carrière**
   - вакансии;
   - диапазоны зарплат;
   - профессии;
   - удалённая работа;
   - карьерные зоны.

3. **Achat immobilier**
   - ипотека;
   - первоначальный взнос;
   - taxe foncière;
   - стоимость владения;
   - ремонт;
   - aides/PTZ после отдельной проверки правил.

4. **Tranquillité de demain**
   - расширенный семейный сценарий;
   - школы;
   - медицина;
   - природа;
   - спорт;
   - транспорт;
   - климатические и экологические риски, если появятся качественные источники.

5. **Cross-border**
   - отдельный продукт, не просто перевод французского расчёта;
   - France → Suisse / Belgique / Luxembourg / Allemagne;
   - требует отдельной налоговой, медицинской и правовой методологии.

---

# 24. Acceptance criteria V1

V1 считается готовой, если:

- приложение работает на mobile first;
- доступно на FR и EN;
- пользователь может пройти оба сценария;
- данные не подменяются AI;
- результаты не скрывают ограничения;
- есть источники и методология;
- есть корректная аутентификация и RLS;
- данные пользователя изолированы;
- архитектура позволяет добавлять новые симуляторы без переписывания ядра;
- scoring engine тестируем и версионируем;
- import pipeline воспроизводим;
- не публикуются личные/raw DVF данные;
- пользователь получает не просто цифры, а список районов, причины выбора и действия для проверки.

---

# 25. Финальная инструкция AI-агенту

При реализации следовать этому порядку:

1. Не начинать со сложного дизайна или AI-функций.
2. Сначала создать foundation, migrations, auth, RLS, i18n и mobile layout.
3. Затем реализовать географическую модель и один pilot city end-to-end.
4. Создать data catalog и import framework до подключения большого числа источников.
5. Реализовать scoring engine как чистый domain layer с unit tests.
6. Реализовать `Trouver mon quartier` до полного работающего результата.
7. Затем реализовать `Grandir ici` на тех же географических и POI-данных.
8. Каждую новую метрику добавлять только вместе с:
   - источником;
   - версией;
   - geographic level;
   - confidence logic;
   - тестами;
   - UI объяснением.
9. Не добавлять новые «красивые» баллы, если нельзя объяснить формулу и данные.
10. Перед публичным запуском пройти security, privacy, data quality и mobile UX checklist.

---

# 26. Краткий delivery checklist

```text
[ ] Next.js App Router + TypeScript strict
[ ] FR/EN routing and translations
[ ] Mobile-first design foundation
[ ] Supabase Auth SSR
[ ] Supabase RLS policies
[ ] PostGIS enabled
[ ] Geography: communes + IRIS
[ ] POI import framework
[ ] Source catalog + versions + import logs
[ ] Housing aggregates
[ ] School/health/sport/service data
[ ] APL and crime data with correct caveats
[ ] Neighbourhood simulator
[ ] Family/child simulator
[ ] Saved simulations + dashboard
[ ] Methodology/source/coverage/privacy pages
[ ] Unit + integration + E2E tests
[ ] Pilot-city validation
[ ] Monitoring + analytics without sensitive data
[ ] Closed beta
```

---

## Конечный результат V1

Пользователь должен закончить симуляцию с ясным выводом:

> «Я понимаю, какие районы стоит смотреть, почему они подходят моему бюджету и образу жизни, как они выглядят для ребёнка и какие вещи нужно проверить лично до переезда».
