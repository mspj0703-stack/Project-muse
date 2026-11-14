# Cloudflare Workers 배포 안내

이 프로젝트는 빌드가 필요 없는 정적 사이트입니다. `wrangler.jsonc`의 `assets`가 이 폴더를 그대로 서비스합니다.

## 방법 A. GitHub 연동(Workers Builds)
1. 이 ZIP의 **모든 파일**(특히 `index.html`, `styles.css`, `app.js`, `catalog.js`, `engine/dist/`)을 저장소 루트에 커밋·push
2. Worker 이름이 `wrangler.jsonc`의 `name`(`project-muse`)과 같은지 확인 (다르면 name 수정)
3. 빌드 명령: 비움 / 배포 명령: `npx wrangler deploy`

## 방법 B. 로컬 배포
```bash
npx wrangler deploy
```

## 확인
- `https://<worker>.workers.dev/styles.css`, `/app.js`, `/engine/dist/index.js`가 200으로 열리는지 확인
- `.assetsignore`에 있는 파일(tests, docs, engine/src 등)은 업로드되지 않습니다.
