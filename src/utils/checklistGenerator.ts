import { CompanyConfig, MachineIdentification, ChecklistStep, ChecklistItem } from '../types/checklist';

export function getChecklistSteps(config: CompanyConfig, machine: MachineIdentification): ChecklistStep[] {
  const isPDV = machine.tipo === 'PDV';
  const utilizaImpressor = machine.utilizaImpressor;

  const steps: ChecklistStep[] = [
    // 1. Identificação da máquina
    {
      id: 'step_identificacao',
      number: 1,
      title: 'Identificação da Máquina',
      shortTitle: 'Identificação',
      description: 'Informe os dados da máquina, loja e técnico responsável antes de iniciar o procedimento.',
      applicableFor: 'ALL',
      items: [
        {
          id: 'id_maquina_preenchido',
          label: 'Identificação da máquina preenchida',
          sublabel: machine.identificacao ? `Identificação atual: "${machine.identificacao}"` : 'Preencha o número ou tag da máquina acima',
          done: Boolean(machine.identificacao.trim()),
        },
        {
          id: 'id_loja_preenchido',
          label: 'Loja informada',
          sublabel: machine.loja ? `Loja atual: "${machine.loja}"` : 'Informe a unidade / filial da loja',
          done: Boolean(machine.loja.trim()),
        },
        {
          id: 'id_tecnico_preenchido',
          label: 'Técnico responsável identificado',
          sublabel: machine.tecnico ? `Técnico: "${machine.tecnico}"` : 'Informe o nome do técnico responsável',
          done: Boolean(machine.tecnico.trim()),
        },
        {
          id: 'id_tipo_selecionado',
          label: `Tipo de máquina definido (${machine.tipo === 'PDV' ? 'PDV / Frente de Caixa' : 'Escritório'})`,
          sublabel: isPDV ? 'Configurado para fluxo de Frente de Caixa (sem Office obrigatório)' : 'Configurado para fluxo de Escritório (com verificação de Office)',
          done: true,
        },
      ],
    },

    // 2. WINDOWS
    {
      id: 'step_windows',
      number: 2,
      title: 'Sistema Operacional (Windows)',
      shortTitle: 'Windows',
      description: 'Validação da instalação base, ativação de licença, drivers de hardware e conectividade de rede.',
      applicableFor: 'ALL',
      items: [
        {
          id: 'win_instalado',
          label: 'Windows instalado',
          sublabel: 'Sistema operacional instalado no SSD/HD e inicializando sem falhas',
          done: false,
        },
        {
          id: 'win_verificar_ativado',
          label: 'Verificar se o Windows está ativado',
          sublabel: 'Acesse Configurações > Sistema > Ativação ou execute o comando de verificação',
          commandToCopy: 'slmgr /xpr',
          commandLabel: 'Copiar comando de ativação (slmgr /xpr)',
          done: false,
        },
        {
          id: 'win_confirmar_licenca',
          label: 'Confirmar licença / ativação',
          sublabel: 'Garantir que a chave OEM/Digital está devidamente reconhecida e válida',
          done: false,
        },
        {
          id: 'win_update',
          label: 'Executar Windows Update',
          sublabel: 'Baixar e instalar todas as atualizações cumulativas e de segurança até não restar pendência',
          commandToCopy: 'control update',
          commandLabel: 'Abrir Windows Update',
          done: false,
        },
        {
          id: 'win_drivers',
          label: 'Verificar drivers no Gerenciador de Dispositivos',
          sublabel: 'Conferir se não há nenhum item com exclamação amarela ou "Dispositivo desconhecido"',
          commandToCopy: 'devmgmt.msc',
          commandLabel: 'Abrir Gerenciador de Dispositivos (devmgmt.msc)',
          done: false,
        },
        {
          id: 'win_rede',
          label: 'Testar conexão de rede / internet',
          sublabel: 'Testar navegação via cabo Ethernet e Wi-Fi (se aplicável), ping no gateway e DNS externo',
          commandToCopy: 'ping -t 8.8.8.8',
          commandLabel: 'Testar ping (8.8.8.8)',
          done: false,
        },
      ],
    },

    // 3. TIPO DE MÁQUINA - ESCRITÓRIO
    {
      id: 'step_office',
      number: 3,
      title: 'Aplicativos de Escritório (Microsoft Office)',
      shortTitle: 'Office',
      description: isPDV
        ? 'Etapa dispensada: máquinas de PDV / Frente de Caixa não necessitam da suíte Microsoft Office.'
        : 'Verificação da necessidade e instalação da suíte Microsoft Office para máquinas administrativas.',
      applicableFor: 'ESCRITORIO',
      items: [
        {
          id: 'off_verificar_necessidade',
          label: 'Verificar necessidade de Microsoft Office',
          sublabel: 'Confirmar com o gestor da loja ou perfil do colaborador se a máquina usará Word/Excel',
          done: false,
          conditionalType: 'ESCRITORIO',
        },
        {
          id: 'off_instalar',
          label: 'Instalar Microsoft Office, quando necessário',
          sublabel: 'Instalar pacote Office (versão corporativa / 365 homologada pela empresa)',
          done: false,
          conditionalType: 'ESCRITORIO',
        },
        {
          id: 'off_testar_word',
          label: 'Testar Word',
          sublabel: 'Abrir o Microsoft Word, criar um documento em branco e testar digitação e salvamento',
          done: false,
          conditionalType: 'ESCRITORIO',
        },
        {
          id: 'off_testar_excel',
          label: 'Testar Excel',
          sublabel: 'Abrir o Microsoft Excel, testar criação de planilha e cálculo simples de fórmula',
          done: false,
          conditionalType: 'ESCRITORIO',
        },
      ],
    },

    // 4. PASTA UTIL MS
    {
      id: 'step_util_ms',
      number: 4,
      title: `Pasta de Utilitários (${config.pastaUtilMs})`,
      shortTitle: 'UTIL MS',
      description: `Criar no Disco Local C: a pasta "${config.pastaUtilMs}". Todos os programas, instaladores e arquivos da manutenção devem ficar nela.`,
      applicableFor: 'ALL',
      items: [
        {
          id: 'util_criar_pasta',
          label: `Criar ${config.pastaUtilMs}`,
          sublabel: 'Garantir a criação do diretório na raiz do Disco Local C:',
          commandToCopy: `cmd.exe /c mkdir "${config.pastaUtilMs}"`,
          commandLabel: `Copiar comando para criar ${config.pastaUtilMs}`,
          done: false,
        },
        {
          id: 'util_conferir_arquivos',
          label: 'Conferir arquivos/programas necessários',
          sublabel: 'Verificar a presença dos instaladores essenciais (Chrome, WinRAR, MGV, Impressor, drivers, logos, etc.)',
          done: false,
        },
      ],
    },

    // 5. IMPRESSORA
    {
      id: 'step_impressora',
      number: 5,
      title: 'Configuração de Impressora',
      shortTitle: 'Impressora',
      description: `Instalação de drivers e configuração de impressora térmica ou padrão da loja (Padrão mais utilizado: ${config.impressoraPadrao}).`,
      applicableFor: 'ALL',
      items: [
        {
          id: 'imp_instalar_driver',
          label: 'Instalar driver da impressora',
          sublabel: `Instalar o driver correspondente no sistema operacional (ex: ${config.impressoraPadrao} TM-T20X)`,
          done: false,
        },
        {
          id: 'imp_configurar',
          label: 'Configurar impressora',
          sublabel: 'Definir porta de comunicação (USB, COM virtual ou TCP/IP de rede) e velocidade',
          commandToCopy: 'control printers',
          commandLabel: 'Abrir Dispositivos e Impressoras',
          done: false,
        },
        {
          id: 'imp_conferir_padrao',
          label: 'Conferir impressora padrão',
          sublabel: 'Garantir que a impressora correta está marcada como Padrão do Windows',
          done: false,
        },
        {
          id: 'imp_teste_impressao',
          label: 'Realizar impressão de teste',
          sublabel: 'Imprimir página de teste pelo Windows e conferir corte/alimentação da bobina',
          done: false,
        },
      ],
    },

    // 6. MGV (Configuração do MGV)
    {
      id: 'step_mgv',
      number: 6,
      title: 'Configuração do MGV',
      shortTitle: 'MGV',
      description: 'Configuração completa do Módulo Gerenciador de Vendas Toledo, balança de rede, etiquetas e cargas.',
      applicableFor: 'ALL',
      items: [],
      subsections: [
        {
          id: 'mgv_sub_instalacao',
          code: '6.1',
          title: 'Instalação',
          badge: 'Software Base',
          items: [
            {
              id: 'mgv_instalar',
              label: 'Instalar MGV',
              sublabel: 'Executar instalador localizado na pasta de utilitários',
              done: false,
            },
            {
              id: 'mgv_abrir',
              label: 'Abrir o MGV',
              sublabel: 'Iniciar o executável com privilégios de administrador',
              done: false,
            },
            {
              id: 'mgv_confirmar_abertura',
              label: 'Confirmar que o programa abre corretamente',
              sublabel: 'Validar se a tela principal carrega sem erros de banco ou DLLs ausentes',
              done: false,
            },
          ],
        },
        {
          id: 'mgv_sub_balanca',
          code: '6.2',
          title: 'Configuração da balança',
          badge: `Balança ${config.balancaNumero} • IP ${config.balancaIp}`,
          items: [
            {
              id: 'mgv_config_balanca_1',
              label: `Configurar Balança ${config.balancaNumero}`,
              sublabel: `Cadastrar a balança de código ${config.balancaNumero} no cadastro de equipamentos`,
              done: false,
            },
            {
              id: 'mgv_informar_ip',
              label: `Informar IP ${config.balancaIp}`,
              sublabel: `Definir endereço IP ${config.balancaIp} na interface Ethernet do MGV`,
              commandToCopy: `ping ${config.balancaIp}`,
              commandLabel: `Copiar ping para ${config.balancaIp}`,
              done: false,
            },
            {
              id: 'mgv_salvar_config_balanca',
              label: 'Salvar configuração',
              sublabel: 'Gravar os dados cadastrais da balança no banco de dados do MGV',
              done: false,
            },
            {
              id: 'mgv_testar_comunicacao',
              label: 'Testar comunicação com a balança',
              sublabel: 'Disparar teste de comunicação no MGV e confirmar resposta positiva (OK)',
              done: false,
            },
          ],
        },
        {
          id: 'mgv_sub_departamento',
          code: '6.3',
          title: 'Departamento',
          badge: `Depto ${config.departamentoNumero} — ${config.departamentoNome}`,
          items: [
            {
              id: 'mgv_config_departamento',
              label: `Configurar Departamento ${config.departamentoNumero} — ${config.departamentoNome}`,
              sublabel: `Cadastrar o departamento ${config.departamentoNumero} com a descrição "${config.departamentoNome}"`,
              done: false,
            },
          ],
        },
        {
          id: 'mgv_sub_etiqueta',
          code: '6.4',
          title: 'Etiqueta',
          badge: `Mod. ${config.etiquetaCodigo} • ${config.etiquetaTamanho}`,
          items: [
            {
              id: 'mgv_selecionar_etiqueta',
              label: `Selecionar etiqueta ${config.etiquetaCodigo}`,
              sublabel: `Definir formato de etiqueta padrão Toledo código ${config.etiquetaCodigo}`,
              done: false,
            },
            {
              id: 'mgv_confirmar_tamanho',
              label: `Confirmar tamanho ${config.etiquetaTamanho}`,
              sublabel: `Validar dimensões físicas da bobina térmica (${config.etiquetaTamanho} mm)`,
              done: false,
            },
          ],
        },
        {
          id: 'mgv_sub_pasta_carga',
          code: '6.5',
          title: `Pasta CARGA (${config.pastaCarga})`,
          badge: config.pastaCarga,
          items: [
            {
              id: 'mgv_criar_pasta_carga',
              label: `Criar pasta ${config.pastaCarga}`,
              sublabel: 'Criar diretório de intercâmbio de arquivos na raiz do disco C:',
              commandToCopy: `cmd.exe /c mkdir "${config.pastaCarga}"`,
              commandLabel: `Copiar comando para criar ${config.pastaCarga}`,
              done: false,
            },
            {
              id: 'mgv_confirmar_pasta_carga',
              label: 'Confirmar que a pasta está criada corretamente',
              sublabel: `Verificar no Windows Explorer se ${config.pastaCarga} existe com permissões totais`,
              done: false,
            },
          ],
        },
        {
          id: 'mgv_sub_carga_automatica',
          code: '6.6',
          title: 'Carga Automática',
          badge: 'Painel de Controle',
          items: [
            {
              id: 'mgv_auto_abrir_painel',
              label: 'Abrir Painel de Controle',
              sublabel: 'Acessar o Painel de Controle do MGV / Serviços',
              done: false,
            },
            {
              id: 'mgv_auto_localizar_config',
              label: 'Localizar configuração relacionada à carga',
              sublabel: 'Ir na aba de automação e agendamento de tarefas',
              done: false,
            },
            {
              id: 'mgv_auto_ativar',
              label: 'Ativar Carga Automática',
              sublabel: 'Marcar a caixa de seleção de transmissão periódica automática',
              done: false,
            },
            {
              id: 'mgv_auto_salvar',
              label: 'Salvar configuração',
              sublabel: 'Aplicar as novas diretrizes do serviço',
              done: false,
            },
            {
              id: 'mgv_auto_confirmar',
              label: 'Confirmar ativação',
              sublabel: 'Verificar status do serviço em execução (Executando / Ativo)',
              done: false,
            },
          ],
        },
        {
          id: 'mgv_sub_carga_remota',
          code: '6.7',
          title: 'Carga Remota',
          badge: 'Painel de Controle',
          items: [
            {
              id: 'mgv_remota_ativar',
              label: 'Ativar Carga Remota',
              sublabel: 'Habilitar o recebimento de transmissões de carga originadas pelo servidor central',
              done: false,
            },
            {
              id: 'mgv_remota_salvar',
              label: 'Salvar configuração',
              sublabel: 'Gravar alterações nas configurações de comunicação remota',
              done: false,
            },
            {
              id: 'mgv_remota_confirmar',
              label: 'Confirmar ativação',
              sublabel: 'Validar porta e escuta de socket ativada',
              done: false,
            },
          ],
        },
        {
          id: 'mgv_sub_itens_retaguarda',
          code: '6.8',
          title: 'Arquivo de itens do retaguarda',
          badge: 'Importação ERP',
          items: [
            {
              id: 'mgv_itens_receber',
              label: 'Receber/gerar arquivo de itens do retaguarda',
              sublabel: 'Exportar TXT de produtos (ITENSMGV.TXT ou TXITENS.TXT) a partir do ERP',
              done: false,
            },
            {
              id: 'mgv_itens_conferir_arquivo',
              label: 'Conferir arquivo',
              sublabel: 'Verificar tamanho do arquivo e integridade dos registros de preços e produtos',
              done: false,
            },
            {
              id: 'mgv_itens_colocar_local',
              label: `Colocar o arquivo no local correto (${config.pastaCarga})`,
              sublabel: `Mover ou colar o arquivo recebido dentro da pasta ${config.pastaCarga}`,
              done: false,
            },
            {
              id: 'mgv_itens_abrir_mgv',
              label: 'Abrir MGV',
              sublabel: 'Retornar ao aplicativo MGV',
              done: false,
            },
            {
              id: 'mgv_itens_acessar_importacao',
              label: 'Acessar a função de importação',
              sublabel: 'Navegar até Menu > Ferramentas > Importar Dados',
              done: false,
            },
            {
              id: 'mgv_itens_importar',
              label: 'Importar arquivo de itens',
              sublabel: 'Selecionar o arquivo e iniciar o processamento',
              done: false,
            },
            {
              id: 'mgv_itens_aguardar',
              label: 'Aguardar conclusão da importação',
              sublabel: 'Esperar a barra de progresso atingir 100% sem erros de sintaxe',
              done: false,
            },
            {
              id: 'mgv_itens_confirmar',
              label: 'Confirmar que os itens foram importados corretamente',
              sublabel: 'Consultar cadastro de itens no MGV e validar se os preços e descrições batem',
              done: false,
            },
          ],
        },
      ],
    },

    // 7. IMPRESSOR
    {
      id: 'step_impressor',
      number: 7,
      title: 'Impressor',
      shortTitle: 'Impressor',
      description: utilizaImpressor
        ? 'Se a máquina utilizar impressão pelo sistema: instalação, parametrização e teste do Impressor.'
        : 'Etapa desabilitada para esta máquina (não utiliza Impressor).',
      applicableFor: 'IMPRESSOR',
      items: [
        {
          id: 'imp_mod_instalar',
          label: 'Instalar Impressor',
          sublabel: `Executar instalador do Impressor localizado na pasta ${config.pastaUtilMs}`,
          done: false,
          conditionalType: 'IMPRESSOR',
        },
        {
          id: 'imp_mod_abrir',
          label: 'Abrir Impressor',
          sublabel: 'Iniciar o aplicativo Impressor e checar inicialização correta',
          done: false,
          conditionalType: 'IMPRESSOR',
        },
        {
          id: 'imp_mod_configurar',
          label: 'Configurar conforme padrão da empresa',
          sublabel: 'Apontar diretório dos spools, porta da impressora e modelo homologado',
          done: false,
          conditionalType: 'IMPRESSOR',
        },
        {
          id: 'imp_mod_testar_impressao',
          label: 'Testar impressão',
          sublabel: 'Emitir documento de teste a partir do módulo Impressor',
          done: false,
          conditionalType: 'IMPRESSOR',
        },
        {
          id: 'imp_mod_confirmar_comunicacao',
          label: 'Confirmar comunicação',
          sublabel: 'Garantir que a fila de impressão não trava e responde com rapidez',
          done: false,
          conditionalType: 'IMPRESSOR',
        },
      ],
    },

    // 8. FULL PDV — FRENTE DE CAIXA
    {
      id: 'step_full_pdv',
      number: 8,
      title: 'Full PDV — Frente de Caixa',
      shortTitle: 'Full PDV',
      description: isPDV
        ? 'Instalação, parametrização e teste de homologação do software de frente de caixa.'
        : 'Etapa dispensada: esta máquina é do tipo "Escritório" e não opera Frente de Caixa.',
      applicableFor: 'PDV',
      items: [
        {
          id: 'pdv_instalar',
          label: 'Instalar Full PDV',
          sublabel: `Executar o pacote instalador do Full PDV (${config.pastaUtilMs})`,
          done: false,
          conditionalType: 'PDV',
        },
        {
          id: 'pdv_abrir',
          label: 'Abrir Full PDV',
          sublabel: 'Executar o executável principal da frente de caixa',
          done: false,
          conditionalType: 'PDV',
        },
        {
          id: 'pdv_configurar',
          label: 'Configurar conforme padrão da loja',
          sublabel: `Vincular filial (${machine.loja || 'Loja'}), número do caixa (${machine.identificacao || 'PDV'}) e servidor`,
          done: false,
          conditionalType: 'PDV',
        },
        {
          id: 'pdv_verificar_comunicacao',
          label: 'Verificar comunicação com os sistemas necessários',
          sublabel: 'Testar comunicação com o banco central, TEF, SAT/NFC-e e balança de checkout',
          done: false,
          conditionalType: 'PDV',
        },
        {
          id: 'pdv_testar_abertura',
          label: 'Testar abertura do sistema',
          sublabel: 'Realizar login com operador e abrir turno / tela inicial de venda',
          done: false,
          conditionalType: 'PDV',
        },
        {
          id: 'pdv_teste_operacao',
          label: 'Realizar teste de operação',
          sublabel: 'Passar item de teste com código de barras, cancelar e conferir cupom',
          done: false,
          conditionalType: 'PDV',
        },
      ],
    },

    // 9. TESTE FINAL
    {
      id: 'step_teste_final',
      number: 9,
      title: 'Teste Final',
      shortTitle: 'Teste Final',
      description: 'Antes de finalizar o atendimento: revisão de todos os pontos obrigatórios antes de entregar a máquina.',
      applicableFor: 'ALL',
      items: [
        {
          id: 'final_win_ativado',
          label: 'Windows ativado',
          sublabel: 'Licença confirmada sem alertas',
          done: false,
        },
        {
          id: 'final_win_atualizado',
          label: 'Windows atualizado',
          sublabel: 'Windows Update em dia',
          done: false,
        },
        {
          id: 'final_drivers_ok',
          label: 'Drivers OK',
          sublabel: 'Gerenciador de dispositivos sem inconsistências',
          done: false,
        },
        {
          id: 'final_rede_ok',
          label: 'Rede/internet OK',
          sublabel: 'Navegação e conectividade estável',
          done: false,
        },
        {
          id: 'final_util_ms_criada',
          label: `${config.pastaUtilMs} criada`,
          sublabel: 'Estrutura de arquivos e utilitários organizada',
          done: false,
        },
        {
          id: 'final_progs_instalados',
          label: 'Programas necessários instalados',
          sublabel: 'Chrome, WinRAR e softwares essenciais prontos',
          done: false,
        },
        {
          id: 'final_impressora_func',
          label: 'Impressora funcionando',
          sublabel: `Impressora padrão (${config.impressoraPadrao}) imprimindo com nitidez`,
          done: false,
        },
        {
          id: 'final_mgv_func',
          label: 'MGV funcionando',
          sublabel: 'Módulo Gerenciador de Vendas em operação',
          done: false,
        },
        {
          id: 'final_balanca_ip',
          label: `Balança ${config.balancaNumero} configurada com IP ${config.balancaIp}`,
          sublabel: 'Comunicação validada',
          done: false,
        },
        {
          id: 'final_depto_geral',
          label: `Departamento ${config.departamentoNumero} — ${config.departamentoNome} configurado`,
          sublabel: 'Parâmetro cadastrado',
          done: false,
        },
        {
          id: 'final_etiqueta_conf',
          label: `Etiqueta ${config.etiquetaCodigo} — ${config.etiquetaTamanho} configurada`,
          sublabel: 'Formato Toledo ajustado',
          done: false,
        },
        {
          id: 'final_pasta_carga',
          label: `${config.pastaCarga} criada`,
          sublabel: 'Pasta de carga no C: validada',
          done: false,
        },
        {
          id: 'final_carga_auto',
          label: 'Carga Automática ativada',
          sublabel: 'Configuração no painel confirmada',
          done: false,
        },
        {
          id: 'final_carga_remota',
          label: 'Carga Remota ativada',
          sublabel: 'Recepção remota ativada',
          done: false,
        },
        {
          id: 'final_itens_mgv',
          label: 'Arquivo de itens importado no MGV',
          sublabel: 'Base de itens sincronizada',
          done: false,
        },
        {
          id: 'final_impressor_func',
          label: 'Impressor funcionando, quando aplicável',
          sublabel: utilizaImpressor ? 'Spooler do Impressor operacional' : 'Dispensado (máquina não utiliza Impressor)',
          done: false,
          isConditional: true,
          conditionalType: 'IMPRESSOR',
        },
        {
          id: 'final_full_pdv_func',
          label: 'Full PDV funcionando, quando aplicável',
          sublabel: isPDV ? 'Frente de caixa homologada' : 'Dispensado (máquina de escritório)',
          done: false,
          isConditional: true,
          conditionalType: 'PDV',
        },
        {
          id: 'final_teste_geral_concluido',
          label: 'Teste final realizado',
          sublabel: 'Equipamento testado e liberado para entrega ao usuário/gerência',
          done: false,
        },
      ],
    },
  ];

  return steps;
}

export function isStepApplicable(step: ChecklistStep, machine: MachineIdentification): boolean {
  if (step.applicableFor === 'ALL' || !step.applicableFor) return true;
  if (step.applicableFor === 'PDV') return machine.tipo === 'PDV';
  if (step.applicableFor === 'ESCRITORIO') return machine.tipo === 'ESCRITORIO';
  if (step.applicableFor === 'IMPRESSOR') return machine.utilizaImpressor;
  return true;
}

export function isItemApplicable(item: ChecklistItem, machine: MachineIdentification): boolean {
  if (!item.conditionalType) return true;
  if (item.conditionalType === 'PDV') return machine.tipo === 'PDV';
  if (item.conditionalType === 'ESCRITORIO') return machine.tipo === 'ESCRITORIO';
  if (item.conditionalType === 'IMPRESSOR') return machine.utilizaImpressor;
  return true;
}
