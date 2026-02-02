import { AppLayout } from "@/components/layout/AppLayout";
import { ReactionTest } from "@/components/tests/ReactionTest";
import { useTests } from "@/hooks/useTests";

export default function ReactionPage() {
  const { submitTestResult } = useTests();

  return (
    <AppLayout hideNav hideHeader>
      <ReactionTest
        submitAttempt={async (score, details) => {
          // submitTestResult returns AttemptDto | null
          const attempt = await submitTestResult("reaction", score, details);
          if (!attempt) return null;
          return { id: attempt.id };
        }}
      />
    </AppLayout>
  );
}