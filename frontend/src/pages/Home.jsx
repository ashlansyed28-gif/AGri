import AuthForm from '../components/AuthForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-800 mb-2">AI Crop Advisory Assistant</h1>
        <p className="text-gray-600 max-w-lg mx-auto">Get real-time, highly optimized, AI-driven agricultural advisory reports for your farm plots.</p>
      </div>
      <AuthForm />
    </div>
  );
}
