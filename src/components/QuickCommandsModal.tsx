import React, { useState } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import {
  X,
  Terminal,
  Copy,
  CheckCheck,
  HardDrive,
  Network,
  Printer,
  Shield,
} from 'lucide-react';

interface QuickCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCommandsModal: React.FC<QuickCommandsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { config } = useChecklist();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const commandGroups = [
    {
      title: 'Diretórios da Loja (Prompt / PowerShell)',
      icon: HardDrive,
      commands: [
        {
          label: `Criar pasta ${config.pastaUtilMs}`,
          cmd: `cmd.exe /c mkdir "${config.pastaUtilMs}"`,
          desc: 'Cria o diretório de utilitários no Disco Local C:',
        },
        {
          label: `Criar pasta ${config.pastaCarga}`,
          cmd: `cmd.exe /c mkdir "${config.pastaCarga}"`,
          desc: 'Cria o diretório de carga no Disco Local C:',
        },
      ],
    },
    {
      title: 'Rede & Conectividade Toledo MGV',
      icon: Network,
      commands: [
        {
          label: `Ping na Balança (${config.balancaIp})`,
          cmd: `ping ${config.balancaIp} -t`,
          desc: 'Testa resposta contínua da balança Toledo na rede',
        },
        {
          label: 'Ver dados de IP da máquina',
          cmd: 'ipconfig /all',
          desc: 'Exibe endereço IPv4, máscara, gateway e DNS da máquina',
        },
        {
          label: 'Testar internet externa (Google DNS)',
          cmd: 'ping 8.8.8.8',
          desc: 'Confirma saída de pacotes para a internet',
        },
      ],
    },
    {
      title: 'Ativação & Gerenciamento do Windows',
      icon: Shield,
      commands: [
        {
          label: 'Verificar status da licença do Windows',
          cmd: 'slmgr /xpr',
          desc: 'Abre pop-up informando se o Windows está ativado permanentemente',
        },
        {
          label: 'Ver detalhes da licença OEM/Retail',
          cmd: 'slmgr /dli',
          desc: 'Exibe tipo de canal e últimos 5 dígitos da chave',
        },
        {
          label: 'Abrir Gerenciador de Dispositivos',
          cmd: 'devmgmt.msc',
          desc: 'Para checar drivers de vídeo, áudio, rede e portas COM',
        },
        {
          label: 'Abrir Windows Update',
          cmd: 'control update',
          desc: 'Abre a central de atualizações do sistema',
        },
      ],
    },
    {
      title: 'Impressão & Serviços',
      icon: Printer,
      commands: [
        {
          label: 'Abrir Dispositivos e Impressoras',
          cmd: 'control printers',
          desc: 'Acesso rápido para definir impressora padrão e portas',
        },
        {
          label: 'Reiniciar Spooler de Impressão',
          cmd: 'net stop spooler && net start spooler',
          desc: 'Destrava fila de impressão presa no Windows',
        },
      ],
    },
  ];

  const handleCopy = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Comandos Rápidos para Técnicos
              </h3>
              <p className="text-xs text-slate-400">
                Atalhos de CMD e PowerShell úteis para testes na máquina
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {commandGroups.map((group, gIdx) => {
            const Icon = group.icon;
            return (
              <div key={gIdx} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 pb-1 border-b border-slate-100">
                  <Icon className="w-4 h-4 text-emerald-600" />
                  {group.title}
                </h4>

                <div className="space-y-2">
                  {group.commands.map((c, cIdx) => {
                    const uniqueIdx = gIdx * 10 + cIdx;
                    const isCopied = copiedIndex === uniqueIdx;

                    return (
                      <div
                        key={cIdx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-xs font-bold text-slate-900 block">
                            {c.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {c.desc}
                          </span>
                          <code className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block mt-1">
                            {c.cmd}
                          </code>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(c.cmd, uniqueIdx)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 self-start sm:self-auto ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
