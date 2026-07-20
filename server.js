const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 存储玩具状态
let toyState = {
  power: false,
  mode: '静音',
  level: 0,
  lastCommand: null,
  commandTime: null
};

// 记录日志
let log = [];
let pendingCommand = null;

// 主页
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    toy: toyState,
    message: '羞羞哒漫游pro控制服务器'
  });
});

// 查询状态
app.get('/status', (req, res) => {
  res.json(toyState);
});

// 接收控制指令
app.post('/control', (req, res) => {
  const { command, level, mode, duration } = req.body;

  if (!command) {
    return res.status(400).json({ error: '缺少指令' });
  }

  toyState.power = true;
  toyState.lastCommand = command;
  toyState.commandTime = new Date().toISOString();

  switch(command) {
    case 'on':
      toyState.level = level || 1;
      toyState.mode = mode || '震动';
      log.push(`[${toyState.commandTime}] 开启 - 档位${toyState.level} 模式:${toyState.mode}`);
      break;
    case 'off':
      toyState.power = false;
      toyState.level = 0;
      log.push(`[${toyState.commandTime}] 关闭`);
      break;
    case 'level':
      toyState.level = level;
      log.push(`[${toyState.commandTime}] 调档至${level}`);
      break;
    case 'mode':
      toyState.mode = mode;
      log.push(`[${toyState.commandTime}] 切换模式:${mode}`);
      break;
    case 'wave':
      toyState.mode = '波形';
      log.push(`[${toyState.commandTime}] 启动波形模式`);
      break;
    default:
      return res.status(400).json({ error: '未知指令' });
  }

  // 如果有持续时间，定时关闭
  if (duration && duration > 0) {
    setTimeout(() => {
      toyState.power = false;
      toyState.level = 0;
      log.push(`[${new Date().toISOString()}] 定时结束，自动关闭`);
    }, duration * 1000);
  }

  pendingCommand = { command, level, mode, duration, timestamp: new Date().toISOString() };
  
  res.json({
    success: true,
    state: toyState,
    message: duration ? `已执行，持续${duration}秒` : '已执行'
  });
});

// 获取指令日志
app.get('/log', (req, res) => {
  res.json(log.slice(-50));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`控制服务器运行中，端口: ${PORT}`);
app.get('/pending', (req, res) => {
  const cmd = pendingCommand;
  pendingCommand = null;
  res.json(cmd || { command: null });
});

app.use(express.static('public'));});
