const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const express = require('express');
const app = express();

app.get("/", async (req, res) => {
  const videoUrl = req.query.url || '';

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing query param "url"' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#transcript', { timeout: 20000 });

    const transcript = await page.$eval('#transcript', el => el.innerText.trim());
    await browser.close();

    return res.json({ transcript });
  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
