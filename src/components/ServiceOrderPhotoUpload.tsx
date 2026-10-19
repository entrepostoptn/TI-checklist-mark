import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Eye, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface ServiceOrderPhotoUploadProps {
  fotoAbertura?: string;
  onChangeFotoAbertura?: (base64: string | undefined) => void;
  fotoFechamento?: string;
  onChangeFotoFechamento?: (base64: string | undefined) => void;
  readonly?: boolean;
}

export const ServiceOrderPhotoUpload: React.FC<ServiceOrderPhotoUploadProps> = ({
  fotoAbertura,
  onChangeFotoAbertura,
  fotoFechamento,
  onChangeFotoFechamento,
  readonly = false,
}) => {
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputAberturaRef = useRef<HTMLInputElement>(null);
  const cameraInputAberturaRef = useRef<HTMLInputElement>(null);
  const fileInputFechamentoRef = useRef<HTMLInputElement>(null);
  const cameraInputFechamentoRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File, type: 'abertura' | 'fechamento') => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsCompressing(type);
      setErrorMessage(null);
      // Redimensiona para max 1200px e otimiza JPEG
      const compressedBase64 = await compressImageFile(file, 1200, 0.8);
      if (type === 'abertura' && onChangeFotoAbertura) {
        onChangeFotoAbertura(compressedBase64);
      } else if (type === 'fechamento' && onChangeFotoFechamento) {
        onChangeFotoFechamento(compressedBase64);
      }
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      setErrorMessage('Falha ao processar ou comprimir a imagem. Tente novamente.');
    } finally {
      setIsCompressing(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'abertura' | 'fechamento') => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ========================================================= */}
        {/* FOTO 1: ABERTURA DO SERVIÇO */}
        {/* ========================================================= */}
        <div className="p-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  Foto na Abertura
                </h4>
                <p className="text-[11px] text-slate-500">
                  Estado inicial do equipamento ou defeito
                </p>
              </div>
            </div>
            {fotoAbertura ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Anexada
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Pendente
              </span>
            )}
          </div>

          {/* Visual Container */}
          <div className="relative rounded-xl border border-dashed border-blue-200 bg-white overflow-hidden min-h-[140px] flex items-center justify-center">
            {fotoAbertura ? (
              <div className="relative w-full h-44 group">
                <img
                  src={fotoAbertura}
                  alt="Foto na Abertura"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102 cursor-pointer"
                  onClick={() => setZoomImage({ url: fotoAbertura, title: 'Foto na Abertura do Serviço' })}
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomImage({ url: fotoAbertura, title: 'Foto na Abertura do Serviço' })}
                    className="p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white text-xs font-bold flex items-center gap-1 shadow-lg transition-all cursor-pointer"
                    title="Ampliar foto"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ampliar</span>
                  </button>
                  {!readonly && onChangeFotoAbertura && (
                    <button
                      type="button"
                      onClick={() => onChangeFotoAbertura(undefined)}
                      className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-lg transition-all cursor-pointer"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Nenhuma foto de abertura</p>
                  <p className="text-[11px] text-slate-400">Capture com a câmera ou envie da galeria</p>
                </div>
              </div>
            )}

            {isCompressing === 'abertura' && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Otimizando foto...</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!readonly && onChangeFotoAbertura && (
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={cameraInputAberturaRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'abertura')}
              />
              <input
                ref={fileInputAberturaRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'abertura')}
              />

              <button
                type="button"
                onClick={() => cameraInputAberturaRef.current?.click()}
                className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Tirar Foto</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputAberturaRef.current?.click()}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Escolher arquivo do computador ou galeria"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Arquivo</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FOTO 2: FECHAMENTO DO SERVIÇO */}
        {/* ========================================================= */}
        <div className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                2
              </span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  Foto no Fechamento
                </h4>
                <p className="text-[11px] text-slate-500">
                  Equipamento reparado, em teste ou lacrado
                </p>
              </div>
            </div>
            {fotoFechamento ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Anexada
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Pendente
              </span>
            )}
          </div>

          {/* Visual Container */}
          <div className="relative rounded-xl border border-dashed border-emerald-200 bg-white overflow-hidden min-h-[140px] flex items-center justify-center">
            {fotoFechamento ? (
              <div className="relative w-full h-44 group">
                <img
                  src={fotoFechamento}
                  alt="Foto no Fechamento"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102 cursor-pointer"
                  onClick={() => setZoomImage({ url: fotoFechamento, title: 'Foto no Fechamento / Conclusão' })}
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomImage({ url: fotoFechamento, title: 'Foto no Fechamento / Conclusão' })}
                    className="p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white text-xs font-bold flex items-center gap-1 shadow-lg transition-all cursor-pointer"
                    title="Ampliar foto"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ampliar</span>
                  </button>
                  {!readonly && onChangeFotoFechamento && (
                    <button
                      type="button"
                      onClick={() => onChangeFotoFechamento(undefined)}
                      className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-lg transition-all cursor-pointer"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Nenhuma foto de fechamento</p>
                  <p className="text-[11px] text-slate-400">Capture após concluir ou testar o serviço</p>
                </div>
              </div>
            )}

            {isCompressing === 'fechamento' && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Otimizando foto...</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!readonly && onChangeFotoFechamento && (
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={cameraInputFechamentoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'fechamento')}
              />
              <input
                ref={fileInputFechamentoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'fechamento')}
              />

              <button
                type="button"
                onClick={() => cameraInputFechamentoRef.current?.click()}
                className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Tirar Foto</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputFechamentoRef.current?.click()}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Escolher arquivo do computador ou galeria"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Arquivo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN ZOOM MODAL */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-3xl w-full p-4 overflow-hidden shadow-2xl flex flex-col space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-900">{zoomImage.title}</h3>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="p-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-900/5 rounded-xl p-2">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
