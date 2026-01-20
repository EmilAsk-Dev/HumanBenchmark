import { AppLayout } from '@/components/layout/AppLayout';
import { TypingTest } from '@/components/tests/TypingTest';
import { useTests } from '@/hooks/useTests';

export default function TypingPage() {
  const { submitTestResult } = useTests();

  return (
    <AppLayout hideNav hideHeader>
      <TypingTest onComplete={(score) => submitTestResult('typing', score)} />
    </AppLayout>
  );
}
