import { AppLayout } from "@/components/layout/AppLayout";
import { SequenceTest } from "@/components/tests/SequenceTest";
import { useTests } from "@/hooks/useTests";

export default function SequencePage() {
  const { submitTestResult } = useTests();

  return (
    <AppLayout hideNav hideHeader>
      <SequenceTest
        submitAttempt={async (score, details) => {
          // submitTestResult returns AttemptDto | null
          const attempt = await submitTestResult(
            "sequence",
            score,
            details,
          );

          if (!attempt) return null;
          return { id: attempt.id };
        }}
      />
    </AppLayout>
  );
}
