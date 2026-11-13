import { Quiz } from '../models/Quiz.js';
import { Attempt } from '../models/Attempt.js';

const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_TTL_MS = 30 * 60 * 1000;
const MAX_CHAT_HISTORY = 40;

const clean = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function generateCode() {
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

function scoreboard(room) {
  return [...room.players.values()]
    .map((player) => ({ id: player.id, name: player.name, score: player.score, correct: player.correct }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function roomState(room) {
  return {
    code: room.code,
    quiz: {
      id: room.quiz.id,
      title: room.quiz.title,
      cover: room.quiz.cover,
      category: room.quiz.category,
      questionCount: room.quiz.questions.length,
    },
    hostName: room.hostName,
    status: room.status,
    index: room.index,
    players: scoreboard(room),
    messages: room.messages,
  };
}

function systemMessage(room, io, text) {
  const message = { id: `sys-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, system: true, name: 'System', text, at: new Date().toISOString() };
  room.messages.push(message);
  room.messages = room.messages.slice(-MAX_CHAT_HISTORY);
  io.to(room.code).emit('chat:message', message);
}

function clearTimer(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
}

function pushQuestion(io, room) {
  const question = room.quiz.questions[room.index];
  room.status = 'live';
  room.answers = new Map();
  room.players.forEach((player) => {
    player.answered = false;
  });

  const seconds = question.timeLimitSeconds || room.quiz.timeLimitSeconds || 20;
  room.questionStartedAt = Date.now();
  room.deadline = room.questionStartedAt + seconds * 1000;

  clearTimer(room);
  room.timer = setTimeout(() => revealAnswer(io, room), seconds * 1000 + 500);

  io.to(room.code).emit('question', {
    index: room.index,
    total: room.quiz.questions.length,
    text: question.text,
    options: question.options,
    points: question.points,
    seconds,
    endsAt: room.deadline,
  });
  io.to(room.code).emit('room:state', roomState(room));
}

function revealAnswer(io, room) {
  if (room.status !== 'live') return;
  clearTimer(room);

  const question = room.quiz.questions[room.index];
  const counts = question.options.map(() => 0);
  room.answers.forEach(({ selectedIndex }) => {
    if (selectedIndex != null && counts[selectedIndex] !== undefined) counts[selectedIndex] += 1;
  });

  room.status = 'reveal';
  io.to(room.code).emit('question:end', {
    index: room.index,
    correctIndex: question.correctIndex,
    explanation: question.explanation || '',
    counts,
    isLast: room.index >= room.quiz.questions.length - 1,
    scoreboard: scoreboard(room),
  });
  io.to(room.code).emit('room:state', roomState(room));
}

async function persistResults(room) {
  const tasks = [...room.players.values()]
    .filter((player) => player.userId && player.answers.length > 0)
    .map((player) => {
      const correctCount = player.answers.filter((answer) => answer.isCorrect).length;
      return Attempt.create({
        user: player.userId,
        quiz: room.quiz.id,
        answers: player.answers,
        correctCount,
        totalQuestions: room.quiz.questions.length,
        score: player.score,
        percentage: Math.round((correctCount / room.quiz.questions.length) * 100),
        durationMs: Date.now() - room.createdAt,
      }).catch((error) => console.error('[live] could not save attempt', error.message));
    });

  await Promise.all(tasks);
}

function endRoom(io, room, reason = 'The host ended the session') {
  if (room.status === 'ended') return;
  clearTimer(room);
  room.status = 'ended';
  const finalBoard = scoreboard(room);
  io.to(room.code).emit('room:ended', { scoreboard: finalBoard, reason });
  io.to(room.code).emit('room:state', roomState(room));
  persistResults(room);
  setTimeout(() => rooms.delete(room.code), ROOM_TTL_MS).unref?.();
}

/** Register all live-quiz socket handlers. */
export function registerLiveRooms(io) {
  io.on('connection', (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`);

    const currentRoom = () => socket.data.roomCode && rooms.get(socket.data.roomCode);

    socket.on('room:create', async (payload, ack = () => {}) => {
      if (typeof ack !== 'function') return;
      if (!socket.user) return ack({ ok: false, error: 'Sign in to host a live quiz' });

      try {
        const quiz = await Quiz.findById(payload?.quizId);
        if (!quiz) return ack({ ok: false, error: 'Quiz not found' });
        const isOwner = String(quiz.createdBy) === String(socket.user.id);
        if (!isOwner && socket.user.role !== 'admin') {
          return ack({ ok: false, error: 'You can only host quizzes you created' });
        }

        const code = generateCode();
        const room = {
          code,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            cover: quiz.cover,
            category: quiz.category,
            timeLimitSeconds: quiz.timeLimitSeconds,
            questions: quiz.questions.map((question) => ({
              id: question.id,
              text: question.text,
              options: question.options,
              correctIndex: question.correctIndex,
              explanation: question.explanation || '',
              points: question.points || 10,
              timeLimitSeconds: question.timeLimitSeconds || quiz.timeLimitSeconds || 20,
            })),
          },
          hostId: socket.user.id,
          hostName: socket.user.name,
          hostSocketId: socket.id,
          status: 'lobby',
          index: 0,
          players: new Map(),
          answers: new Map(),
          messages: [],
          timer: null,
          createdAt: Date.now(),
        };
        rooms.set(code, room);
        socket.data.roomCode = code;
        socket.data.isHost = true;
        socket.join(code);

        return ack({ ok: true, room: roomState(room) });
      } catch (error) {
        return ack({ ok: false, error: error.message });
      }
    });

    socket.on('room:join', (payload, ack = () => {}) => {
      if (typeof ack !== 'function') return;
      const code = clean(payload?.code, 8).toUpperCase();
      const room = rooms.get(code);
      if (!room) return ack({ ok: false, error: 'Room not found. Check the code and try again.' });
      if (room.status === 'ended') return ack({ ok: false, error: 'This session has already ended' });

      const name = clean(payload?.name, 24) || socket.user?.name;
      if (!name) return ack({ ok: false, error: 'Enter a display name' });

      if (socket.data.roomCode && socket.data.roomCode !== code) {
        const previous = rooms.get(socket.data.roomCode);
        previous?.players.delete(socket.id);
        socket.leave(socket.data.roomCode);
      }

      socket.data.roomCode = code;
      socket.join(code);

      if (socket.id !== room.hostSocketId) {
        const existing = room.players.get(socket.id);
        room.players.set(socket.id, {
          id: socket.id,
          userId: socket.user?.id ?? null,
          name,
          score: existing?.score ?? 0,
          correct: existing?.correct ?? 0,
          answered: false,
          answers: existing?.answers ?? [],
        });
        systemMessage(room, io, `${name} joined the room`);
      }

      io.to(code).emit('room:state', roomState(room));
      return ack({ ok: true, room: roomState(room), isHost: socket.id === room.hostSocketId });
    });

    socket.on('room:start', (_payload, ack = () => {}) => {
      const room = currentRoom();
      if (!room || typeof ack !== 'function') return;
      if (room.hostSocketId !== socket.id) return ack({ ok: false, error: 'Only the host can start the quiz' });
      if (room.status !== 'lobby') return ack({ ok: false, error: 'The quiz has already started' });

      room.index = 0;
      systemMessage(room, io, 'The quiz is starting!');
      pushQuestion(io, room);
      return ack({ ok: true });
    });

    socket.on('room:next', (_payload, ack = () => {}) => {
      const room = currentRoom();
      if (!room || typeof ack !== 'function') return;
      if (room.hostSocketId !== socket.id) return ack({ ok: false, error: 'Only the host can continue' });
      if (room.status !== 'reveal') return ack({ ok: false, error: 'The current question is still open' });

      if (room.index + 1 >= room.quiz.questions.length) {
        endRoom(io, room, 'Quiz complete');
        return ack({ ok: true, ended: true });
      }
      room.index += 1;
      pushQuestion(io, room);
      return ack({ ok: true });
    });

    socket.on('room:end', (_payload, ack = () => {}) => {
      const room = currentRoom();
      if (!room || typeof ack !== 'function') return;
      if (room.hostSocketId !== socket.id) return ack({ ok: false, error: 'Only the host can end the session' });
      endRoom(io, room, 'The host ended the session');
      return ack({ ok: true });
    });

    socket.on('room:answer', (payload, ack = () => {}) => {
      const room = currentRoom();
      if (!room || typeof ack !== 'function') return;
      if (room.status !== 'live') return ack({ ok: false, error: 'The question is not open' });

      const player = room.players.get(socket.id);
      if (!player) return ack({ ok: false, error: 'Join the room before answering' });
      if (player.answered) return ack({ ok: false, error: 'You already answered this question' });

      const question = room.quiz.questions[room.index];
      const selectedIndex = Number(payload?.selectedIndex);
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
        return ack({ ok: false, error: 'Select a valid option' });
      }

      const elapsed = Date.now() - room.questionStartedAt;
      const limit = question.timeLimitSeconds * 1000;
      if (elapsed > limit + 1500) return ack({ ok: false, error: 'Time is up for this question' });

      const isCorrect = selectedIndex === question.correctIndex;
      const speedBonus = isCorrect
        ? Math.round((1 - Math.min(elapsed, limit) / limit) * Math.round(question.points * 0.5))
        : 0;
      const awarded = isCorrect ? question.points + speedBonus : 0;

      player.answered = true;
      if (isCorrect) {
        player.correct += 1;
        player.score += awarded;
      }
      player.answers.push({
        questionId: question.id,
        selectedIndex,
        isCorrect,
        timeMs: Math.min(elapsed, limit),
      });
      room.answers.set(socket.id, { selectedIndex, isCorrect });

      ack({ ok: true, isCorrect, awarded, totalScore: player.score });
      io.to(room.code).emit('scoreboard', scoreboard(room));

      const everyoneAnswered = [...room.players.values()].every((entry) => entry.answered);
      if (everyoneAnswered && room.players.size > 0) revealAnswer(io, room);
    });

    socket.on('chat:message', (payload, ack = () => {}) => {
      const room = currentRoom();
      if (!room) return;
      const text = clean(payload?.text, 240);
      if (!text) return;

      const player = room.players.get(socket.id);
      const name = player?.name || (socket.id === room.hostSocketId ? room.hostName : 'Guest');
      const message = {
        id: `${socket.id}-${Date.now()}`,
        system: false,
        name,
        host: socket.id === room.hostSocketId,
        text,
        at: new Date().toISOString(),
      };
      room.messages.push(message);
      room.messages = room.messages.slice(-MAX_CHAT_HISTORY);
      io.to(room.code).emit('chat:message', message);
      if (typeof ack === 'function') ack({ ok: true });
    });

    socket.on('room:leave', () => {
      const room = currentRoom();
      if (!room) return;
      const player = room.players.get(socket.id);
      room.players.delete(socket.id);
      socket.leave(room.code);
      socket.data.roomCode = null;
      if (player) {
        systemMessage(room, io, `${player.name} left the room`);
        io.to(room.code).emit('room:state', roomState(room));
      }
    });

    socket.on('disconnect', () => {
      const room = currentRoom();
      if (!room) return;

      if (room.hostSocketId === socket.id) {
        endRoom(io, room, 'The host disconnected');
        return;
      }

      const player = room.players.get(socket.id);
      if (player) {
        room.players.delete(socket.id);
        systemMessage(room, io, `${player.name} disconnected`);
        io.to(room.code).emit('room:state', roomState(room));
      }
    });
  });
}

/** Test helper: how many rooms are active (used by socket tests). */
export const _activeRooms = () => rooms.size;
