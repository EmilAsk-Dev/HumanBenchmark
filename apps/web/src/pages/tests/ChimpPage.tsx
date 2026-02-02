import { AppLayout } from "@/components/layout/AppLayout";
import { ChimpTest } from "@/components/tests/ChimpTest";
import { useTests } from "@/hooks/useTests";

export default function ChimpPage() {
  const { submitTestResult } = useTests();

  return (
    <AppLayout hideNav hideHeader>
      <ChimpTest
        submitAttempt={async (score, details) => {
          const attempt = await submitTestResult("chimp", score, details);
          if (!attempt) return null;
          return { id: attempt.id };
        }}
      />
    </AppLayout>
  );
}
