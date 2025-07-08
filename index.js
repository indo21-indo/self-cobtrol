const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const RENDER_FOLDER = path.join(__dirname, 'render');

if (!fs.existsSync(RENDER_FOLDER)) {
  fs.mkdirSync(RENDER_FOLDER);
}

// Serve /render static folder
app.use('/render', express.static(RENDER_FOLDER));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Your existing /speak route here
app.get('/speak', (req, res) => {
  const msg = req.query.msg;
  if (!msg) return res.status(400).json({ error: 'Missing "msg" parameter' });

  const id = Math.floor(Math.random() * (2020 - 1010 + 1)) + 1010;
  const filename = `${id}.mp3`;
  const filepath = path.join(RENDER_FOLDER, filename);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/render/${filename}`;

  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=bn&client=tw-ob`;

  const file = fs.createWriteStream(filepath);
  https.get(ttsUrl, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();

      setTimeout(() => {
        fs.unlink(filepath, err => {
          if (err) console.error('Failed to delete:', filename);
        });
      }, 5 * 60 * 1000);

      res.json({ url: fileUrl });
    });
  }).on('error', (err) => {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Failed to fetch voice' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
