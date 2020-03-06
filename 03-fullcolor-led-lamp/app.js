const express = require('express')
const path = require('path');
const Obniz = require("obniz");

const app = express();
const port = 3000

const obniz = new Obniz("0000-0000");

const COLOR_RED     = [0xFF, 0x00, 0x00];
const COLOR_GREEN   = [0x00, 0xFF, 0x00];
const COLOR_BLUE    = [0x00, 0x00, 0xFF];
const COLOR_YELLOW  = [0xFF, 0xFF, 0x00];
const COLOR_CYAN    = [0x00, 0xFF, 0xFF];
const COLOR_MAGENTA = [0xFF, 0x00, 0xFF];
const COLOR_WHITE   = [0xFF, 0xFF, 0xFF];
const COLOR_BLACK   = [0x00, 0x00, 0x00];

const COLORS = [
  COLOR_RED,
  COLOR_GREEN,
  COLOR_BLUE,
  COLOR_YELLOW,
  COLOR_CYAN,
  COLOR_MAGENTA,
  COLOR_WHITE,
];

const COLORS_ON = [COLOR_MAGENTA, COLOR_CYAN, COLOR_BLUE, COLOR_YELLOW];
const COLORS_OFF = [
  [0x00, 0x00, 0x00],
  [0x00, 0x00, 0x00],
  [0x00, 0x00, 0x00],
  [0x00, 0x00, 0x00]
];

const DELTA = 16;
let interval;
let led
let colors;

obniz.onconnect = async function () {
  console.log('Obniz connected!');
  led = obniz.wired("WS2811", {din: 12});
  led.rgbs(COLORS_OFF);
}
function getRandomIndex() {
  return Math.floor(Math.random() * Math.floor(COLORS.length));
}

function changeColorsDelta(newColors) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      for (let led = 0 ; led < 4; led++) {
        for (let rgb = 0 ; rgb < 3; rgb++) {
          if (newColors[led][rgb] === 0){
            const newColor = colors[led][rgb] - DELTA
            colors[led][rgb] = newColor > 0 ? newColor : 0;
          } else
          if (newColors[led][rgb] === 0xFF){
            const newColor = colors[led][rgb] + DELTA;
            colors[led][rgb] = newColor < 0xFF ? newColor : 0xFF;
          }
        }
      }
      led.rgbs(colors);
      resolve();
    }, 200);
  });
}
async function changeColors() {
  colors = [...colors];
  const newColors = [
    COLORS[getRandomIndex()],
    COLORS[getRandomIndex()],
    COLORS[getRandomIndex()],
    COLORS[getRandomIndex()],
  ];
  for (let i = 0; i < (0xFF + 1) / DELTA; i++) {
    await changeColorsDelta(newColors);
  }
}

function start() {
  if (interval)
    clearInterval(interval);
  colors = [...COLORS_ON];
  led.rgbs(colors);
  // 10秒ごとに色を変える
  interval = setInterval(changeColors, 15 * 1000);
}
function stop() {
  clearInterval(interval);
  interval = null;
  led.rgbs(COLORS_OFF);
}

app.use(express.static(path.join(__dirname, 'public')));
app.get('/status', (req, res) => {
    res.send(obniz.connectionState);
});
app.get('/on', (req, res) => {
  start();
  res.send('OK');
});
app.get('/off', (req, res) => {
  stop();
  res.send('OK');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
