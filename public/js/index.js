const xjs = require('xjs');
const socket = io();
socket.on('refresh', () => {
  window.location.reload(true);
});

const queue = [];
let isIdle = true;

function log(...args) {
  queue.push(() => {
    isIdle = false;
    fetch('/log', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(args),
    })
      .catch()
      .then(() => {
        const job = queue.shift();
        if (job) {
          job();
        } else {
          isIdle = true;
        }
      })
  });
  if (isIdle) {
    const job = queue.shift();
    job();
  }
}
log('start');

async function start() {
  try {
    await xjs.ready();
    log('after ready');
    const scene = await xjs.Scene.getActiveScene();
    const items = await scene.getItems();
    const visibleItems = [];
    await Promise.all(items.map(async (item) => {
      const isVisible = await item.isVisible();
      if (isVisible) {
        visibleItems.push(item);
      }
    }));

    visibleItems.forEach((item) => {
      log(item._name);
    })
    const camItem = visibleItems.find((item) => item._name === 'Logitech Webcam C930e');
    await zoomAt({
      target: camItem,
      items: visibleItems,
      duration: 3000,
    });
  } catch (err) {
    log(err.message);
  }
}

async function zoomAt({
  target,
  items,
  duration,
}) {
  const {
    _left: x,
    _top: y,
    _width: width,
    _height: height,
  } = await target.getPosition();

  // 가운데에 넣는 방법에 관한 식
  // if (height === zoomHeight) : 조건
  // 2 * x + width = 2 * zoomX + zoomWidth

  // zoomWidth : zoomHeight = 1 : 1
  // zoomHeight * 1 = zoomWidth * 1
  // zoomWidth = (1) * zoomHeight
  //           = 1 * zoomHeight
  //           = 1 * height

  // 2 * x + width = 2 * zoomX + zoomWidth
  // zoomX = ((2 * x + width) - zoomWidth) / 2
  // 2 * y + height = 2 * zoomY + zoomHeight

  const zoomWidth = (width < height)
    ? height
    : width;
  const zoomX = (width < height)
    ? ((2 * x + width) - zoomWidth) / 2
    : x;
  const zoomY = (width < height)
    ? y
    : ((2 * y + height) - zoomWidth) / 2;

  await zoom({
    zoomX,
    zoomY,
    zoomWidth,
    items,
  });

  setTimeout(async () => {
    await zoom({
      zoomX: (-1) * zoomX * (1 / zoomWidth),
      zoomY: (-1) * zoomY * (1 / zoomWidth),
      zoomWidth: 1 / zoomWidth,
      items,
    });
  }, duration);
}

async function zoom({
  zoomX,
  zoomY,
  zoomWidth,
  items,
}) {
  // 1. Scale 계산
  const originalWith = 1;
  const scale = originalWith / zoomWidth;


  await Promise.all(items.map(async (item) => {
    const rectangle = await item.getPosition();

    // 2. Origin 이동, 상대좌표 갱신
    // 3. 모든 아이템의 (상대적으로) 갱신된 좌표에 Scale 곱하기
    // 4. 모든 아이템의 W, H 에도 Scale 곱하기
    const x = rectangle.getLeft();
    const y = rectangle.getTop();
    const width = rectangle.getWidth();
    const height = rectangle.getHeight();

    const nextX = scale * (x - zoomX);
    const nextY = scale * (y - zoomY);
    const nextWidth = scale * width;
    const nextHeight = scale * height;

    rectangle._top = nextY;
    rectangle._right = nextX + nextWidth
    rectangle._bottom = nextY + nextHeight;
    rectangle._left = nextX;
    rectangle._width = nextWidth;
    rectangle._height = nextHeight;

    await item.setPosition(rectangle);
  }));
}

start();

