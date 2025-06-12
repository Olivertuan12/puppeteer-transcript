const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
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
      args: chromium.args,
      executablePath: await chromium.executablePath || '/usr/bin/chromium-browser',
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Chờ phần tử transcript xuất hiện
    await page.waitForSelector('#transcript', { timeout: 15000 });

    // Lấy nội dung trong phần transcript
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
