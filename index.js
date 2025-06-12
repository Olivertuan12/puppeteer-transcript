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
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll nhẹ để kích hoạt lazy-loading
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // Loop retry thủ công thay vì page.waitForTimeout
    let transcript = '';
    for (let i = 0; i < 30; i++) {
      try {
        transcript = await page.$eval('#transcript', el => el.innerText.trim());
        if (transcript.length > 30) break;
      } catch (_) {
        // Không tìm thấy element, tiếp tục loop
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // đợi 1 giây
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
