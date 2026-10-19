import React, { useState, useMemo, useEffect } from 'react';
import { KnowledgeArticle, KnowledgeCategory } from '../types/knowledgeBase';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToKnowledgeArticles,
  syncSaveKnowledgeArticle,
  syncDeleteKnowledgeArticle,
} from '../services/firestoreSync';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wrench,
  Building2,
  ClipboardCheck,
  Tag,
  Clock,
  User,
  X,
  ExternalLink,
  Printer,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

// Artigos operacionais pré-cadastrados da Mark Security
const INITIAL_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'art_01',
    titulo: 'Procedimento Operacional: Abertura e Triagem de Chamado Técnico / OS de Filial',
    categoria: 'ATENDIMENTO_OS',
    categoriaNome: 'Atendimento & OS',
    objetivo: 'Padronizar o registro e atendimento de incidentes e solicitações técnicas originadas pelas filiais da Mark Security.',
    quandoUtilizar: 'Sempre que uma loja relatar falha em equipamento, software de PDV, impressora fiscal, conexão de rede ou infraestrutura.',
    preRequisitos: [
      'Identificar o código e nome fantasia da filial solicitante',
      'Verificar o número de patrimônio ou número de série do equipamento envolvido',
      'Estar autenticado no sistema com perfil de Técnico ou Gestor',
    ],
    passos: [
      {
        numero: 1,
        titulo: 'Acessar o módulo de Matrizes e Filiais',
        instrucao: 'Selecione a matriz correspondente e localize a filial na listagem.',
        dicaOuAlerta: 'Certifique-se de que a filial está com status "Ativa". Filiais inativas só recebem OS mediante autorização administrativa.',
      },
      {
        numero: 2,
        titulo: 'Clicar em "Abrir Atendimento / OS"',
        instrucao: 'O sistema vinculará automaticamente o código da filial, endereço e contatos ao chamado.',
      },
      {
        numero: 3,
        titulo: 'Classificar o tipo e prioridade do atendimento',
        instrucao: 'Defina a criticidade: Baixa, Normal, Alta ou Crítica (se houver interrupção total das vendas).',
        dicaOuAlerta: 'Falhas em PDV único ou no servidor de retaguarda devem ser classificadas como prioridade Crítica.',
      },
      {
        numero: 4,
        titulo: 'Descrever o sintoma relatado e ação inicial',
        instrucao: 'Inclua detalhes objetivos do erro e testes rápidos já executados pelo operador da loja.',
      },
      {
        numero: 5,
        titulo: 'Salvar e acompanhar o status',
        instrucao: 'Monitore o chamado até o encerramento com registro formal das peças trocadas e assinatura técnica.',
      },
    ],
    resultadoEsperado: 'Chamado técnico registrado no banco de dados sincronizado e notificado para a equipe de suporte.',
    validacaoFinal: 'Conferir se o chamado aparece no painel operacional com o número da OS gerado.',
    oQueFazerSeErro: 'Se houver oscilação de internet na filial, o sistema registrará a OS localmente e sincronizará via Firestore assim que o sinal for restabelecido.',
    responsavelOuEquipe: 'Equipe de Suporte Técnico & Gestores Operacionais',
    tags: ['abertura os', 'chamado tecnico', 'filiais', 'triagem', 'suporte'],
    status: 'PUBLICADO',
    autorNome: 'Matheus Guarnieri',
    criadoEm: '2026-01-15T09:00:00Z',
    atualizadoEm: '2026-10-15T10:00:00Z',
  },
  {
    id: 'art_02',
    titulo: 'Guia Técnico: Execução de Checklist Diário de Abertura de Loja',
    categoria: 'CHECKLIST',
    categoriaNome: 'Checklists Operacionais',
    objetivo: 'Garantir conformidade física, tecnológica e sanitária antes do início do horário de funcionamento ao público.',
    quandoUtilizar: 'Diariamente entre 07:30 e 08:30 em todas as filiais em operação da Mark Security.',
    preRequisitos: [
      'Acesso ao sistema pelo celular ou computador da filial',
      'Chaves de acesso e verificação física dos ambientes',
    ],
    passos: [
      {
        numero: 1,
        titulo: 'Selecionar a unidade no menu de Checklists',
        instrucao: 'Escolha a filial correta e clique em "Novo Checklist".',
      },
      {
        numero: 2,
        titulo: 'Carregar o modelo padrão "Abertura de Loja & Frente de Caixa"',
        instrucao: 'O sistema preencherá automaticamente os itens de vistoria para a filial.',
        dicaOuAlerta: 'O modelo é carregado em modo snapshot: edições futuras nos modelos mestres não alteram históricos já salvos.',
      },
      {
        numero: 3,
        titulo: 'Avaliar cada item',
        instrucao: 'Marque Conforme (🟢), Não Conforme (🔴), Pendente (🟡) ou Não Aplicável (⚪).',
      },
      {
        numero: 4,
        titulo: 'Anexar observações obrigatórias em não conformidades',
        instrucao: 'Qualquer item não conforme deve ter justificativa clara e ação corretiva iniciada.',
      },
      {
        numero: 5,
        titulo: 'Concluir ou salvar rascunho',
        instrucao: 'Ao finalizar todos os itens, clique em "Concluir Checklist". Não conformidades serão sinalizadas no painel da diretoria.',
      },
    ],
    resultadoEsperado: 'Checklist concluído e arquivado com data, hora e responsável, sem possibilidade de alteração indevida sem reabertura autorizada.',
    validacaoFinal: 'Status do checklist deve mudar para "CONCLUIDO" no painel geral.',
    oQueFazerSeErro: 'Se o checklist foi encerrado por engano, solicite a reabertura formal ao Administrador com justificativa registrada em auditoria.',
    responsavelOuEquipe: 'Gerentes de Loja & Líderes de Turno',
    tags: ['checklist', 'abertura loja', 'pdv', 'conformidade', 'rotina'],
    status: 'PUBLICADO',
    autorNome: 'Marcos Oliveira',
    criadoEm: '2026-02-01T08:00:00Z',
    atualizadoEm: '2026-10-15T09:30:00Z',
  },
  {
    id: 'art_03',
    titulo: 'Diagnóstico e Resolução: Queda de Link e Instabilidade de Rede na Filial',
    categoria: 'PROCEDIMENTOS_TECNICOS',
    categoriaNome: 'Procedimentos Técnicos',
    objetivo: 'Restabelecer a conectividade do gateway da filial com o datacenter da Matriz Mark Security.',
    quandoUtilizar: 'Quando os PDVs reportarem erro de sincronismo ou o sistema operar em modo offline persistente.',
    preRequisitos: [
      'Acesso ao rack de comunicação ou bastidor de telecom da filial',
      'Contato do NOC ou provedor contratado da região',
    ],
    passos: [
      {
        numero: 1,
        titulo: 'Verificar os LEDs do modem da operadora principal',
        instrucao: 'Conferir se o LED PON/WAN está aceso em verde fixo.',
        dicaOuAlerta: 'LED vermelho piscante indica rompimento de fibra óptica externa. Acione a operadora de imediato.',
      },
      {
        numero: 2,
        titulo: 'Reiniciar o switch principal e router de contingência 4G',
        instrucao: 'Aguarde 40 segundos e religue o equipamento de alimentação primária.',
      },
      {
        numero: 3,
        titulo: 'Testar ping no IP do servidor de retaguarda da Matriz',
        instrucao: 'Abra o terminal do PDV 01 e execute o comando de diagnóstico.',
      },
      {
        numero: 4,
        titulo: 'Conferir o indicador de nuvem no sistema',
        instrucao: 'No canto superior do sistema Mark Security, clique no botão "Nuvem" para validar a sincronização ativa.',
      },
    ],
    resultadoEsperado: 'Comunicação normalizada com latência inferior a 45ms e fila de sincronização limpa.',
    validacaoFinal: 'Ícone de nuvem verde no cabeçalho indicando 100% sincronizado com Firebase.',
    oQueFazerSeErro: 'Acione o plantão de telecomunicações informando o número do circuito da operadora constante no cadastro da filial.',
    responsavelOuEquipe: 'Analistas de Redes & Suporte de Campo',
    tags: ['rede', 'internet', 'contingencia 4g', 'offline', 'link telecom'],
    status: 'PUBLICADO',
    autorNome: 'Matheus Guarnieri',
    criadoEm: '2026-02-15T11:00:00Z',
    atualizadoEm: '2026-10-15T08:00:00Z',
  },
  {
    id: 'art_04',
    titulo: 'Manutenção de PDV: Troca de Impressora Fiscal e Teste de Comunicação',
    categoria: 'EQUIPAMENTOS',
    categoriaNome: 'Equipamentos & PDV',
    objetivo: 'Substituição rápida de impressora não-fiscal/fiscal em caso de corte de bobina, travamento de guilhotina ou falha de porta USB.',
    quandoUtilizar: 'Em caso de interrupção na emissão de cupons de venda nos caixas das lojas.',
    preRequisitos: [
      'Equipamento reserva previamente testado no estoque da filial',
      'Cabo USB e cabo de alimentação 24V homologados',
    ],
    passos: [
      {
        numero: 1,
        titulo: 'Desligar o PDV e a impressora avariada',
        instrucao: 'Desconecte os cabos de comunicação e identifique o equipamento retirado.',
      },
      {
        numero: 2,
        titulo: 'Instalar a impressora reserva homologada',
        instrucao: 'Conecte na mesma porta USB (COM virtual) para preservar a configuração do driver.',
      },
      {
        numero: 3,
        titulo: 'Realizar impressão de teste de guilhotina e QR Code',
        instrucao: 'Execute o teste de impressão pelo utilitário técnico do sistema.',
      },
      {
        numero: 4,
        titulo: 'Atualizar o patrimônio no cadastro do equipamento',
        instrucao: 'No menu "Equipamentos & TI", vincule o novo número de série à filial correspondente.',
      },
    ],
    resultadoEsperado: 'Emissão normalizada em menos de 10 minutos sem perda de transações de venda.',
    validacaoFinal: 'Cupom de teste impresso com corte limpo e leitura de código de barras validada.',
    oQueFazerSeErro: 'Se o driver acusar "Porta Inacessível", execute o procedimento de reset de driver via gerenciador de dispositivos.',
    responsavelOuEquipe: 'Técnicos de Campo & Suporte N2',
    tags: ['impressora', 'pdv', 'frente de caixa', 'troca rapida', 'equipamentos'],
    status: 'PUBLICADO',
    autorNome: 'Matheus Guarnieri',
    criadoEm: '2026-03-01T14:00:00Z',
    atualizadoEm: '2026-10-15T09:00:00Z',
  },
  {
    id: 'art_05',
    titulo: 'Regras Corporativas: Inativação e Preservação Histórica de Filiais',
    categoria: 'MATRIZES_FILIAIS',
    categoriaNome: 'Matrizes & Filiais',
    objetivo: 'Esclarecer as regras do sistema Mark Security para desativação segura de unidades sem perda de vínculos históricos.',
    quandoUtilizar: 'Quando uma loja encerrar as atividades ou entrar em reforma prolongada.',
    preRequisitos: [
      'Permissão exclusiva de Administrador do sistema',
      'Justificativa fundamentada registrada no formulário',
    ],
    passos: [
      {
        numero: 1,
        titulo: 'Localizar a filial no módulo Matrizes e Filiais',
        instrucao: 'Clique no botão de status (🟢 Ativa / 🔴 Inativa).',
      },
      {
        numero: 2,
        titulo: 'Informar o motivo obrigatório da alteração',
        instrucao: 'O sistema exigirá justificativa para registrar no histórico de auditoria imutável.',
        dicaOuAlerta: 'Filiais NUNCA são excluídas do banco de dados, garantindo que ordens de serviço e checklists antigos permaneçam íntegros.',
      },
      {
        numero: 3,
        titulo: 'Confirmar a inativação',
        instrucao: 'A unidade receberá o indicador discreto de cor vermelha (🔴) e ficará filtrável em "Filiais Inativas".',
      },
    ],
    resultadoEsperado: 'Unidade inativada com histórico 100% preservado para consultas e auditorias fiscais.',
    validacaoFinal: 'Conferir no "Histórico de Modificações" o registro com usuário, data, status anterior e novo.',
    oQueFazerSeErro: 'Para reativar a filial futuramente, utilize a mesma opção fornecendo a justificativa de reabertura.',
    responsavelOuEquipe: 'Administradores da Mark Security',
    tags: ['inativacao', 'filiais', 'auditoria', 'regras cadastrais', 'historico'],
    status: 'PUBLICADO',
    autorNome: 'Matheus Guarnieri',
    criadoEm: '2026-03-10T16:00:00Z',
    atualizadoEm: '2026-10-15T09:10:00Z',
  },
];

