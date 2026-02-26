import AppLayout from '../components/layout/AppLayout.jsx';
import AIComposer from '../components/ai/AIComposer.jsx';
import { PenTool } from 'lucide-react';

const Compose = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <PenTool className="w-8 h-8 text-accent" />
            Compose
          </h1>
          <p className="text-gray-600 mt-1">AI-powered message composer</p>
        </div>

        <AIComposer />
      </div>
    </AppLayout>
  );
};

export default Compose;
