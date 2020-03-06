const express = require("express");
const path = require("path");
const Obniz = require("obniz");

const app = express();
const port = 3000;

const obniz = new Obniz("0000-0000");
let led;

obniz.onconnect = async function() {
  console.log("Obniz connected!");
  led = obniz.wired("LED", { anode: 4 });
};

app.use(express.static(path.join(__dirname, "public")));
app.get("/status", (req, res) => {
  res.send(obniz.connectionState);
});
app.get("/on", (req, res) => {
  led.on();
  res.send("OK");
});
app.get("/off", (req, res) => {
  led.off();
  res.send("OK");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
