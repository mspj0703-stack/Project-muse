from playwright.sync_api import sync_playwright
from pathlib import Path
html=(Path(__file__).resolve().parent.parent/'MUSE_Offline_Demo.html').read_text(encoding='utf-8')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':900},device_scale_factor=1)
 errs=[]
 page.on('pageerror', lambda e: errs.append(str(e)))
 page.set_content(html, wait_until='domcontentloaded')
 print('initial url:',page.url,'heading:',page.locator('h1').first.inner_text(), 'errors:',errs)
 print('tiles',page.locator('.song-tile').count())
 page.locator('#song-search').fill('푸름과 여름')
 assert page.get_by_text('青と夏',exact=True).count()==1
 page.locator('#song-search').fill('')
 for i in range(5): page.locator('.song-tile').nth(i).click()
 assert '5 / 10' in page.locator('.side-count').inner_text()
 page.screenshot(path=str(Path(__file__).resolve().parent.parent/'docs/desktop-select.png'),full_page=True)
 page.locator('.side-panel [data-action="start"]').click()
 print('probe path',page.url,'heading',page.locator('h1').first.inner_text(), 'errors',errs)
 for i in range(10):
  assert page.get_by_text('이 곡은 얼마나 마음에 드나요?').count()==1
  if i==1:page.locator('[data-kind="skip"]').click()
  else:page.locator('[data-kind="like"]').click()
 page.locator('.rec-card').first.wait_for(state='visible',timeout=5000)
 print('results',page.locator('.rec-card').count(),'URL',page.url,'errors',errs)
 page.screenshot(path=str(Path(__file__).resolve().parent.parent/'docs/desktop-results.png'),full_page=True)
 assert page.locator('.rec-card').count()==10
 before=[x.inner_text() for x in page.locator('.rec-song').all()]
 page.locator('[data-action="rate-result"][data-kind="love"]').first.click()
 after=[x.inner_text() for x in page.locator('.rec-song').all()]
 assert before != after
 print('feedback rerank passed')
 # reload cannot test on about:blank, but localStorage can be tested by read through evaluate
 # about:blank does not provide localStorage; persistence tested on real deployment
 print('localStorage not available in about:blank harness')
 mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 errs2=[]
 mobile.on('pageerror',lambda e: errs2.append(str(e)))
 mobile.set_content(html,wait_until='domcontentloaded')
 assert mobile.locator('.mobile-cta').is_visible()
 mobile.screenshot(path=str(Path(__file__).resolve().parent.parent/'docs/mobile-select.png'),full_page=True)
 for i in range(5): mobile.locator('.song-tile').nth(i).click()
 mobile.locator('.mobile-cta [data-action="start"]').click()
 assert mobile.get_by_text('이 곡은 얼마나 마음에 드나요?').count()==1
 mobile.screenshot(path=str(Path(__file__).resolve().parent.parent/'docs/mobile-probe.png'),full_page=True)
 print('mobile horizontal overflow',mobile.evaluate('document.documentElement.scrollWidth > innerWidth'))
 print('errors',errs,errs2)
 assert not errs and not errs2
 browser.close()
