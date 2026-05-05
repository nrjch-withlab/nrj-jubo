// 노량진교회 주보 Service Worker
// 캐시 이름에 버전을 넣어두면 업데이트 시 자동 갱신됩니다
const CACHE_NAME = 'nrj-jubo-v2';

// 오프라인에서도 볼 수 있도록 캐시할 파일 목록
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 설치 시 정적 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 요청 처리: jubo.json은 항상 네트워크 우선 (매주 갱신)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('jubo.json')) {
    // 주보 데이터: 네트워크 우선, 실패 시 캐시
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // 나머지: 캐시 우선, 없으면 네트워크
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
