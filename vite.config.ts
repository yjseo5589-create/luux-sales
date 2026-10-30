import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
// 배포마다 바뀌는 빌드 ID: 앱이 version.json과 비교해 새 버전을 알아챈다(src/app-update.ts)
const buildId=Date.now().toString(36);
export default defineConfig({plugins:[react(),{name:'build-version',generateBundle(){this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({version:buildId})})}}],define:{__BUILD_ID__:JSON.stringify(buildId)},base:process.env.BASE_PATH||'/luux-sales/'});
