import React from 'react';
import { CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PromptValidationService, PromptValidationResult } from '../../services/promptValidationService';

interface PromptValidationPanelProps {
  prompt: string;
}

export function PromptValidationPanel({ prompt }: PromptValidationPanelProps) {
  const validation = PromptValidationService.validate(prompt);

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-yellow-700';
    if (score >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  if (!prompt || prompt.trim().length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          Entrez un prompt pour voir l'analyse de qualité
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${getScoreBgColor(validation.score)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold ${getScoreTextColor(validation.score)}`}>
            Qualité du Prompt
          </h4>
          {validation.valid ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getScoreColorClass(validation.score)}`}
              style={{ width: `${validation.score}%` }}
            />
          </div>
          <span className={`font-bold text-lg ${getScoreTextColor(validation.score)}`}>
            {validation.score}/100
          </span>
        </div>
      </div>

      <div className="mb-3">
        <p className={`text-sm font-medium ${getScoreTextColor(validation.score)}`}>
          {PromptValidationService.getScoreLabel(validation.score)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            {validation.details.hasRoleDefinition ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className={validation.details.hasRoleDefinition ? 'text-green-700' : 'text-gray-600'}>
              Définition de rôle
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            {validation.details.hasInstructions ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className={validation.details.hasInstructions ? 'text-green-700' : 'text-gray-600'}>
              Instructions explicites
            </span>
          </div>
          <div className="flex items-center gap-2">
            {validation.details.hasOutputFormat ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className={validation.details.hasOutputFormat ? 'text-green-700' : 'text-gray-600'}>
              Format de sortie
            </span>
          </div>
        </div>

        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            {validation.details.hasExamples ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className={validation.details.hasExamples ? 'text-green-700' : 'text-gray-600'}>
              Exemples fournis
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            {validation.details.hasVariables ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className={validation.details.hasVariables ? 'text-green-700' : 'text-gray-600'}>
              Variables dynamiques
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">
              Longueur: {validation.details.length} caractères
            </span>
          </div>
        </div>
      </div>

      {validation.warnings.length > 0 && (
        <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">Avertissements:</p>
              <ul className="text-sm text-orange-600 space-y-1">
                {validation.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Suggestions d'amélioration:</p>
              <ul className="text-sm text-blue-600 space-y-1">
                {validation.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
