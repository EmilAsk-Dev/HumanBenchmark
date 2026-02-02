import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { TestCard } from '@/components/tests/TestCard';
import { useTests } from '@/hooks/useTests';
import { TestType } from '@/types';

const testTypes: TestType[] = ['reaction', 'chimp', 'typing', 'sequence'];

export default function Tests() {
  const { getStatsForTest } = useTests();

  return (
    <AppLayout>
      <div className="p-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          Tests
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mb-6"
        >
          Challenge yourself and compete globally
        </motion.p>

        <div className="grid grid-cols-2 gap-4">
          {testTypes.map((type, index) => (
            <TestCard key={type} testType={type} stats={getStatsForTest(type)} index={index} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
