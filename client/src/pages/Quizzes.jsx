import { useEffect, useState } from 'react';
import { BookOpen, Search, SlidersHorizontal, X } from 'lucide-react';
import QuizCard from '../components/QuizCard.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/Alert.jsx';
import Select from '../components/Select.jsx';
import { CardSkeleton } from '../components/Spinner.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { cn } from '../lib/utils.js';

export default function Quizzes() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data: categoryData } = useApi('/quizzes/categories');
  const { data, loading, error } = useApi('/quizzes', {
    params: { search: debouncedSearch, category, difficulty, sort, page, limit: 9 },
  });

  // Any filter change resets pagination.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, difficulty, sort]);

  const quizzes = data?.quizzes ?? [];
  const categories = [{ name: 'all', count: null }, ...(categoryData?.categories ?? [])];
  const hasFilters = search || category !== 'all' || difficulty !== 'all' || sort !== 'newest';

  const reset = () => {
    setSearch('');
    setCategory('all');
    setDifficulty('all');
    setSort('newest');
  };

  return (
    <div className="container-page py-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Explore quizzes</h1>
        <p className="mt-2 text-ink-500 dark:text-ink-300">
          {data ? `${data.total} published quiz${data.total === 1 ? '' : 'zes'} across ${categoryData?.categories?.length ?? 0} categories.` : 'Find your next challenge.'}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-300" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, topic or category…"
              className="input pl-10 pr-10"
              aria-label="Search quizzes"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 dark:text-ink-300 hover:text-ink-700 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter by difficulty" className="sm:w-36">
              <option value="all">All levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
            <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort quizzes" className="sm:w-40">
              <option value="newest">Newest</option>
              <option value="popular">Most played</option>
              <option value="az">A → Z</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-300">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Category
          </span>
          {categories.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setCategory(item.name)}
              className={cn('chip', category === item.name && 'chip-active')}
              aria-pressed={category === item.name}
            >
              {item.name === 'all' ? 'All' : item.name}
              {item.count ? <span className="opacity-70">{item.count}</span> : null}
            </button>
          ))}
          {hasFilters ? (
            <button type="button" onClick={reset} className="ml-auto text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              Reset filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        {error ? <Alert>{error}</Alert> : null}

        {loading ? (
          <CardSkeleton count={6} />
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No quizzes match your filters"
            description="Try a different search term, or clear the filters to see everything."
            action={
              <button type="button" onClick={reset} className="btn-secondary mt-2">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz, index) => (
              <QuizCard key={quiz.id} quiz={quiz} index={index} />
            ))}
          </div>
        )}

        <Pagination page={data?.page ?? page} pages={data?.pages ?? 1} onChange={setPage} />
      </div>
    </div>
  );
}
