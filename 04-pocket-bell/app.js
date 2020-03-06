const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const M5Stack = require("m5stackjs");
const DFPlayerMini = require("./dfplayermini");

const app = express();
const port = 3000;

const WIDTH = 320;
const HEIGHT = 240;

const m5 = new M5Stack("0000-0000");
let dfplayer;
// アラーム再生中フラグ
let isCalling = false;

m5.onconnect = async function() {
  console.log('M5Stack connected!');
  await m5.m5display.onWait();
  // 画面を黒くする
  m5.m5display.printScreenOneColor(0xFFFF);
  // DFPlayer miniパーツを登録
  M5Stack.PartsRegistrate(DFPlayerMini);
  dfplayer = m5.wired("dfplayermini", { tx:17, rx:16, busy: 5} );
  await dfplayer.config();
  await dfplayer.volume(1);

  m5.buttonA.onchange = async function(pressed){
    console.log("pressed:" + pressed)
    if (pressed) {
        // 音楽の再生を停止
        isCalling = false;
        await dfplayer.stop();
    }
  };

  m5.repeat(async function(){
    if (isCalling) {
      // mp3再生が終わっていたら再びスタート
      // 1曲リピート再生(0x19)コマンドを使っても良い
      const isPlaying = await dfplayer.isPlaying();
      if (!isPlaying) {
        await dfplayer.play(1,1);
      }
    }
  }, 1000);
};

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit:'1mb',extended: true }));

app.get("/status", (req, res) => {
  res.send(m5.connectionState);
});
app.get("/call_status", (req, res) => {
  res.send(isCalling ? 'calling' : 'recieved');
});
app.post("/send", async (req, res) => {
  const rawData = req.body.data;
  m5.m5display.printScreenRawRect(0,0, WIDTH, HEIGHT, rawData);
  isCalling = true;
  res.send("OK");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
