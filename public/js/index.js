const xjs = require('xjs');
const socket = io();
socket.on('refresh', () => {
  console.log('refresh');
  window.location.reload(true);
});
console.log('hihi');

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
log({ a: () => { } });
log('start');

xjs.ready()
  .then(() => {
    log('after ready');
    log(typeof xjs.Scene.getActiveScene);
    return xjs.Scene.getActiveScene();
  })
  .then((scene) => {
    return scene.getItems();
  })
  .then((items) => {
    return Promise.all(items.map((item) => {
      log(item._name);
      return item.isVisible().then((isVisible) => {
        if (!isVisible) {
          return;
        }
        log(typeof item.setWidth);
        // return item.setRotateZ(0);
      });
    }));
  })
  .catch((err) => {
    log(err.message);
  });
