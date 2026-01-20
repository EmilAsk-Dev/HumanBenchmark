import { AppLayout } from '@/components/layout/AppLayout';
import { ChimpTest } from '@/components/tests/ChimpTest';
import { useTests } from '@/hooks/useTests';

export default function ChimpPage() {
  const { submitTestResult } = useTests();

  return (
    <AppLayout hideNav hideHeader>
      <ChimpTest onComplete={(score) => submitTestResult('chimp', score)} />
    </AppLayout>
  );
}
