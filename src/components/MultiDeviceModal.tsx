import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Monitor,
  Smartphone,
  QrCode,
  Copy,
  Check,
  X,
  Share2,
  Download,
  Wifi,
  Sparkles,
  ExternalLink,
  Laptop,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MultiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiDeviceModal: React.FC<MultiDeviceModalProps> = ({ isOpen, onClose }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qrcode' | 'install' | 'features'>('qrcode');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setCurrentUrl(url);

      QRCode.toDataURL(url, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((dataUrl) => {
          setQrCodeDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('Erro ao gerar QR Code:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Checklist TI - Gestão de Equipamentos e OS',
          text: 'Acesse o sistema de Checklist e Gestão de TI no seu celular ou computador.',
          url: currentUrl,
        });
      } catch {
        // Ignorar cancelamento
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <div className="flex items-center -space-x-1.5">
                <Monitor className="w-4 h-4 text-blue-400" />
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight text-white">
                  Acesso por Computador e Celular
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Multi-Dispositivo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Totalmente responsivo e sincronizado em tempo real na nuvem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 sm:px-6 py-2 flex items-center gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Abrir no Celular (QR Code)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'install'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Como Instalar (PWA)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'features'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recursos por Dispositivo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* TAB 1: QR CODE / LINK */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* QR Code Container */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code para abrir no celular"
                        className="w-48 h-48 object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                        Gerando QR Code...
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-3 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Aponte a câmera do seu celular
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Abra o leitor de QR Code ou a câmera padrão do Android ou iPhone.
                  </p>
                </div>

                {/* Explanation & Link */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-blue-600" />
                      Mesmo sistema, qualquer dispositivo
                    </h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Você pode usar o sistema simultaneamente no <strong>computador</strong> (na bancada ou escritório) e no <strong>celular</strong> (circulando pela empresa, depósito ou lojas).
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-900">
                    <div className="font-bold flex items-center gap-1.5 text-blue-950">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Sincronização Automática em Nuvem
                    </div>
                    <p className="text-[11px] text-blue-800 leading-normal">
                      Tudo o que você cadastra ou altera no celular aparece na hora no computador, e vice-versa, através do banco de dados central Firebase.
                    </p>
                  </div>

                  {/* Copy Link Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Link direto para compartilhar:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={currentUrl}
                        className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                        title="Copiar URL"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="p-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer"
                        title="Compartilhar link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWA INSTALLATION GUIDE */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900">
                <div className="font-bold text-sm text-emerald-950 flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-emerald-700" />
                  Instale como Aplicativo (PWA) no Celular e no PC
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  Não é necessário baixar nada da Google Play ou Apple App Store! O sistema é um <strong>PWA (Progressive Web App)</strong> oficial, funcionando como um app nativo com ícone próprio na sua tela inicial e suporte para operação offline.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Android / Chrome */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    No Android (Google Chrome)
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                    <li>Abra o link do sistema no Google Chrome do celular.</li>
                    <li>Toque no menu de <strong>três pontos (⋮)</strong> no canto superior direito.</li>
                    <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    <li>Confirme. O ícone <strong>Checklist TI</strong> será criado na tela inicial do seu celular.</li>
                  </ol>
                </div>

                {/* iPhone / Safari */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    No iPhone / iPad (Safari)
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                    <li>Abra o link do sistema no navegador <strong>Safari</strong>.</li>
                    <li>Toque no botão de <strong>Compartilhar (quadrado com seta para cima ⎋)</strong> no rodapé.</li>
                    <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                    <li>Toque em <strong>"Adicionar"</strong> no canto superior. Pronto!</li>
                  </ol>
                </div>

                {/* PC / Desktop Chrome/Edge */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5 sm:col-span-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    No Computador (Chrome / Edge / Opera)
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Você também pode instalar no computador! Basta clicar no ícone de computador com seta para baixo <strong>(⊕ Instalar aplicativo)</strong> localizado no lado direito da barra de endereços do Chrome ou Edge. O Checklist TI abrirá em uma janela limpa, sem barra de navegador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FEATURES PER DEVICE */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Computador */}
                <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Computador / Desktop</div>
                      <div className="text-[11px] text-blue-700">Ideal para gestão e bancada</div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Visão Ampla:</strong> Tabelas completas de patrimônio, histórico e estoque com filtros rápidos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Impressão de Fichas:</strong> Emissão de comprovantes de OS, termos e relatórios operacionais.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Atalhos e Comandos:</strong> Acesso a scripts PowerShell/CMD para formatação de máquinas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Gestão Avançada:</strong> Perfil de Gestor para auditoria de métricas e limpeza de base.</span>
                    </li>
                  </ul>
                </div>

                {/* Celular */}
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Celular / Smartphone</div>
                      <div className="text-[11px] text-emerald-700">Ideal para mobilidade e campo</div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Mobilidade Total:</strong> Ande pelas lojas, depósitos e salas com o aplicativo no bolso.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Checklist na Bancada:</strong> Marque itens de formatação e homologação com um toque.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Abertura Rápida de OS:</strong> Registre problemas em equipamentos imediatamente no local.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Offline First:</strong> Funciona mesmo se a conexão cair temporariamente.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 text-[11px]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronização em tempo real ativa entre todos os computadores e celulares conectados.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all cursor-pointer text-center"
          >
            Entendido, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
