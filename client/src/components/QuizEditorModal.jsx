import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';
import Select from './Select.jsx';
import Textarea from './Textarea.jsx';
import QuestionEditor from './QuestionEditor.jsx';
import Alert from './Alert.jsx';
import { quizApi } from '../lib/api.js';
import { useToast } from '../hooks/useToast.js';

const emptyForm = {
  title: '',
  description: '',
  category: 'General',
  difficulty: 'medium',
  cover: '🧠',
  timeLimitSeconds: 20,
  isPublished: true,
  questions: [
    { text: '', options: ['', ''], correctIndex: 0, explanation: '', points: 10, timeLimitSeconds: 20 },
  ],
};

const COVERS = ['🧠', '💻', '🔬', '🌍', '🎬', '🏛️', '⚽', '🎵', '📚', '🚀'];
const CATEGORIES = ['General', 'Programming', 'Science', 'Geography', 'History', 'Entertainment', 'Sports', 'Music'];

export default function QuizEditorModal({ open, onClose, quiz, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError('');
    if (quiz) {
      setForm({
        title: quiz.title ?? '',
        description: quiz.description ?? '',
        category: quiz.category ?? 'General',
        difficulty: quiz.difficulty ?? 'medium',
        cover: quiz.cover ?? '🧠',
        timeLimitSeconds: quiz.timeLimitSeconds ?? 20,
        isPublished: quiz.isPublished ?? true,
        questions:
          quiz.questions?.length > 0
            ? quiz.questions.map((question) => ({
                text: question.text,
                options: [...question.options],
                correctIndex: question.correctIndex ?? 0,
                explanation: question.explanation ?? '',
                points: question.points ?? 10,
                timeLimitSeconds: question.timeLimitSeconds ?? 20,
              }))
            : emptyForm.questions,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, quiz]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    if (!form.category.trim()) next.category = 'Category is required';
    if (form.questions.length === 0) next.questions = 'Add at least one question';

    form.questions.forEach((question, index) => {
      if (question.text.trim().length < 3) next[`${index}.text`] = 'Question needs at least 3 characters';
      if (question.options.some((option) => !option.trim())) {
        next[`${index}.options`] = 'Every option needs text';
      }
      if (new Set(question.options.map((option) => option.trim().toLowerCase())).size !== question.options.length) {
        next[`${index}.options`] = 'Options must be unique';
      }
      if (question.correctIndex >= question.options.length) {
        next[`${index}.options`] = 'Mark one option as correct';
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      questions: form.questions.map((question) => ({
        text: question.text.trim(),
        options: question.options.map((option) => option.trim()),
        correctIndex: Number(question.correctIndex),
        explanation: question.explanation?.trim() || '',
        points: Number(question.points) || 10,
        timeLimitSeconds: Number(question.timeLimitSeconds) || 20,
      })),
    };

    setSaving(true);
    try {
      const response = quiz ? await quizApi.update(quiz.id, payload) : await quizApi.create(payload);
      toast.success(quiz ? 'Quiz updated' : 'Quiz created', `"${response.data.data.quiz.title}" is ready.`);
      onSaved?.(response.data.data.quiz);
      onClose?.();
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={quiz ? 'Edit quiz' : 'Create a quiz'}
      description="Questions are scored server-side — players never receive the correct answers."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {quiz ? 'Save changes' : 'Create quiz'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError ? <Alert>{serverError}</Alert> : null}

        <Input
          label="Title"
          value={form.title}
          onChange={(event) => set({ title: event.target.value })}
          placeholder="e.g. JavaScript Essentials"
          error={errors.title}
          maxLength={120}
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => set({ description: event.target.value })}
          placeholder="What will players learn?"
          rows={2}
          maxLength={600}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Category" value={form.category} onChange={(event) => set({ category: event.target.value })} error={errors.category}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Select label="Difficulty" value={form.difficulty} onChange={(event) => set({ difficulty: event.target.value })}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>

        <div>
          <span className="label">Cover</span>
          <div className="flex flex-wrap gap-2">
            {COVERS.map((cover) => (
              <button
                key={cover}
                type="button"
                onClick={() => set({ cover })}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition ${
                  form.cover === cover
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15'
                    : 'border-ink-200 hover:border-brand-300 dark:border-white/10'
                }`}
                aria-label={`Use ${cover} as cover`}
                aria-pressed={form.cover === cover}
              >
                {cover}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Default time per question (seconds)"
            type="number"
            min={5}
            max={120}
            value={form.timeLimitSeconds}
            onChange={(event) => set({ timeLimitSeconds: Number(event.target.value) })}
          />
          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-ink-700 dark:text-ink-300">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => set({ isPublished: event.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Publish immediately
          </label>
        </div>

        <div className="border-t border-ink-100 pt-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Questions</h3>
            <span className="text-xs text-ink-400">{form.questions.length} total</span>
          </div>
          <QuestionEditor
            questions={form.questions}
            onChange={(questions) => set({ questions })}
            errors={errors}
          />
          {errors.questions ? <p className="mt-2 text-xs text-rose-500">{errors.questions}</p> : null}
        </div>
      </form>
    </Modal>
  );
}
