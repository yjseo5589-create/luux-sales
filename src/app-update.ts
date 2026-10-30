// 새 버전 확인: 앱을 열 때·다시 돌아올 때·인터넷이 다시 연결될 때 version.json을 확인한다.
// 새 배포가 있으면 바로 새로고침하고, 입력 중(폼·서랍 열림, 입력칸 포커스)이면 하단 안내만 띄운다.
declare const __BUILD_ID__: string;

const base = import.meta.env.BASE_URL;
let busy = false, lastCheck = 0, notice: HTMLElement | null = null;

function editing() {
  const el = document.activeElement;
  return !!document.querySelector('form, .overlay') || (el instanceof HTMLElement && el.matches('input, textarea, select, [contenteditable="true"]'));
}

function reloadTo(version: string) {
  // CDN이 잠시 예전 HTML을 줄 때 새로고침이 반복되지 않도록 1분에 한 번만 시도한다
  const key = 'luux-sales-update:' + version;
  try {
    if (Date.now() - Number(sessionStorage.getItem(key) || 0) < 60000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch { /* 저장 불가 환경에서도 새로고침은 진행 */ }
  const next = new URL(location.href);
  next.searchParams.set('v', version);
  location.replace(next.href);
}

function showNotice(version: string) {
  if (notice) return;
  notice = document.createElement('div');
  notice.setAttribute('role', 'status');
  notice.style.cssText = 'position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:12px;padding:8px 8px 8px 16px;border-radius:2px;background:#171717;color:#fff;font:600 12px/1.4 Arial,"Apple SD Gothic Neo",sans-serif;white-space:nowrap';
  notice.textContent = '새 버전이 있습니다';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '새로고침';
  button.style.cssText = 'height:30px;padding:0 12px;border:1px solid #555;border-radius:2px;background:#fff;color:#171717;font:inherit;cursor:pointer';
  button.onclick = () => reloadTo(version);
  notice.append(button);
  document.body.append(notice);
}

async function check() {
  if (busy || document.visibilityState === 'hidden' || !navigator.onLine || Date.now() - lastCheck < 15000) return;
  busy = true; lastCheck = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${base}version.json?check=${Date.now()}`, {cache: 'no-store', signal: controller.signal});
    if (!response.ok) return;
    const {version} = await response.json();
    if (typeof version !== 'string' || !/^[a-z0-9]{1,32}$/.test(version) || version === __BUILD_ID__) return;
    if (editing()) showNotice(version); else reloadTo(version);
  } catch {
    // 오프라인·네트워크 오류에서는 지금 화면을 그대로 쓴다
  } finally { clearTimeout(timer); busy = false; }
}

export function startUpdateCheck() {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  window.addEventListener('pageshow', check);
  window.addEventListener('online', () => { lastCheck = 0; check(); });
  check();
}
