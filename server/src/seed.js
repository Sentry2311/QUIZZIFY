import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Quiz } from './models/Quiz.js';
import { Attempt } from './models/Attempt.js';
import { Notification } from './models/Notification.js';

const DEMO_USERS = [
  { name: 'Ava Admin', email: 'admin@quizzify.dev', password: 'admin123', role: 'admin' },
  { name: 'Sam Player', email: 'player@quizzify.dev', password: 'player123', role: 'user' },
];

const QUIZZES = [
  {
    title: 'JavaScript Essentials',
    description: 'Closures, prototypes, async behaviour and the quirks every JS developer should know.',
    category: 'Programming',
    difficulty: 'medium',
    cover: '💛',
    questions: [
      {
        text: 'Which keyword declares a block-scoped variable that cannot be reassigned?',
        options: ['var', 'let', 'const', 'static'],
        correctIndex: 2,
        explanation: 'const is block scoped and its binding cannot be reassigned.',
      },
      {
        text: 'What does Array.prototype.map() return?',
        options: ['The original array', 'A new array of the same length', 'undefined', 'A single value'],
        correctIndex: 1,
        explanation: 'map creates a new array with the result of the callback for each element.',
      },
      {
        text: 'What is the output of typeof null?',
        options: ["'null'", "'object'", "'undefined'", "'number'"],
        correctIndex: 1,
        explanation: "A long-standing JavaScript bug means typeof null is 'object'.",
      },
      {
        text: 'Which method schedules a callback after the current call stack clears?',
        options: ['setTimeout(fn, 0)', 'queueMicrotask', 'requestAnimationFrame', 'Array.forEach'],
        correctIndex: 0,
        explanation: 'setTimeout with 0ms runs in a later macrotask, after pending microtasks.',
      },
      {
        text: 'What does === compare?',
        options: ['Value only', 'Type only', 'Value and type', 'Reference only'],
        correctIndex: 2,
        explanation: 'Strict equality compares both type and value without coercion.',
      },
    ],
  },
  {
    title: 'React Fundamentals',
    description: 'Hooks, rendering and component composition - the core ideas behind modern React.',
    category: 'Programming',
    difficulty: 'easy',
    cover: '⚛️',
    questions: [
      {
        text: 'Which hook stores local component state?',
        options: ['useEffect', 'useState', 'useMemo', 'useRef'],
        correctIndex: 1,
        explanation: 'useState returns the current value and a setter that triggers a re-render.',
      },
      {
        text: 'When does a useEffect with an empty dependency array run?',
        options: ['On every render', 'Only after the first render', 'Never', 'Only when props change'],
        correctIndex: 1,
        explanation: 'An empty array means the effect runs once after mount (and cleans up on unmount).',
      },
      {
        text: 'What is the correct way to update state based on the previous value?',
        options: ['setCount(count + 1)', 'setCount(prev => prev + 1)', 'count = count + 1', 'setCount(() => count)'],
        correctIndex: 1,
        explanation: 'The updater form guarantees you receive the latest value.',
      },
      {
        text: 'Which prop must every element in a list have?',
        options: ['id', 'key', 'ref', 'name'],
        correctIndex: 1,
        explanation: 'Keys let React match elements between renders.',
      },
      {
        text: 'What does useContext do?',
        options: [
          'Creates a new context',
          'Reads the nearest provider value for a context',
          'Fetches data from an API',
          'Subscribes to a store',
        ],
        correctIndex: 1,
        explanation: 'useContext reads the value from the closest matching provider.',
      },
    ],
  },
  {
    title: 'World Capitals',
    description: 'How well do you know the capitals of the world? Twenty seconds per question.',
    category: 'Geography',
    difficulty: 'easy',
    cover: '🌍',
    questions: [
      {
        text: 'What is the capital of Japan?',
        options: ['Osaka', 'Kyoto', 'Tokyo', 'Seoul'],
        correctIndex: 2,
        explanation: 'Tokyo has been the capital of Japan since 1868.',
      },
      {
        text: 'What is the capital of Australia?',
        options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'],
        correctIndex: 1,
        explanation: 'Canberra was purpose-built as the capital, not Sydney.',
      },
      {
        text: 'What is the capital of Canada?',
        options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
        correctIndex: 2,
        explanation: 'Ottawa is the capital of Canada.',
      },
      {
        text: 'What is the capital of Brazil?',
        options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'],
        correctIndex: 2,
        explanation: 'Brasília became the capital in 1960.',
      },
    ],
  },
  {
    title: 'Science Sprint',
    description: 'Physics, chemistry and biology basics at a brisk pace.',
    category: 'Science',
    difficulty: 'medium',
    cover: '🔬',
    questions: [
      {
        text: 'What is the chemical symbol for gold?',
        options: ['Ag', 'Au', 'Gd', 'Go'],
        correctIndex: 1,
        explanation: 'Au comes from the Latin word aurum.',
      },
      {
        text: 'Which planet has the most moons?',
        options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
        correctIndex: 1,
        explanation: 'Saturn currently has the most confirmed moons.',
      },
      {
        text: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'],
        correctIndex: 2,
        explanation: 'Mitochondria produce most of the cell energy as ATP.',
      },
      {
        text: 'What is the speed of light in a vacuum (approximately)?',
        options: ['300,000 km/s', '150,000 km/s', '30,000 km/s', '3,000 km/s'],
        correctIndex: 0,
        explanation: 'Light travels at about 299,792 km/s.',
      },
    ],
  },
  {
    title: 'Movie Trivia',
    description: 'Timeless cinema moments from the last few decades.',
    category: 'Entertainment',
    difficulty: 'hard',
    cover: '🎬',
    questions: [
      {
        text: 'Who directed Inception (2010)?',
        options: ['Christopher Nolan', 'Denis Villeneuve', 'David Fincher', 'Ridley Scott'],
        correctIndex: 0,
        explanation: 'Christopher Nolan wrote and directed Inception.',
      },
      {
        text: 'Which film won the first Academy Award for Best Picture?',
        options: ['Wings', 'Sunrise', 'The Jazz Singer', 'Metropolis'],
        correctIndex: 0,
        explanation: 'Wings won Best Picture at the first Academy Awards in 1929.',
      },
      {
        text: 'What is the highest-grossing film of all time?',
        options: ['Titanic', 'Avatar', 'Avengers: Endgame', 'Star Wars: The Force Awakens'],
        correctIndex: 1,
        explanation: 'Avatar holds the worldwide box office record.',
      },
      {
        text: 'Which actor played the Joker in The Dark Knight?',
        options: ['Joaquin Phoenix', 'Heath Ledger', 'Jack Nicholson', 'Jared Leto'],
        correctIndex: 1,
        explanation: 'Heath Ledger won a posthumous Oscar for the role.',
      },
    ],
  },
  {
    title: 'History Highlights',
    description: 'Key events that shaped the modern world.',
    category: 'History',
    difficulty: 'medium',
    cover: '🏛️',
    questions: [
      {
        text: 'In which year did the Berlin Wall fall?',
        options: ['1987', '1989', '1991', '1993'],
        correctIndex: 1,
        explanation: 'The wall was opened on 9 November 1989.',
      },
      {
        text: 'Who was the first President of the United States?',
        options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'James Madison'],
        correctIndex: 2,
        explanation: 'George Washington served from 1789 to 1797.',
      },
      {
        text: 'The Renaissance began in which country?',
        options: ['France', 'Italy', 'Greece', 'Spain'],
        correctIndex: 1,
        explanation: 'It started in the Italian city-states, especially Florence.',
      },
    ],
  },
];

