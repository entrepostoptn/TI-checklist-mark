import React, { useState, useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { CompanyConfig } from '../types/checklist';
import { ConfirmModal } from './ConfirmModal';
import {
  X,
  RotateCcw,
  Save,
  Sliders,
  Scale,
  Tag,
  FolderTree,
  Info,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig, resetConfigToDefaults } = useChecklist();
  const [formData, setFormData] = useState<CompanyConfig>(config);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
    onClose();
  };

  const handleReset = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    resetConfigToDefaults();
    setIsResetConfirmOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Parâmetros e Padrões da Empresa
              </h3>
              <p className="text-xs text-slate-400">
                Altere IPs, etiquetas e diretórios sem modificar o código-fonte
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              As alterações feitas aqui atualizam imediatamente os textos das etapas de balança, MGV, pastas de carga e utilitários em todo o checklist. Os dados ficam salvos localmente neste computador.
            </p>
          </div>

          {/* Section: Balança Toledo & MGV */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Scale className="w-4 h-4 text-blue-600" />
              Configuração da Balança & MGV
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número da Balança Padrão
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={formData.balancaNumero}
                  onChange={(e) =>
                    setFormData({ ...formData, balancaNumero: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão da empresa: 1</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço IP da Balança
                </label>
                <input
                  type="text"
                  value={formData.balancaIp}
                  onChange={(e) => setFormData({ ...formData, balancaIp: e.target.value })}
                  placeholder="Ex: 192.168.0.201"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-mono font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão da empresa: 192.168.0.201</span>
              </div>
            </div>
          </div>

          {/* Section: Departamento & Etiqueta */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Tag className="w-4 h-4 text-blue-600" />
              Departamento & Formato da Etiqueta
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Departamento
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.departamentoNumero}
                  onChange={(e) =>
                    setFormData({ ...formData, departamentoNumero: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Departamento
                </label>
                <input
                  type="text"
                  value={formData.departamentoNome}
                  onChange={(e) => setFormData({ ...formData, departamentoNome: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão: GERAL</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código da Etiqueta
                </label>
                <input
                  type="text"
                  value={formData.etiquetaCodigo}
                  onChange={(e) => setFormData({ ...formData, etiquetaCodigo: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-mono font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão: 251</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tamanho da Etiqueta
                </label>
                <input
                  type="text"
                  value={formData.etiquetaTamanho}
                  onChange={(e) => setFormData({ ...formData, etiquetaTamanho: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão: 40 x 40</span>
              </div>
            </div>
          </div>

          {/* Section: Pastas & Impressora */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <FolderTree className="w-4 h-4 text-blue-600" />
              Diretórios do Sistema & Impressora
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Caminho Pasta UTIL MS
                </label>
                <input
                  type="text"
                  value={formData.pastaUtilMs}
                  onChange={(e) => setFormData({ ...formData, pastaUtilMs: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-mono font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão: C:\UTIL MS</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Caminho Pasta CARGA
                </label>
                <input
                  type="text"
                  value={formData.pastaCarga}
                  onChange={(e) => setFormData({ ...formData, pastaCarga: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-mono font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão: C:\CARGA</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marca / Padrão da Impressora
                </label>
                <input
                  type="text"
                  value={formData.impressoraPadrao}
                  onChange={(e) => setFormData({ ...formData, impressoraPadrao: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 font-medium"
                />
                <span className="text-[11px] text-slate-400">Padrão: Epson (TM-T20X)</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrões de Fábrica
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Parâmetros
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmação de Restauração de Parâmetros (In-App) */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Restaurar Parâmetros Iniciais?"
        message="Deseja restaurar todos os parâmetros e padrões técnicos da empresa para as configurações originais de fábrica?"
        confirmText="Restaurar Padrões"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
        variant="warning"
      />
    </div>
  );
};
