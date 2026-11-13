import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  LogOut,
  Play,
  Send,
  Trophy,
  Users,
  WifiOff,
  XCircle,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import Avatar from '../components/Avatar.jsx';
import Alert from '../components/Alert.jsx';
import { PageLoader } from '../components/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';
import { useToast } from '../hooks/useToast.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { cn } from '../lib/utils.js';

export default function LiveRoom() {
  const { code: routeCode, quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket, connected } = useSocket();
  const toast = useToast();

  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [ended, setEnded] = useState(null);
  const [joining, setJoining] = useState(true);

  const joinedRef = useRef(false);
  const chatEndRef = useRef(null);
  const chatRef = useRef(null);

  const code = (routeCode || '').toUpperCase();
  const guestName = location.state?.name || (isAuthenticated ? user?.name : '') || 'Guest';

  /* Host flow: create a room for a quiz, then land on its code. */
  useEffect(() => {
    if (!socket || !connected || !quizId || joinedRef.current) return;
    joinedRef.current = true;
    socket.emit('room:create', { quizId }, (response) => {
      if (!response?.ok) {
        setError(response?.error || 'Could not start the room');
        setJoining(false);
        return;
      }
      setRoom(response.room);
      setIsHost(true);
      setMessages(response.room.messages ?? []);
      setJoining(false);
      navigate(`/live/${response.room.code}`, { replace: true, state: { host: true, name: guestName } });
    });
  }, [socket, connected, quizId, navigate, guestName]);

  /* Player flow: join by code. */
  useEffect(() => {
    if (!socket || !connected || quizId || !code || joinedRef.current) return;
    joinedRef.current = true;
    socket.emit('room:join', { code, name: guestName }, (response) => {
      if (!response?.ok) {
        setError(response?.error || 'Could not join the room');
        setJoining(false);
        return;
      }
      setRoom(response.room);
      setIsHost(Boolean(response.isHost));
      setMessages(response.room.messages ?? []);
      setJoining(false);
    });
  }, [socket, connected, code, quizId, guestName]);

  /* Realtime subscriptions. */
  useEffect(() => {
    if (!socket) return undefined;

    const onState = (state) => setRoom(state);
    const onQuestion = (payload) => {
      setQuestion(payload);
      setReveal(null);
      setMyAnswer(null);
      setAnswerResult(null);
      setEnded(null);
    };
    const onQuestionEnd = (payload) => setReveal(payload);
    const onScoreboard = (board) => setRoom((current) => (current ? { ...current, players: board } : current));
    const onChat = (message) => setMessages((current) => [...current.slice(-60), message]);
    const onEnded = (payload) => {
      setEnded(payload);
      setQuestion(null);
      setReveal(null);
    };

    socket.on('room:state', onState);
    socket.on('question', onQuestion);
    socket.on('question:end', onQuestionEnd);
    socket.on('scoreboard', onScoreboard);
    socket.on('chat:message', onChat);
    socket.on('room:ended', onEnded);

    return () => {
      socket.off('room:state', onState);
      socket.off('question', onQuestion);
      socket.off('question:end', onQuestionEnd);
      socket.off('scoreboard', onScoreboard);
      socket.off('chat:message', onChat);
      socket.off('room:ended', onEnded);
    };
  }, [socket]);

  // Keep the chat scrolled to the newest message.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const seconds = question?.seconds || 20;
  const { secondsLeft, progress } = useCountdown(reveal || ended ? null : question?.endsAt, seconds);

  const startQuiz = () => {
    socket?.emit('room:start', {}, (response) => {
      if (!response?.ok) toast.error('Could not start', response?.error);
    });
  };

  const nextQuestion = () => {
    socket?.emit('room:next', {}, (response) => {
      if (!response?.ok) toast.error('Could not continue', response?.error);
    });
  };

  const endSession = () => {
    socket?.emit('room:end', {}, (response) => {
      if (!response?.ok) toast.error('Could not end session', response?.error);
    });
  };

  const submitAnswer = useCallback(
    (optionIndex) => {
      if (!socket || myAnswer !== null || reveal || ended || room?.status !== 'live') return;
      setMyAnswer(optionIndex);
      socket.emit('room:answer', { selectedIndex: optionIndex }, (response) => {
        if (!response?.ok) {
          setMyAnswer(null);
          toast.error('Answer not accepted', response?.error);
          return;
        }
        setAnswerResult(response);
      });
    },
    [socket, myAnswer, reveal, ended, room?.status, toast],
  );

  const sendChat = (event) => {
    event.preventDefault();
    const text = chatText.trim();
    if (!text) return;
    socket?.emit('chat:message', { text });
    setChatText('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room?.code || code);
      toast.success('Code copied', 'Share it with your players.');
    } catch {
      toast.info('Copy manually', `Room code: ${room?.code || code}`);
    }
  };

  const leave = () => {
    socket?.emit('room:leave');
    navigate(isHost ? '/admin/quizzes' : '/live');
  };

  const players = useMemo(() => room?.players ?? [], [room]);

  if (!connected) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <WifiOff className="h-10 w-10 text-ink-400" />
        <h1 className="font-display text-xl font-bold">Connecting to the live server…</h1>
        <p className="max-w-sm text-sm text-ink-500 dark:text-ink-400">
          Make sure the API is running. Retrying automatically.
        </p>
      </div>
    );
  }

  if (joining && !room && !error) return <PageLoader label="Joining the room…" />;

  if (error && !room) {
    return (
      <div className="container-page max-w-lg py-16">
        <Alert>{error}</Alert>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" to="/live">
            Try another code
          </Button>
          <Button variant="ghost" to="/quizzes">
            Browse quizzes
          </Button>
        </div>
      </div>
    );
  }

  if (!room) return <PageLoader label="Waiting for the room…" />;

  const statusLabel = ended || room.status === 'ended' ? 'Ended' : room.status === 'lobby' ? 'Lobby' : 'Live';

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-500/10">
            {room.quiz.cover || '🧠'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold">{room.quiz.title}</h1>
              <span
                className={cn(
                  'badge',
                  statusLabel === 'Live'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                    : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
                )}
              >
                {statusLabel === 'Live' ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> : null}
                {statusLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              Hosted by {room.hostName} · {room.quiz.questionCount} questions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 font-display text-lg font-bold tracking-[0.2em] text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
            aria-label="Copy room code"
          >
            {room.code}
            <Copy className="h-4 w-4 opacity-60" />
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
            <Users className="h-4 w-4" /> {players.length}
          </span>
          <Button variant="ghost" onClick={leave} className="px-3">
            <LogOut className="h-4 w-4" /> Leave
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {ended || room.status === 'ended' ? (
            <div className="card p-6 text-center">
              <Trophy className="mx-auto h-12 w-12 text-amber-500" />
              <h2 className="mt-3 font-display text-2xl font-extrabold">Final standings</h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{ended?.reason || 'This session has ended.'}</p>

              <ol className="mx-auto mt-6 max-w-md space-y-2 text-left">
                {(ended?.scoreboard ?? players).map((player, index) => (
                  <li
                    key={player.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3',
                      index === 0
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
                        : 'border-ink-200 dark:border-white/10',
                    )}
                  >
                    <span className="w-6 text-center font-bold">{index + 1}</span>
                    <Avatar name={player.name} size="sm" />
                    <span className="flex-1 truncate font-medium">{player.name}</span>
                    <span className="font-display font-bold">{player.score}</span>
                  </li>
                ))}
              </ol>

              {isHost ? (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => navigate(`/host/${room.quiz.id}`)}>
                    <Play className="h-4 w-4" /> Run again
                  </Button>
                  <Button variant="secondary" to="/admin/quizzes">
                    Back to quizzes
                  </Button>
                </div>
              ) : (
                <Button className="mt-6" to="/live">
                  Join another room
                </Button>
              )}
            </div>
          ) : question ? (
            <div className="card p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  Question {question.index + 1} of {question.total}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <Clock className={cn('h-4 w-4', secondsLeft <= 5 ? 'text-rose-500' : 'text-brand-500')} />
                  {secondsLeft}s
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-300', secondsLeft <= 5 ? 'bg-rose-500' : 'bg-brand-500')}
                  style={{ width: `${Math.max(0, progress * 100)}%` }}
                />
              </div>

              <h2 className="mt-5 font-display text-2xl font-bold leading-snug">{question.text}</h2>

              <div className="mt-5 grid gap-2.5">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = reveal?.correctIndex === optionIndex;
                  const isMine = myAnswer === optionIndex;
                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      disabled={myAnswer !== null || Boolean(reveal) || room.status !== 'live'}
                      onClick={() => submitAnswer(optionIndex)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition disabled:cursor-default',
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200'
                          : isMine && reveal
                            ? 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200'
                            : isMine
                              ? 'border-brand-500 bg-brand-50 font-semibold text-brand-800 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-100'
                              : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50 dark:border-white/10 dark:hover:border-brand-500/50 dark:hover:bg-white/5',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isCorrect
                            ? 'bg-emerald-500 text-white'
                            : isMine
                              ? 'bg-brand-600 text-white'
                              : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
                        )}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {reveal ? (
                        <>
                          <span className="text-xs text-ink-400">{reveal.counts?.[optionIndex] ?? 0}</span>
                          {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                          {isMine && !isCorrect ? <XCircle className="h-4 w-4 text-rose-500" /> : null}
                        </>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {answerResult ? (
                <p
                  className={cn(
                    'mt-4 rounded-xl px-3.5 py-2.5 text-sm font-medium',
                    answerResult.isCorrect
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
                  )}
                >
                  {answerResult.isCorrect ? `Correct! +${answerResult.awarded} points` : 'Not this time — hang tight for the answer.'}
                </p>
              ) : myAnswer === null && room.status === 'live' ? (
                <p className="mt-4 text-xs text-ink-400">Tap an answer before the timer runs out.</p>
              ) : null}

              {reveal ? (
                <div className="mt-4 rounded-xl bg-ink-50 p-4 dark:bg-white/5">
                  <p className="text-sm font-semibold">
                    {reveal.explanation || 'That was the correct answer.'}
                  </p>
                  {isHost ? (
                    <div className="mt-3 flex gap-2">
                      <Button onClick={nextQuestion} className="flex-1">
                        {reveal.isLast ? 'Show final results' : 'Next question'}
                      </Button>
                      <Button variant="secondary" onClick={endSession}>
                        End
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">Waiting for the host…</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Lobby</h2>
                <span className="text-sm text-ink-500 dark:text-ink-400">
                  {players.length} {players.length === 1 ? 'player' : 'players'} ready
                </span>
              </div>

              {players.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-ink-300 py-10 text-center text-sm text-ink-500 dark:border-white/15 dark:text-ink-400">
                  Share the code <strong className="font-display tracking-widest">{room.code}</strong> so players can join.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-sm dark:border-white/10"
                    >
                      <Avatar name={player.name} size="sm" />
                      <span className="truncate">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {isHost ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={startQuiz} disabled={players.length === 0}>
                    <Play className="h-4 w-4" /> Start quiz
                  </Button>
                  <Button variant="secondary" onClick={endSession}>
                    Close room
                  </Button>
                </div>
              ) : (
                <p className="mt-6 text-sm text-ink-500 dark:text-ink-400">
                  Waiting for {room.hostName} to start the quiz…
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Scoreboard
              </h3>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            <ul className="mt-3 space-y-2">
              {players.length === 0 ? (
                <li className="text-xs text-ink-400">No players yet.</li>
              ) : (
                players.map((player, index) => (
                  <li key={player.id} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-xs font-bold text-ink-400">{index + 1}</span>
                    <Avatar name={player.name} size="sm" className="h-6 w-6 text-[10px]" />
                    <span className="flex-1 truncate">{player.name}</span>
                    <span className="font-semibold">{player.score}</span>
                    {player.answered ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : null}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="card flex h-80 flex-col p-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Room chat
            </h3>
            <div ref={chatRef} className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {messages.length === 0 ? (
                <p className="text-xs text-ink-400">Say hello while you wait.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={cn('text-sm', message.system && 'text-xs text-ink-400')}>
                    {message.system ? (
                      <p className="italic">{message.text}</p>
                    ) : (
                      <p>
                        <span className={cn('font-semibold', message.host ? 'text-brand-600 dark:text-brand-400' : '')}>
                          {message.name}
                        </span>
                        <span className="text-ink-500 dark:text-ink-400">: {message.text}</span>
                      </p>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="mt-3 flex gap-2">
              <input
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                maxLength={240}
                placeholder="Message…"
                className="input py-2 text-sm"
                aria-label="Chat message"
              />
              <Button type="submit" className="px-3" disabled={!chatText.trim()} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
