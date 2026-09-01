# 서울 재개발 Pocket

서울 집값 흐름, 재개발·정비사업, 국토부 실거래, 온비드 공매, VWorld 공간판정을 한 화면에서 비교하는 모바일 우선 웹앱입니다.

## 운영 구조

- `index.html` — 화면 골격과 스크립트 로딩 순서
- `app.js` — 기본 페이지 전환, 사업지 목록/상세, 실거래 기본 렌더링
- `safe-ui.js` — 관심사업지, 정렬, 접기, 변경이력 등 안정형 UI 보강
- `data-enrich.js` — 서울시 공식자료·온비드 상세 보강
- `onbid-ui.js` — 온비드 공매 전용 UI
- `optimize-ui.js` — 내집마련 신호판과 공매·경매 허브
- `market-signal.js` — 한국부동산원 R-ONE 서울 아파트 지수
- `homebuying-board.js` — 서울 외곽 12개 자치구 실거래 비교
- `spatial-ui.js` — VWorld 좌표 + 재개발 Polygon 위치판정 UI
- `polygon-loader.js` — 복구된 추가 Polygon 묶음 로더
- `guide.js` — 앱 기능과 함께 갱신하는 초보자용 사용가이드
- `api/` — Vercel Serverless API
- `data/` — 사업지, Polygon, 공식 데이터 출처

## 데이터 원칙

1. 공식기관·공공데이터를 우선 사용합니다.
2. 확인하지 못한 값은 임의로 만들지 않고 `미확인` 또는 `연동대기`로 표시합니다.
3. 국토부 월별 실거래 중앙값 변화는 가격지수가 아니므로 R-ONE 공식 지수와 구분합니다.
4. Polygon/VWorld 위치판정은 참고용이며 법적 경계판정을 대신하지 않습니다.

## API 환경변수

Vercel Production 환경에 아래 Secret이 필요합니다.

- `DATA_GO_KR_SERVICE_KEY`
- `RONE_API_KEY`
- `VWORLD_API_KEY`
- `SEOUL_OPEN_API_KEY`

실제 키 값은 저장소와 프론트엔드 코드에 넣지 않습니다.

## 유지보수 규칙

- 기능 의미가 달라지면 `guide.js`도 같은 변경에서 수정합니다.
- 렌더 함수 후킹은 최소화하며 `MutationObserver`나 짧은 주기의 polling은 사용하지 않습니다.
- 공공 API 오류를 0원/0건으로 표시하지 않습니다.
- 월간·저빈도 데이터는 CDN 캐시를 사용해 호출량을 줄입니다.
- 새 Polygon은 공식 서울시 공간정보를 우선 사용합니다.

## 현재 주요 제한

- 법원경매 자동연동은 공식 연계 API 확인 대기 중입니다.
- 모든 추적 사업지의 Polygon이 확보된 것은 아닙니다.
