import { AuthGuard } from '@/components/AuthGuard';
import { ArconicSimulator } from '@/components/arconic/ArconicSimulator';

const PracticePitching = () => {
  return (
    <AuthGuard>
      <ArconicSimulator />
    </AuthGuard>
  );
};

export default PracticePitching;