async function seed() {
  await connectDB();
  console.log('[seed] connected');

  await Promise.all([Attempt.deleteMany({}), Notification.deleteMany({}), Quiz.deleteMany({})]);

  const users = {};
  for (const data of DEMO_USERS) {
    // eslint-disable-next-line no-await-in-loop
    let user = await User.findOne({ email: data.email }).select('+password +tokenVersion');
    if (!user) {
      // eslint-disable-next-line no-await-in-loop
      user = await User.create(data);
    } else {
      user.name = data.name;
      user.role = data.role;
      user.password = data.password;
      // eslint-disable-next-line no-await-in-loop
      await user.save();
    }
    users[data.role] = user;
  }

  for (const quiz of QUIZZES) {
    // eslint-disable-next-line no-await-in-loop
    await Quiz.create({ ...quiz, createdBy: users.admin._id, isPublished: true, plays: Math.floor(Math.random() * 40) });
  }

  const createdQuizzes = await Quiz.find().sort({ createdAt: 1 });
  await Attempt.create({
    user: users.user._id,
    quiz: createdQuizzes[0]._id,
    answers: createdQuizzes[0].questions.slice(0, 3).map((question, index) => ({
      questionId: question._id,
      selectedIndex: index === 0 ? question.correctIndex : 0,
      isCorrect: index === 0,
      timeMs: 4200,
    })),
    correctCount: 1,
    totalQuestions: createdQuizzes[0].questions.length,
    score: 10,
    percentage: 20,
    durationMs: 31000,
  });

  await Notification.create({
    user: users.user._id,
    type: 'system',
    title: 'Welcome to Quizzify',
    message: 'Explore public quizzes or join a live room with a code.',
  });

  console.log(`[seed] created ${createdQuizzes.length} quizzes and ${DEMO_USERS.length} users`);
  console.log('[seed] admin  admin@quizzify.dev / admin123');
  console.log('[seed] player player@quizzify.dev / player123');

  await mongoose.connection.close();
  await disconnectDB();
}

seed().catch(async (error) => {
  console.error('[seed] failed', error);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
