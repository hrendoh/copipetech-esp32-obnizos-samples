const express = require("express");
const path = require("path");
const Obniz = require("obniz");

const app = express();
const port = 3000;

const obniz = new Obniz("0000-0000");
let humidities = [];

obniz.onconnect = async function() {
  console.log("Obniz connected!");
  const sensor = obniz.wired("SEN0114",  {output:35});
  // 1分ごとに計測
  obniz.repeat(async function(){
    const humidity = await sensor.getHumidityWait();
    console.log('Humidity Level:' + new Date() + ',' + humidity);
    humidities.push({t: new Date(), x: humidity});
  }, 1000 * 60);
};

app.use(express.static(path.join(__dirname, "public")));
app.get("/status", (req, res) => {
  res.send(obniz.connectionState);
});
app.get("/humidities", (req, res) => {
  res.send(humidities);
});
app.get("/reset", (req, res) => {
  humidities = [];
  res.send('OK');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
