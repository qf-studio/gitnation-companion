import { getSchedule } from '@/lib/data';
import { ScreenHeader } from '@/components/server/ScreenHeader';
import { SearchView } from '@/components/client/SearchView';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const schedule = getSchedule();

  return (
    <>
      <ScreenHeader title="Search" />
      <SearchView schedule={schedule} initialQ={q} />
    </>
  );
}
