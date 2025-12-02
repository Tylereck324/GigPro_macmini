import { notFound } from 'next/navigation';
import { DayContent } from './DayContent';

interface DayPageProps {
  params: {
    date: string;
  };
}

export default function DayPage({ params }: DayPageProps) {
  const { date } = params;

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    notFound();
  }

  return <DayContent date={date} />;
}
