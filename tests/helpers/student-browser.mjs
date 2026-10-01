export const readBook = page => page.evaluate(() => JSON.parse(localStorage.getItem('lever-lab-notebook-v1')));
export async function selectQuestion(page, id) {
  if (await page.locator('[data-lab="index"]').count() === 0) await page.locator('[data-lab="mode-challenge"]').click();
  await page.locator('[data-lab="index"]').click();
  const tile=page.locator(`[data-lab="question"][data-part="${id}"]`), group=tile.locator('xpath=ancestor::details');
  if(await group.getAttribute('open')===null)await group.locator('summary').click();
  await tile.click();
}
export async function choose(page,key,value,owner='shared') {
  const buttons=page.locator(`[data-lab="choose"][data-answer="${key}"][data-owner="${owner}"]`);
  for(let i=0;i<await buttons.count();i++)if(await buttons.nth(i).getAttribute('data-value')===String(value)){await buttons.nth(i).click();return;}
  throw Error('Choice missing '+value);
}
export async function checkCurrent(page) {
  const id=(await readBook(page)).part;
  await page.locator('[data-lab="next"]').click();
  if((await readBook(page)).part!==id || await page.locator('.question-grid').count())await selectQuestion(page,id);
}
export async function openRecovery(page) {
  if(await page.locator('[data-lab="index"]').count()===0)await page.locator('[data-lab="mode-challenge"]').click();
  await page.locator('[data-lab="index"]').click();
  await page.locator('[data-lab="session"]').click();
}
