import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import QuizEditorModal from '../components/QuizEditorModal.jsx';
import { PageLoader } from '../components/Spinner.jsx';
import { quizApi } from '../lib/api.js';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useToast } from '../hooks/useToast.js';
import { cn, difficultyStyles, formatDate } from '../lib/utils.js';

export default function AdminQuizzes() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { data, loading, error, refetch } = useApi('/quizzes/mine');
  const debouncedSearch = useDebounce(search, 250);

  const quizzes = data?.quizzes ?? [];
  const filtered = useMemo(() => {
    if (!debouncedSearch) return quizzes;
    const term = debouncedSearch.toLowerCase();
    return quizzes.filter(
      (quiz) => quiz.title.toLowerCase().includes(term) || quiz.category.toLowerCase().includes(term),
    );
  }, [quizzes, debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (quiz) => {
    setEditing(quiz);
    setEditorOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await quizApi.remove(deleting.id);
      toast.success('Quiz deleted', `"${deleting.title}" is gone.`);
      setDeleting(null);
      refetch();
    } catch (error_) {
      toast.error('Could not delete quiz', error_.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePublish = async (quiz) => {
    try {
      await quizApi.update(quiz.id, { isPublished: !quiz.isPublished });
      toast.success(quiz.isPublished ? 'Quiz unpublished' : 'Quiz published');
      refetch();
    } catch (error_) {
      toast.error('Could not update quiz', error_.message);
    }
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Quiz library</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            {quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'} · create, edit and publish.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New quiz
        </Button>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-300" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your quizzes…"
          className="input pl-9"
          aria-label="Search quizzes"
        />
      </div>

      {error ? <Alert className="mt-4">{error}</Alert> : null}

      <div className="mt-5">
        {loading ? (
          <PageLoader label="Loading quizzes…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={quizzes.length === 0 ? 'No quizzes yet' : 'No matches'}
            description={
              quizzes.length === 0
                ? 'Create your first quiz and publish it for everyone to play.'
                : 'Try a different search term.'
            }
            action={
              quizzes.length === 0 ? (
                <Button onClick={openCreate} className="mt-2">
                  <Plus className="h-4 w-4" /> Create a quiz
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Quiz</th>
                    <th className="px-5 py-3 font-semibold">Level</th>
                    <th className="px-5 py-3 font-semibold">Questions</th>
                    <th className="px-5 py-3 font-semibold">Plays</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-white/5">
                  {filtered.map((quiz) => (
                    <tr key={quiz.id} className="transition hover:bg-ink-50/70 dark:hover:bg-white/5">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-lg dark:bg-white/10">
                            {quiz.cover}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/quizzes/${quiz.id}`}
                              className="block max-w-[240px] truncate font-medium hover:text-brand-600 dark:hover:text-brand-300"
                            >
                              {quiz.title}
                            </Link>
                            <p className="text-xs text-ink-400 dark:text-ink-300">
                              {quiz.category} · {formatDate(quiz.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('badge capitalize', difficultyStyles[quiz.difficulty])}>{quiz.difficulty}</span>
                      </td>
                      <td className="px-5 py-3 text-ink-500 dark:text-ink-300">{quiz.questionCount}</td>
                      <td className="px-5 py-3 text-ink-500 dark:text-ink-300">{quiz.plays}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => togglePublish(quiz)}
                          className={cn(
                            'badge transition',
                            quiz.isPublished
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300'
                              : 'bg-ink-200 text-ink-600 hover:bg-ink-300 dark:bg-white/10 dark:text-ink-300',
                          )}
                          title="Toggle published state"
                        >
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(quiz)}
                            className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label={`Edit ${quiz.title}`}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(quiz)}
                            className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            aria-label={`Delete ${quiz.title}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <QuizEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        quiz={editing}
        onSaved={() => refetch()}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title={`Delete "${deleting?.title ?? ''}"?`}
        description="The quiz and its recorded attempts will be removed."
        confirmLabel="Delete quiz"
      />
    </div>
  );
}
