import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ Erreur capturée par ErrorBoundary:', error);
    console.error('Info:', errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-full">
                  <AlertTriangle className="w-12 h-12" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">
                Oops ! Une erreur s'est produite
              </h1>
              <p className="text-center text-white/90">
                Nous sommes désolés, quelque chose s'est mal passé
              </p>
            </div>

            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Détails de l'erreur:</h3>
                <p className="text-red-700 text-sm font-mono break-all">
                  {this.state.error?.toString()}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Recharger la page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Retour à l'accueil
                </button>
              </div>

              {import.meta.env.MODE === 'development' && this.state.errorInfo && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium">
                    Détails techniques (développement)
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Si le problème persiste, contactez notre support technique
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
