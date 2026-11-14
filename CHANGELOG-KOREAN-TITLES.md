# Project MUSE — 한국어 곡명 표시 패치

- 일본어 제목을 가진 36곡에 한국어 번역·통용 표기(`titleKo`)를 추가
- 표시 규칙: `일본어 원제 (한국어 제목)` — 선호곡 선택, 선택 목록, 취향 테스트, 추천 결과
- 한국어 제목으로도 검색 가능 (`titleKo`는 추천 점수 계산에 영향을 주지 않음)
- `catalog-source.tsv`의 마지막 열이 한국어 제목의 원본 데이터이므로 재생성 후에도 유지
- 기존 브라우저의 취향 선택 저장 키 및 곡 ID 변경 없음
- 일부 고유명사는 직역보다 통용하는 한국어 표기를 사용함; 공식 번역명 보증 아님

## GitHub Codespaces 적용

저장소 루트에 ZIP을 업로드한 뒤 터미널에서:

```bash
unzip -o MUSE_Korean_Title_Patch.zip -d .
rm MUSE_Korean_Title_Patch.zip
npm test
git add -A
git commit -m "Show Korean names beside Japanese song titles"
git push origin HEAD
```

Cloudflare가 GitHub 자동 배포로 연결됐다면 푸시 후 재배포됩니다.
