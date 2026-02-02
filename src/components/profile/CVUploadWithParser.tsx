import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileCheck,
  Sparkles,
  Coins,
} from 'lucide-react';
import { useCVParsing } from '../../hooks/useCVParsing';
import { ParsedCVData } from '../../services/cvUploadParserService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface CVUploadWithParserProps {
  onParsed: (data: ParsedCVData) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  onNavigateToCreditStore?: () => void;
}

export default function CVUploadWithParser({
  onParsed,
  onError,
  disabled = false,
  onNavigateToCreditStore,
}: CVUploadWithParserProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isParsing, progress, error, parsedData, parseCV, reset } = useCVParsing();

  const requiredCredits = 10;

  const handleNavigateToCreditStore = useCallback(() => {
    if (onNavigateToCreditStore) {
      onNavigateToCreditStore();
    } else {
      window.location.href = '/?page=credit-store';
    }
  }, [onNavigateToCreditStore]);

  // Charger le solde de crédits
  useEffect(() => {
    const loadCredits = async () => {
      if (!user?.id) {
        setLoadingCredits(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits_balance')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setCreditsBalance(data.credits_balance || 0);
        }
      } catch (err) {
        console.error('Error loading credits:', err);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadCredits();
  }, [user?.id]);

  const hasEnoughCredits = creditsBalance >= requiredCredits;
  const isDisabled = disabled || !hasEnoughCredits || loadingCredits;

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (isDisabled) return;

      setFile(selectedFile);
      reset();

      const success = await parseCV(selectedFile);

      if (success && parsedData) {
        onParsed(parsedData);
        // Recharger le solde de crédits après l'analyse
        const { data } = await supabase
          .from('profiles')
          .select('credits_balance')
          .eq('user_id', user?.id)
          .single();
        if (data) {
          setCreditsBalance(data.credits_balance || 0);
        }
      } else if (error) {
        onError?.(error);
      }
    },
    [isDisabled, parseCV, parsedData, error, onParsed, onError, reset, user?.id]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (isDisabled || isParsing) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [isDisabled, isParsing, handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled && !isParsing) {
      setIsDragging(true);
    }
  }, [isDisabled, isParsing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    setFile(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [reset]);

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12" />;

    const fileType = file.type;
    if (fileType === 'application/pdf') return <FileText className="w-12 h-12 text-red-500" />;
    if (fileType.startsWith('image/')) return <ImageIcon className="w-12 h-12 text-blue-500" />;
    return <FileText className="w-12 h-12 text-blue-500" />;
  };

  const getStatusIcon = () => {
    if (isParsing) return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
    if (error) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (parsedData) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    return null;
  };

  const getStatusText = () => {
    if (isParsing) return 'Analyse en cours...';
    if (error) return 'Échec de l\'analyse';
    if (parsedData) return 'CV analysé avec succès';
    if (file) return 'En attente d\'analyse';
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* Zone d'upload principale */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-gray-300 bg-white'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        } ${isDisabled || isParsing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isDisabled && !isParsing && !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,image/jpeg,image/jpg,image/png"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isDisabled || isParsing}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Icône et titre */}
          {!file ? (
            <>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full">
                <Upload className="w-12 h-12 text-blue-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Téléversez votre CV
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Glissez-déposez votre fichier ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-gray-500">
                  Formats acceptés: PDF, DOCX, JPG, PNG • Taille max: 10 MB
                </p>
              </div>
              <button
                type="button"
                className={`px-6 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                  isDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isDisabled || isParsing}
              >
                <Upload className="w-5 h-5" />
                {loadingCredits ? 'Chargement...' : !hasEnoughCredits ? 'Crédits insuffisants' : 'Choisir un fichier'}
              </button>
            </>
          ) : (
            <div className="w-full">
              {/* Fichier sélectionné */}
              <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">
                  {getFileIcon()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 truncate">{file.name}</h4>
                    {!isParsing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove();
                        }}
                        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>
                      {file.type === 'application/pdf'
                        ? 'PDF'
                        : file.type.includes('word')
                        ? 'DOCX'
                        : file.type.startsWith('image/')
                        ? 'Image'
                        : 'Document'}
                    </span>
                  </div>

                  {/* État du parsing */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                      <span
                        className={`text-sm font-medium ${
                          error
                            ? 'text-red-600'
                            : parsedData
                            ? 'text-green-600'
                            : isParsing
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {getStatusText()}
                      </span>
                    </div>

                    {/* Barre de progression */}
                    {isParsing && (
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    {/* Message d'erreur */}
                    {error && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    {/* Résumé des données extraites */}
                    {parsedData && (
                      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-green-600" />
                          <h5 className="font-semibold text-green-900">Données extraites</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {parsedData.full_name && (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">Nom: {parsedData.full_name}</span>
                            </div>
                          )}
                          {parsedData.title && (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">Poste: {parsedData.title}</span>
                            </div>
                          )}
                          {parsedData.experiences?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">
                                {parsedData.experiences.length} expérience(s)
                              </span>
                            </div>
                          )}
                          {parsedData.education?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">
                                {parsedData.education.length} formation(s)
                              </span>
                            </div>
                          )}
                          {parsedData.skills?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">
                                {parsedData.skills.length} compétence(s)
                              </span>
                            </div>
                          )}
                          {parsedData.languages?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">
                                {parsedData.languages.length} langue(s)
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="mt-3 text-xs text-green-700">
                          Les champs du formulaire seront automatiquement remplis avec ces informations.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conseils et informations */}
      {!file && (
        <>
          <div className={`mt-4 p-4 rounded-lg border ${
            hasEnoughCredits
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex gap-3">
              {hasEnoughCredits ? (
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${
                  hasEnoughCredits ? 'text-blue-900' : 'text-red-900'
                }`}>
                  {hasEnoughCredits
                    ? 'Gagnez du temps avec l\'analyse IA'
                    : 'Crédits insuffisants'
                  }
                </h4>
                <p className={`text-sm ${
                  hasEnoughCredits ? 'text-blue-800' : 'text-red-800'
                }`}>
                  {hasEnoughCredits
                    ? 'Notre IA analysera automatiquement votre CV et remplira tous les champs du formulaire (identité, expériences, formations, compétences, etc.). Vous pourrez ensuite modifier les informations si nécessaire.'
                    : `Vous avez besoin de ${requiredCredits} crédits pour utiliser l'analyse IA de CV. Rechargez votre solde pour accéder à cette fonctionnalité.`
                  }
                </p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Coins className={`w-4 h-4 ${
                      hasEnoughCredits ? 'text-blue-700' : 'text-red-700'
                    }`} />
                    <span className={`text-xs font-medium ${
                      hasEnoughCredits ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      Coût: {requiredCredits} crédits
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className={`w-4 h-4 ${
                      hasEnoughCredits ? 'text-blue-700' : 'text-red-700'
                    }`} />
                    <span className={`text-xs font-medium ${
                      hasEnoughCredits ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {loadingCredits ? 'Chargement...' : `Solde: ${creditsBalance} crédits`}
                    </span>
                  </div>
                  {hasEnoughCredits && (
                    <span className="text-xs text-blue-700">
                      • Temps d'analyse: ~10 secondes
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!hasEnoughCredits && !loadingCredits && (
            <div className="mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigateToCreditStore();
                }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Coins className="w-5 h-5" />
                Acheter des crédits
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
