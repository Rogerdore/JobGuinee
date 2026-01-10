import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import ModernModal from '../modals/ModernModal';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (file: File | null) => void;
}

export default function ProfilePhotoUpload({ currentPhotoUrl, onPhotoChange }: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      setModalState({
        isOpen: true,
        title: 'Format non valide',
        message: 'Veuillez sélectionner une image au format JPG ou PNG.',
        type: 'warning',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalState({
        isOpen: true,
        title: 'Fichier trop volumineux',
        message: 'La taille de l\'image ne doit pas dépasser 5 MB. Veuillez compresser votre image ou en choisir une plus petite.',
        type: 'warning',
      });
      return;
    }

    // Créer preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onPhotoChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        Photo de profil
      </label>

      <div className="flex items-start gap-4">
        {/* Preview Circle */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Photo de profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
              title="Supprimer la photo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            className="hidden"
            id="profile-photo-upload"
          />

          <label
            htmlFor="profile-photo-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition font-medium"
          >
            <Upload className="w-4 h-4" />
            {preview ? 'Changer la photo' : 'Ajouter une photo'}
          </label>

          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-600">
              Formats acceptés: JPG, PNG
            </p>
            <p className="text-xs text-gray-600">
              Taille maximum: 5 MB
            </p>
            <p className="text-xs text-gray-500 italic">
              L'image sera automatiquement recadrée en cercle
            </p>
          </div>
        </div>
      </div>

      <ModernModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText="Compris"
      />
    </div>
  );
}
