import {test, expect} from '@playwright/test';

test('first tap plays the full recording with vocals and inline media',async({page})=>{
  await page.goto('./');
  await expect(page.getByRole('button',{name:'Original recording',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('audio')).toHaveAttribute('src',/original-mix\.mp3/);
  await expect(page.locator('audio')).toHaveAttribute('playsinline','');
  await page.getByRole('button',{name:'PLAY FULL BAND',exact:true}).click();
  await expect.poll(()=>page.locator('audio').evaluate((a:HTMLAudioElement)=>a.currentTime)).toBeGreaterThan(.3);
  await expect(page.getByTestId('vinyl')).toHaveClass(/spinning/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('unsupported HTML media volume uses an honest hardware-volume hint',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(HTMLMediaElement.prototype,'volume',{configurable:true,get:()=>1,set:()=>{}});
  });
  await page.goto('./');
  await expect(page.getByText('Use the phone volume buttons',{exact:true})).toBeVisible();
  await expect(page.getByRole('slider',{name:'Master volume',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'PLAY FULL BAND',exact:true}).click();
  await expect.poll(()=>page.locator('audio').evaluate((a:HTMLAudioElement)=>a.currentTime)).toBeGreaterThan(.3);
});

test('suspended studio audio shows Resume and recovers without duplicate sources',async({page,browserName})=>{
  await page.addInitScript(()=>{
    if(typeof AudioContext==='undefined')return;
    const create=AudioContext.prototype.createBufferSource;
    (window as any).__iphoneAudio={context:null,count:0};
    AudioContext.prototype.createBufferSource=function(){(window as any).__iphoneAudio.context=this;(window as any).__iphoneAudio.count++;return create.call(this)};
  });
  await page.goto('./');
  test.skip(browserName==='webkit'&&process.platform==='win32'&&await page.evaluate(()=>typeof AudioContext==='undefined'),'Windows WebKit lacks Web Audio; physical iOS interruption still requires device testing.');
  await page.getByRole('button',{name:'Explore the band',exact:true}).click();
  await page.getByRole('button',{name:'PLAY FULL BAND',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible({timeout:90000});
  await page.evaluate(()=>(window as any).__iphoneAudio.context.suspend());
  await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
  await expect(page.getByTestId('vinyl')).not.toHaveClass(/spinning/);
  const before=Number(await page.getByRole('slider',{name:'Song position',exact:true}).inputValue());
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
  await expect.poll(async()=>Number(await page.getByRole('slider',{name:'Song position',exact:true}).inputValue())).toBeGreaterThan(before+.2);
  expect(await page.evaluate(()=>(window as any).__iphoneAudio.count)).toBe(4);
});
