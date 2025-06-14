const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

app.get("/", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let browser;
  try {
    // Retry 3 lần nếu puppeteer.launch() fail
    for (let retry = 0; retry < 3; retry++) {
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        break;
      } catch (err) {
        console.error(`Retry launching browser (${retry + 1}/3):`, err.message);
        await new Promise(r => setTimeout(r, 2000));
        if (retry === 2) throw err;
      }
    }

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll nhẹ kích lazy-load transcript
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    let transcript = '';
    for (let i = 0; i < 30; i++) {
      try {
        transcript = await page.$eval('#transcript', el => el.innerText.trim());
        if (transcript.length > 30) break;
      } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await browser.close();

    if (!transcript || transcript.length < 30) {
      return res.status(500).json({ error: 'Transcript not loaded in time.' });
    }

    return res.json({ transcript });

  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
