import fs from 'fs';
console.log(fs.statSync('public/profile.jpg').size);
