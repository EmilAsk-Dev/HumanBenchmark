import { AppLayout } from '@/components/layout/AppLayout';
import { SequenceTest } from '@/components/tests/SequenceTest';
import { useTests } from '@/hooks/useTests';

export default function SequencePage() {
  const { submitTestResult } = useTests();

  return (
    <AppLayout hideNav hideHeader>
      <SequenceTest onComplete={(score) => submitTestResult('sequence', score)} />
    </AppLayout>
  );
}
