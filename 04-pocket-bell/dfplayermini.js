const Start_Byte = 0x7e;
const Version_Byte = 0xff;
const Command_Length = 0x06;
const Acknowledge = 0x00;
const End_Byte = 0xef;

function split(num) {
  return [num >> 8, num & 0xff];
}

/**
 * DFPlayer miniのシリアル通信フォーマットのバイト配列を生成する関数
 */
function buildCmdArray(CMD, Par1 = 0, Par2 = 0) {
  const Checksum = -(
    Version_Byte +
    Command_Length +
    CMD +
    Acknowledge +
    Par1 +
    Par2
  );
  const ChecksumSplited = split(Checksum);
  const HighByte = ChecksumSplited[0];
  const LowByte = ChecksumSplited[1];
  const CommandLine = [
    Start_Byte & 0xff,
    Version_Byte & 0xff,
    Command_Length & 0xff,
    CMD & 0xff,
    Acknowledge & 0xff,
    Par1 & 0xff,
    Par2 & 0xff,
    HighByte & 0xff,
    LowByte & 0xff,
    End_Byte & 0xff
  ];
  return CommandLine;
}

/**
 * obniz custom parts for DFPlayer mini
 */
class DFPlayerMini {

  constructor() {
    this.keys = ['tx', 'rx', 'vcc', 'gnd', 'busy', 'busy_pull', 'baud'];
    this.requiredKeys = ['tx', 'rx'];

    this.CONFIG_LATENCY = 1000;
    this.PLAY_LATENCY = 500;
    this.VOLUME_LATENCY = 500;

    this.CMD = {
      CONFIG: 0x3f, // 初期化コマンド
      VOLUME: 0x06, // ボリューム設定
      PLAY: 0x03, // トラックを指定再生
      PLAY_FOLDER: 0x0f, // フォルダ、トラックを指定して再生
      STOP: 0x16, // 停止
    }
  }

  static info() {
    return {
      name: 'dfplayermini',
    };
  }

  wired(obniz) {
    this.obniz = obniz;

    const uart = this.obniz.getFreeUart();
    const baud = this.params.baud || 9600;
    uart.start({ tx: this.params.tx, rx: this.params.rx, baud: baud });
    this.uart = uart;

    if (this.params.busy) {
      const busy = obniz.getIO(this.params.busy);
      const busy_pull = this.params.busy_pull || '3v';
      busy.pull(busy_pull);
      this.busy = busy;
    }

  }

  config() {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.CONFIG));
      await this.obniz.wait(this.CONFIG_LATENCY);
      resolve();
    });
  }

  isPlaying() {
    return new Promise(async (resolve, reject) => {
      let ret = await this.busy.inputWait();
      resolve(ret === false);
    });
  }

  volume(val) {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.VOLUME, 0, val));
      await this.obniz.wait(this.VOLUME_LATENCY);
      resolve();
    });
  }

  play(folder, truck) {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.PLAY_FOLDER, folder, truck));
      await this.obniz.wait(this.PLAY_LATENCY);
      resolve();
    });
  }
  stop() {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.STOP));
      await this.obniz.wait(this.PLAY_LATENCY);
      resolve();
    });
  }
}

if (typeof module === 'object') {
  module.exports = DFPlayerMini;
}