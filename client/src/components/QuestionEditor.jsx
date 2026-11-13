import { CheckCircle2, Copy, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils.js';

const newQuestion = () => ({
  text: '',
  options: ['', ''],
  correctIndex: 0,
  explanation: '',
  points: 10,
  timeLimitSeconds: 20,
});

export default function QuestionEditor({ questions, onChange, errors = {} }) {
  const update = (index, patch) => {
    onChange(questions.map((question, current) => (current === index ? { ...question, ...patch } : question)));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const question = questions[questionIndex];
    update(questionIndex, {
      options: question.options.map((option, current) => (current === optionIndex ? value : option)),
    });
  };

  const addOption = (questionIndex) => {
    const question = questions[questionIndex];
    if (question.options.length >= 6) return;
    update(questionIndex, { options: [...question.options, ''] });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const question = questions[questionIndex];
    if (question.options.length <= 2) return;
    const options = question.options.filter((_, current) => current !== optionIndex);
    update(questionIndex, {
      options,
      correctIndex: question.correctIndex >= options.length ? 0 : question.correctIndex,
    });
  };

  return (
    <div className="space-y-4">
      {questions.map((question, questionIndex) => (
        <div key={questionIndex} className="rounded-xl border border-ink-200 p-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-2">
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              Question {questionIndex + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange([...questions, { ...newQuestion(), ...questions[questionIndex] }])}
                className="rounded-md p-1.5 text-ink-400 dark:text-ink-300 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10"
                aria-label="Duplicate question"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(questions.filter((_, current) => current !== questionIndex))}
                disabled={questions.length === 1}
                className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-500/10"
                aria-label="Remove question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <textarea
            value={question.text}
            onChange={(event) => update(questionIndex, { text: event.target.value })}
            rows={2}
            placeholder="What do you want to ask?"
            className="input mt-3 resize-y"
            aria-label={`Question ${questionIndex + 1} text`}
          />
          {errors[`${questionIndex}.text`] ? (
            <p className="mt-1 text-xs text-rose-500">{errors[`${questionIndex}.text`]}</p>
          ) : null}

          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-ink-500 dark:text-ink-300">
              Options — tap the circle to mark the correct answer
            </p>
            {question.options.map((option, optionIndex) => {
              const isCorrect = question.correctIndex === optionIndex;
              return (
                <div key={optionIndex} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update(questionIndex, { correctIndex: optionIndex })}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-ink-300 text-transparent hover:border-emerald-400 dark:border-white/20',
                    )}
                    aria-label={`Mark option ${optionIndex + 1} as correct`}
                    aria-pressed={isCorrect}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <input
                    value={option}
                    onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="input py-2"
                    aria-label={`Option ${optionIndex + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(questionIndex, optionIndex)}
                    disabled={question.options.length <= 2}
                    className="rounded-md p-1.5 text-ink-400 dark:text-ink-300 transition hover:bg-ink-100 hover:text-rose-500 disabled:opacity-30 dark:hover:bg-white/10"
                    aria-label={`Remove option ${optionIndex + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {errors[`${questionIndex}.options`] ? (
              <p className="text-xs text-rose-500">{errors[`${questionIndex}.options`]}</p>
            ) : null}
            {question.options.length < 6 ? (
              <button
                type="button"
                onClick={() => addOption(questionIndex)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </button>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-medium text-ink-500 dark:text-ink-300">
              Explanation (optional)
              <input
                value={question.explanation || ''}
                onChange={(event) => update(questionIndex, { explanation: event.target.value })}
                placeholder="Shown after the question"
                className="input mt-1 py-2"
              />
            </label>
            <label className="text-xs font-medium text-ink-500 dark:text-ink-300">
              Points
              <input
                type="number"
                min={1}
                max={100}
                value={question.points}
                onChange={(event) => update(questionIndex, { points: Number(event.target.value) })}
                className="input mt-1 py-2"
              />
            </label>
            <label className="text-xs font-medium text-ink-500 dark:text-ink-300">
              Seconds
              <input
                type="number"
                min={5}
                max={120}
                value={question.timeLimitSeconds}
                onChange={(event) => update(questionIndex, { timeLimitSeconds: Number(event.target.value) })}
                className="input mt-1 py-2"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...questions, newQuestion()])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 py-3 text-sm font-medium text-ink-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/15 dark:text-ink-300 dark:hover:border-brand-500/60 dark:hover:text-brand-300"
      >
        <Plus className="h-4 w-4" /> Add question
      </button>
    </div>
  );
}
