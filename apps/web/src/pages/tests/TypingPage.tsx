import { AppLayout } from "@/components/layout/AppLayout";
import { TypingTest } from "@/components/tests/TypingTest";
import { useTests } from "@/hooks/useTests";

export default function TypingPage() {
  const { submitTestResult } = useTests();

  return (
    <AppLayout hideNav hideHeader>
      <TypingTest
        submitAttempt={async (score, details) => {
          const attempt = await submitTestResult("typing", score, details);

          if (!attempt) return null;
          return { id: attempt.id };
        }}
      />
    </AppLayout>
  );
}
