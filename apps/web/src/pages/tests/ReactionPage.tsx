import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReactionTest } from '@/components/tests/ReactionTest';
import { useTests } from '@/hooks/useTests';

export default function ReactionPage() {
  const { submitTestResult } = useTests();
  const navigate = useNavigate();

  return (
    <AppLayout hideNav hideHeader>
      <ReactionTest onComplete={(score) => submitTestResult('reaction', score)} />
    </AppLayout>
  );
}
