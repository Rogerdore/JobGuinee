const { createCanvas } = require('canvas');
const fs = require('fs');
const c = createCanvas(1200, 630);
const ctx = c.getContext('2d');

// Background gradient
const grad = ctx.createLinearGradient(0, 0, 1200, 630);
grad.addColorStop(0, '#1e3a5f');
grad.addColorStop(1, '#2563eb');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, 1200, 630);

// White card
ctx.fillStyle = 'rgba(255,255,255,0.95)';
const rx = 150, ry = 120, rw = 900, rh = 390, rr = 20;
ctx.beginPath();
ctx.moveTo(rx + rr, ry);
ctx.lineTo(rx + rw - rr, ry);
ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
ctx.lineTo(rx + rw, ry + rh - rr);
ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
ctx.lineTo(rx + rr, ry + rh);
ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
ctx.lineTo(rx, ry + rr);
ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
ctx.fill();

// Orange accent bar
ctx.fillStyle = '#f97316';
ctx.fillRect(rx, ry, 8, rh);

// Title
ctx.fillStyle = '#1e3a5f';
ctx.font = 'bold 52px Arial';
ctx.fillText('JobGuin\u00e9e', 200, 210);

// Subtitle
ctx.fillStyle = '#f97316';
ctx.font = 'bold 36px Arial';
ctx.fillText("Offre d'emploi", 200, 270);

// Description
ctx.fillStyle = '#64748b';
ctx.font = '28px Arial';
ctx.fillText("La plateforme N\u00b01 de recrutement en Guin\u00e9e", 200, 340);
ctx.fillText('Trouvez votre emploi id\u00e9al !', 200, 385);

// Briefcase icon
ctx.fillStyle = '#f97316';
ctx.font = 'bold 80px Arial';
ctx.fillText('\u{1F4BC}', 870, 290);

// Bottom bar
ctx.fillStyle = '#f97316';
ctx.fillRect(0, 590, 1200, 40);
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 22px Arial';
ctx.fillText('jobguinee-pro.com', 480, 618);

const buf = c.toBuffer('image/png');
fs.writeFileSync('public/assets/share/default-job.png', buf);
console.log('Created: ' + buf.length + ' bytes, 1200x630');
