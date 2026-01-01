import { Loader2 } from 'lucide-react';

interface OptimizedLoadingProps {
  minimal?: boolean;
  fullPage?: boolean;
}

export function OptimizedLoading({ minimal = false, fullPage = false }: OptimizedLoadingProps) {
  if (minimal) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}
