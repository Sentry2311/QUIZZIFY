import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-quizzify-suite';

const { createApp } = await import('../src/app.js');
const { connectDB, disconnectDB } = await import('../src/config/db.js');
const { User } = await import('../src/models/User.js');
const { Quiz } = await import('../src/models/Quiz.js');

const app = createApp();
const api = request(app);

const admin = { name: 'Admin User', email: 'admin@test.dev', password: 'secret123' };
const player = { name: 'Player One', email: 'player@test.dev', password: 'secret123' };

let adminToken;
let playerToken;
let quizId;

before(async () => {
  await connectDB();
  await User.deleteMany({});
  await Quiz.deleteMany({});
  await User.create({ ...admin, role: 'admin' });
});

after(async () => {
  await disconnectDB();
});

describe('health', () => {
  test('reports ok', async () => {
    const res = await api.get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('unknown routes return 404 JSON', async () => {
    const res = await api.get('/api/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

describe('authentication', () => {
  test('registers a user and returns a token', async () => {
    const res = await api.post('/api/auth/register').send(player);
    assert.equal(res.status, 201);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, player.email);
    assert.equal(res.body.data.user.password, undefined);
    playerToken = res.body.data.token;
  });

  test('rejects a duplicate email', async () => {
    const res = await api.post('/api/auth/register').send(player);
    assert.equal(res.status, 409);
  });

  test('rejects invalid input with field details', async () => {
    const res = await api.post('/api/auth/register').send({ name: 'A', email: 'nope', password: '123' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.length >= 2);
  });

  test('logs in with valid credentials', async () => {
    const res = await api.post('/api/auth/login').send({ email: admin.email, password: admin.password });
    assert.equal(res.status, 200);
    adminToken = res.body.data.token;
  });

  test('rejects a wrong password', async () => {
    const res = await api.post('/api/auth/login').send({ email: admin.email, password: 'wrongpass' });
    assert.equal(res.status, 401);
  });

  test('protected routes require a token', async () => {
    assert.equal((await api.get('/api/auth/me')).status, 401);
    assert.equal((await api.get('/api/auth/me').set('Authorization', 'Bearer garbage')).status, 401);
  });

  test('me returns the signed-in user with stats', async () => {
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${playerToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.email, player.email);
    assert.equal(res.body.data.stats.attempts, 0);
  });
});

describe('quizzes and authorization', () => {
  test('non-admins cannot create quizzes', async () => {
    const res = await api
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ title: 'Nope', category: 'General', questions: [{ text: 'Q?', options: ['a', 'b'], correctIndex: 0 }] });
    assert.equal(res.status, 403);
  });

  test('admin creates a quiz', async () => {
    const res = await api
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Quiz',
        description: 'A quiz used by the API test suite',
        category: 'Testing',
        difficulty: 'easy',
        questions: [
          { text: 'What is 2 + 2?', options: ['3', '4', '5'], correctIndex: 1, explanation: 'Basic arithmetic.' },
          { text: 'Which is a test runner?', options: ['Jest', 'Express'], correctIndex: 0 },
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.quiz.questionCount, 2);
    quizId = res.body.data.quiz.id;
  });

  test('rejects a correct index outside the options', async () => {
    const res = await api
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Bad Quiz', category: 'Testing', questions: [{ text: 'Q?', options: ['a', 'b'], correctIndex: 5 }] });
    assert.equal(res.status, 400);
  });

  test('public quiz payload hides correct answers', async () => {
    const res = await api.get(`/api/quizzes/${quizId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.quiz.questions[0].correctIndex, undefined);
  });

  test('owner sees correct answers', async () => {
    const res = await api.get(`/api/quizzes/${quizId}`).set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.body.data.quiz.questions[0].correctIndex, 1);
  });

  test('lists and filters quizzes', async () => {
    const res = await api.get('/api/quizzes?search=test&difficulty=easy');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.total, 1);
    const filtered = await api.get('/api/quizzes?category=Science');
    assert.equal(filtered.body.data.total, 0);
  });

  test('returns categories', async () => {
    const res = await api.get('/api/quizzes/categories');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.categories[0].name, 'Testing');
  });
});

describe('attempts', () => {
  test('scores a submitted attempt server-side and notifies on high scores', async () => {
    const quiz = await Quiz.findById(quizId);
    const answers = quiz.questions.map((question) => ({
      questionId: question.id,
      selectedIndex: question.correctIndex,
      timeMs: 1500,
    }));

    const res = await api
      .post(`/api/quizzes/${quizId}/attempts`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ answers, durationMs: 5000 });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.attempt.percentage, 100);
    assert.equal(res.body.data.review.length, 2);

    const notifications = await api.get('/api/notifications').set('Authorization', `Bearer ${playerToken}`);
    assert.equal(notifications.body.data.unread, 1);

    const attempt = await api.get('/api/attempts/mine').set('Authorization', `Bearer ${playerToken}`);
    assert.equal(attempt.body.data.attempts.length, 1);
    assert.equal(attempt.body.data.attempts[0].percentage, 100);
  });

  test('quiz leaderboard ranks players', async () => {
    const res = await api.get(`/api/quizzes/${quizId}/leaderboard`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.leaderboard[0].name, player.name);
  });

  test('global leaderboard aggregates results', async () => {
    const res = await api.get('/api/leaderboard');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.leaderboard[0].averageScore, 100);
  });

  test('rejects malformed answers', async () => {
    const res = await api
      .post(`/api/quizzes/${quizId}/attempts`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ answers: [{ questionId: 'not-an-id', selectedIndex: 0 }] });
    assert.equal(res.status, 400);
  });
});

describe('admin', () => {
  test('admin stats requires the admin role', async () => {
    assert.equal((await api.get('/api/admin/stats').set('Authorization', `Bearer ${playerToken}`)).status, 403);
    const res = await api.get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.stats.quizzes, 1);
  });

  test('admin can list users', async () => {
    const res = await api.get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.total, 2);
  });
});

describe('logout', () => {
  test('revokes previously issued tokens', async () => {
    const login = await api.post('/api/auth/login').send({ email: player.email, password: player.password });
    const token = login.body.data.token;
    assert.equal((await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status, 200);

    const out = await api.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    assert.equal(out.status, 200);

    const after = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(after.status, 401);
  });
});