const CATEGORIES: { id: KnowledgeCategory | 'TODAS'; label: string }[] = [
  { id: 'TODAS', label: 'Todas as Categorias' },
  { id: 'ATENDIMENTO_OS', label: 'Atendimento & OS' },
  { id: 'CHECKLIST', label: 'Checklists' },
  { id: 'EQUIPAMENTOS', label: 'Equipamentos & PDV' },
  { id: 'MATRIZES_FILIAIS', label: 'Matrizes & Filiais' },
  { id: 'PROCEDIMENTOS_TECNICOS', label: 'Procedimentos Técnicos' },
];

export const KnowledgeBaseView: React.FC = () => {
  const { user, permissions } = useAuth();
  const [articles, setArticles] = useState<KnowledgeArticle[]>(INITIAL_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'TODAS'>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  // Sincronização em tempo real da Base de Conhecimento com o Firestore
  useEffect(() => {
    const unsub = subscribeToKnowledgeArticles(
      (remoteArticles) => {
        if (remoteArticles) {
          setArticles(remoteArticles);
        }
      },
      (err) => console.warn('Knowledge articles sync error:', err)
    );
    return () => unsub();
  }, []);

  // New Article Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeCategory>('PROCEDIMENTOS_TECNICOS');
  const [newObjective, setNewObjective] = useState('');
  const [newWhenToUse, setNewWhenToUse] = useState('');
  const [newExpectedResult, setNewExpectedResult] = useState('');
  const [newStep1, setNewStep1] = useState('');

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchCat = selectedCategory === 'TODAS' || art.categoria === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        art.titulo.toLowerCase().includes(term) ||
        art.objetivo.toLowerCase().includes(term) ||
        art.tags.some((t) => t.toLowerCase().includes(term));
      return matchCat && matchText;
    });
  }, [articles, selectedCategory, searchTerm]);

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newObjective.trim()) return;

    const newArt: KnowledgeArticle = {
      id: `art_${Date.now()}`,
      titulo: newTitle.trim(),
      categoria: newCategory,
      categoriaNome: CATEGORIES.find((c) => c.id === newCategory)?.label || 'Procedimentos',
      objetivo: newObjective.trim(),
      quandoUtilizar: newWhenToUse.trim() || 'Durante atendimento ou manutenção operacional.',
      preRequisitos: ['Acesso ao sistema Mark Security'],
      passos: [
        {
          numero: 1,
          titulo: 'Execução do procedimento',
          instrucao: newStep1.trim() || 'Siga as orientações técnicas estabelecidas para a rotina.',
        },
      ],
      resultadoEsperado: newExpectedResult.trim() || 'Operação restabelecida com sucesso.',
      validacaoFinal: 'Conferir funcionamento normal da rotina no sistema.',
      oQueFazerSeErro: 'Contate a equipe de suporte avançado Mark Security.',
      responsavelOuEquipe: user?.nome || 'Suporte Técnico',
      tags: ['procedimento', 'manual', 'lojas'],
      status: 'PUBLICADO',
      autorNome: user?.nome || 'Técnico Mark Security',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    setArticles((prev) => [newArt, ...prev]);
    syncSaveKnowledgeArticle(newArt).catch((err) => console.warn('Erro ao salvar artigo no Firestore:', err));

    setIsNewModalOpen(false);
    setSelectedArticle(newArt);

    // Reset form
    setNewTitle('');
    setNewObjective('');
    setNewWhenToUse('');
    setNewExpectedResult('');
    setNewStep1('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Base de Conhecimento & Procedimentos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {filteredArticles.length} manuais
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manuais operacionais, instruções técnicas e resoluções de problemas para as lojas Mark Security.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Artigo / Manual</span>
        </button>
      </div>

      {/* Search and Category Filter Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, termo técnico, problema ou tag..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Articles List & Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Articles List (4 or 5 columns on desktop) */}
        <div className={`lg:col-span-5 space-y-3 ${selectedArticle ? 'hidden lg:block' : 'block'}`}>
          {filteredArticles.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              Nenhum artigo encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredArticles.map((art) => {
              const isSelected = selectedArticle?.id === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-300 shadow-sm'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wide">
                      {art.categoriaNome}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {art.passos.length} passos
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {art.titulo}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {art.objetivo}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[150px]">Por: {art.autorNome}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                      Ler manual <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Article Detail View (7 columns) */}
        <div className={`lg:col-span-7 ${!selectedArticle ? 'hidden lg:block' : 'block'}`}>
          {selectedArticle ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-7 shadow-xs space-y-5 sm:space-y-6">
              {/* Mobile Back Button */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold active:bg-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar aos Manuais</span>
                </button>
              </div>

              {/* Header */}
              <div className="border-b border-slate-100 pb-4 sm:pb-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
                    {selectedArticle.categoriaNome}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Atualizado em 15/10/2026
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {selectedArticle.autorNome}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {selectedArticle.titulo}
                </h2>
              </div>

              {/* Objetivo & Quando Utilizar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Objetivo</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{selectedArticle.objetivo}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Quando Utilizar</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{selectedArticle.quandoUtilizar}</p>
                </div>
              </div>

              {/* Pré-requisitos */}
              {selectedArticle.preRequisitos && selectedArticle.preRequisitos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Pré-Requisitos
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {selectedArticle.preRequisitos.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Passos numerados */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Passo a Passo da Operação
                </h4>
                <div className="space-y-3">
                  {selectedArticle.passos.map((p) => (
                    <div
                      key={p.numero}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {p.numero}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {p.titulo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                        {p.instrucao}
                      </p>
                      {p.dicaOuAlerta && (
                        <div className="ml-8 mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{p.dicaOuAlerta}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resultado Esperado e Contingência */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Resultado Esperado</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  {selectedArticle.resultadoEsperado}
                </p>

                {selectedArticle.oQueFazerSeErro && (
                  <div className="pt-2 border-t border-emerald-200/60 text-slate-700">
                    <span className="font-semibold text-slate-900">Em caso de erro persistente: </span>
                    <span>{selectedArticle.oQueFazerSeErro}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {selectedArticle.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 flex flex-col items-center justify-center min-h-[350px]">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Selecione um manual ao lado
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Consulte instruções detalhadas de suporte técnico, ordens de serviço, checklists e rotinas das lojas Mark Security.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Novo Artigo */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Publicar Novo Procedimento Técnico</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Artigo / Manual
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Procedimento de Backup e Fechamento de Caixa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as KnowledgeCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PROCEDIMENTOS_TECNICOS">Procedimentos Técnicos</option>
                  <option value="ATENDIMENTO_OS">Atendimento & OS</option>
                  <option value="CHECKLIST">Checklists Operacionais</option>
                  <option value="EQUIPAMENTOS">Equipamentos & PDV</option>
                  <option value="MATRIZES_FILIAIS">Matrizes & Filiais</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objetivo
                </label>
                <textarea
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  rows={2}
                  placeholder="Qual o objetivo deste procedimento?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quando Utilizar
                </label>
                <input
                  type="text"
                  value={newWhenToUse}
                  onChange={(e) => setNewWhenToUse(e.target.value)}
                  placeholder="Ex: Em caso de lentidão ou antes do encerramento do expediente"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passo 1 (Instrução Principal)
                </label>
                <textarea
                  value={newStep1}
                  onChange={(e) => setNewStep1(e.target.value)}
                  rows={2}
                  placeholder="Descreva a primeira instrução para o técnico ou operador"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resultado Esperado
                </label>
                <input
                  type="text"
                  value={newExpectedResult}
                  onChange={(e) => setNewExpectedResult(e.target.value)}
                  placeholder="Ex: Sistema operacional e vendas liberadas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                >
                  Publicar Manual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
