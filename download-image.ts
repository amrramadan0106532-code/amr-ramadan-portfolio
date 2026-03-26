import https from 'https';
import fs from 'fs';

function download(url: string, dest: string) {
  https.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
      return download(response.headers.location!, dest);
    }
    const file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download completed');
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Error downloading file:', err.message);
  });
}

download('https://github.com/Atevaz.png', 'public/profile.jpg');
