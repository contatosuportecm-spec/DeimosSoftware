/* ═══════════════════════════════════════════════════════════════════════
   quiz-data.js — ÚNICA fonte de conteúdo do quiz.
   Exportado do schema do DeimosSoftware (funnel_nodes.type = "quiz_question").
   Cada step de pergunta espelha QuizQuestionContent de types/funnels.ts:
     { question, question_type: "open"|"button"|"scale", options?: [{id,label}] }
   Telas sem pergunta (statement/loading/email/result) são de apresentação
   do motor — não são "perguntas" e não usam question_type.

   Trocar uma pergunta = editar SÓ este arquivo.
   ═══════════════════════════════════════════════════════════════════════ */

const QUIZ = {
  meta: {
    slug: "truque-do-cafe",
    offer: "Truque do Café",
    ticket: 37,
    currency: "R$",
    promise: "Emagreça 7kg em 20 dias e destrave seu metabolismo — sem dieta restritiva.",
    // Origem no sistema: funnels.id do "Quiz 1"
    source_funnel_id: "026ce1e4-805a-431b-a177-b8cd8cd7606c",
  },

  /* Endereços editáveis — NÃO inventar o destino do lead. Ajuste aqui. */
  config: {
    checkoutUrl: "#checkout",        // troque pela URL real do checkout (R$37)
    leadWebhook: "",                 // opcional: endpoint que recebe o lead_submit
    persistKey: "quiz_truque_cafe_v1",
    socialProofCount: "127.000",     // prova social (ajustável)
  },

  /* ── Perfis de resultado (segmentação ≥3). Chave definida pela "pergunta_balde". ── */
  profiles: {
    metabolismo: {
      key: "metabolismo",
      badge: "Metabolismo Travado",
      title: "Seu corpo está em MODO DE DEFESA",
      diagnosis:
        "Anos de dieta e efeito sanfona ensinaram seu corpo a economizar energia. " +
        "O metabolismo desacelerou, o corpo inflamou e passou a acumular gordura como proteção. " +
        "Não é força de vontade — é biologia travada.",
      why_coffee:
        "O Truque do Café age exatamente aí: acelera o metabolismo de forma constante e " +
        "desinflama o corpo, tirando ele do modo de defesa e colocando em queima permanente.",
      cta: "QUERO DESTRAVAR MEU METABOLISMO",
    },
    compulsao: {
      key: "compulsao",
      badge: "Compulsão & Ansiedade",
      title: "Não é fome. É o seu corpo pedindo socorro",
      diagnosis:
        "A vontade incontrolável de doce, pão e massa não é falta de disciplina. " +
        "É o resultado de picos e quedas de energia que a inflamação e o metabolismo lento provocam. " +
        "Você come para compensar o cansaço — e o ciclo se repete.",
      why_coffee:
        "O Truque do Café estabiliza sua energia logo pela manhã, cortando os gatilhos de compulsão " +
        "antes que eles apareçam. Menos ansiedade alimentar, menos beliscar à toa.",
      cta: "QUERO PARAR DE BRIGAR COM A COMIDA",
    },
    plato: {
      key: "plato",
      badge: "Platô & Inflamação",
      title: "Você faz tudo certo e a balança não move",
      diagnosis:
        "Dieta, academia, sacrifício — e o ponteiro travado. O motivo é a inflamação: " +
        "com o corpo inflamado, as toxinas se acumulam nas células e o metabolismo trava. " +
        "Por isso o esforço não vira resultado.",
      why_coffee:
        "O Truque do Café ataca a causa raiz — desinflama e reativa o metabolismo — " +
        "para que o esforço que você já faz finalmente apareça na balança.",
      cta: "QUERO SAIR DO PLATÔ",
    },
    sanfona: {
      key: "sanfona",
      badge: "Efeito Sanfona",
      title: "Você emagrece — e ganha tudo de volta",
      diagnosis:
        "Você consegue perder peso, mas nunca sustenta. Isso acontece porque dietas e chás " +
        "diminuem o metabolismo: você perde no início e, quando volta ao normal, o corpo " +
        "recupera tudo (e um pouco mais) por defesa.",
      why_coffee:
        "O Truque do Café acelera o metabolismo de forma DEFINITIVA, não temporária. " +
        "É o que quebra o ciclo do efeito sanfona e mantém o peso controlado depois dos 20 dias.",
      cta: "QUERO ACABAR COM A SANFONA",
    },
    recomeco: {
      key: "recomeco",
      badge: "Recomeço",
      title: "O ponto de partida mais simples que existe",
      diagnosis:
        "Você sente que precisa começar, mas não sabe por onde — e a confusão de dietas e regras " +
        "só paralisa. A boa notícia: o começo não precisa ser complicado nem radical.",
      why_coffee:
        "O Truque do Café é um ritual matinal de poucos minutos. É o passo mais simples possível " +
        "para destravar o corpo sem virar sua vida de cabeça para baixo.",
      cta: "QUERO COMEÇAR DO JEITO SIMPLES",
    },
  },

  /* ── Fluxo do quiz (ordem canônica das referências). ──
     kind: "single" | "multi" | "scale" | "open" | "statement" | "loading" | "email" | "result"
     fn:   função persuasiva (qualificar | aquecer | segmentar | quebrar-objecao | capturar | aspiracao)
     required: bloqueia avanço sem resposta (default true p/ perguntas)
     microcopy: linha "por quê" (referências: 5/5 marcas ricas usam)
     branch: { on: { optionId: targetStepId }, default: targetStepId }
     skipInLinear: só é alcançado via branch (não por fall-through)
  */
  steps: [
    /* ═══ ABERTURA ═══ */
    {
      id: "intro",
      act: "Abertura",
      kind: "statement",
      fn: "aquecer",
      question: "Descubra por que seu corpo trava o emagrecimento",
      body:
        "Responda 12 perguntas rápidas (menos de 3 minutos) e receba um diagnóstico " +
        "personalizado do que está travando seu corpo — e o ritual matinal que milhares de " +
        "mulheres estão usando para desinflamar e emagrecer.",
      cta: "COMEÇAR AGORA",
      signature: true, // tela assinatura (destaque visual)
    },

    /* ═══ ACT 1 — DEMOGRAFIA + COMPROMISSO ═══ */
    {
      id: "genero",
      act: "Sobre você",
      kind: "single",
      fn: "segmentar",
      question: "Para começar: você é homem ou mulher?",
      question_type: "button",
      options: [
        { id: "mulher", label: "Mulher" },
        { id: "homem", label: "Homem" },
      ],
    },
    {
      id: "idade",
      act: "Sobre você",
      kind: "single",
      fn: "qualificar",
      question: "Qual é a sua idade?",
      question_type: "button",
      microcopy: "Sua idade muda o metabolismo e os hormônios — usamos isso para calibrar seu diagnóstico.",
      options: [
        { id: "35_45", label: "35 a 45 anos" },
        { id: "45_60", label: "45 a 60 anos" },
        { id: "60_mais", label: "60 anos ou mais" },
        { id: "menos_35", label: "Menos de 35 anos" },
      ],
    },
    {
      id: "silhueta",
      act: "Sobre você",
      kind: "single",
      fn: "qualificar",
      question: "Qual silhueta mais representa seu corpo hoje?",
      question_type: "button",
      options: [
        { id: "oval", label: "Oval — gordura concentrada na barriga" },
        { id: "pera", label: "Pera — gordura no quadril e coxas" },
        { id: "retangular", label: "Retangular — pouca cintura definida" },
        { id: "ampulheta", label: "Ampulheta — cintura fina, quadril largo" },
      ],
    },
    {
      id: "peso_atual",
      act: "Sobre você",
      kind: "open",
      fn: "qualificar",
      question: "Qual é o seu peso atual?",
      question_type: "open",
      microcopy: "Um número aproximado já serve — você pode ajustar depois.",
      input: { type: "number", unit: "kg", min: 40, max: 250, placeholder: "Ex: 78" },
    },
    {
      id: "altura",
      act: "Sobre você",
      kind: "open",
      fn: "qualificar",
      question: "E qual é a sua altura?",
      question_type: "open",
      input: { type: "number", unit: "m", min: 1.3, max: 2.2, step: 0.01, placeholder: "Ex: 1.65" },
    },
    {
      id: "meta_peso",
      act: "Sobre você",
      kind: "open",
      fn: "aspiracao",
      question: "Qual é a sua meta de peso?",
      question_type: "open",
      microcopy: "Não precisa ser exato. É só para projetarmos o seu caminho.",
      input: { type: "number", unit: "kg", min: 40, max: 250, placeholder: "Ex: 68" },
    },

    /* Validação pós-dados (referência: Noom "We're really glad you shared") */
    {
      id: "validacao_1",
      act: "Sobre você",
      kind: "statement",
      fn: "aquecer",
      question: "Obrigada por compartilhar.",
      body:
        "A maioria das pessoas pula essa etapa honesta. O fato de você estar respondendo com " +
        "sinceridade já te coloca à frente da maioria das mulheres que tentam emagrecer no escuro.",
      cta: "CONTINUAR",
    },

    /* ═══ ACT 2 — IDENTIDADE + DOR ═══ */
    {
      id: "resposta_corpo",
      act: "Seu histórico",
      kind: "single",
      fn: "qualificar",
      question: "Como seu corpo costuma responder quando você tenta emagrecer?",
      question_type: "button",
      options: [
        { id: "estaciona", label: "Emagreço rápido no início, depois estaciono" },
        { id: "luta", label: "É uma luta para perder cada quilo" },
        { id: "volta", label: "Perco peso, mas ganho tudo de volta" },
        { id: "nunca", label: "Nunca tentei de verdade" },
      ],
    },
    {
      id: "melhor_forma",
      act: "Seu histórico",
      kind: "single",
      fn: "aquecer",
      // Ancoragem nostálgica — arquétipo BetterMe "best shape of your life"
      question: "Há quanto tempo você esteve na melhor forma da sua vida?",
      question_type: "button",
      options: [
        { id: "menos_1a", label: "Menos de 1 ano atrás" },
        { id: "1_3a", label: "Entre 1 e 3 anos atrás" },
        { id: "mais_3a", label: "Mais de 3 anos atrás" },
        { id: "nunca", label: "Nunca me senti realmente bem" },
      ],
    },
    {
      id: "evento_ganho",
      act: "Seu histórico",
      kind: "single",
      fn: "aquecer",
      // Culpa externa — arquétipo BetterMe: oferece causas socialmente aceitáveis
      question: "O que mais contribuiu para você ganhar peso?",
      question_type: "button",
      options: [
        { id: "hormonal", label: "Mudanças hormonais / idade (pré ou menopausa)" },
        { id: "estresse", label: "Estresse e rotina puxada" },
        { id: "gravidez", label: "Gravidez ou pós-parto" },
        { id: "vida", label: "Mudança de vida ou relacionamento" },
        { id: "gradual", label: "Foi gradual, sem um motivo único" },
      ],
    },
    {
      id: "energia",
      act: "Seu histórico",
      kind: "single",
      fn: "qualificar",
      // Statement em 1ª pessoa
      question: "Como está a sua energia ao longo do dia?",
      question_type: "button",
      options: [
        { id: "acordo_cansada", label: "Acordo cansada e sigo assim o dia todo" },
        { id: "picos", label: "Tenho picos de energia e quedas bruscas" },
        { id: "cai_tarde", label: "É boa de manhã, mas some à tarde" },
        { id: "boa", label: "Tenho bastante energia, no geral" },
      ],
    },
    {
      id: "sono",
      act: "Seu histórico",
      kind: "single",
      fn: "qualificar",
      question: "Como você avalia a qualidade do seu sono?",
      question_type: "button",
      options: [
        { id: "pessimo", label: "Péssima — acordo várias vezes" },
        { id: "demora", label: "Demoro muito para dormir" },
        { id: "nao_descanso", label: "Durmo, mas não me sinto descansada" },
        { id: "boa", label: "Boa na maior parte das noites" },
      ],
    },
    {
      id: "escala_espelho",
      act: "Como você se sente",
      kind: "scale",
      fn: "aquecer",
      question: "O quanto você concorda: “Sinto vergonha e frustração quando me olho no espelho.”",
      question_type: "scale",
      scale: { min: 1, max: 5, minLabel: "Discordo totalmente", maxLabel: "Concordo totalmente" },
    },
    {
      id: "escala_cansaco",
      act: "Como você se sente",
      kind: "scale",
      fn: "aquecer",
      question: "E esta: “O cansaço constante me impede de aproveitar o dia como eu gostaria.”",
      question_type: "scale",
      scale: { min: 1, max: 5, minLabel: "Discordo totalmente", maxLabel: "Concordo totalmente" },
    },

    /* Validação emocional + síndrome (briefing: modo de defesa) + prova social */
    {
      id: "validacao_2",
      act: "Como você se sente",
      kind: "statement",
      fn: "quebrar-objecao",
      question: "Você não está sozinha — e o problema não é você.",
      body:
        "O problema não é que você come demais. Anos de dieta, ansiedade, noites ruins e efeito " +
        "sanfona colocaram seu corpo em MODO DE DEFESA. Nesse modo, ele desacelera o metabolismo, " +
        "retém líquido, inflama e trava o emagrecimento — não importa o quanto você se esforce.",
      proof: "Mais de {socialProofCount} mulheres já passaram por este mesmo diagnóstico.",
      cta: "ENTENDI, CONTINUAR",
    },

    /* ═══ ACT 2b — CRENÇA / MECANISMO (setup do truque) ═══ */
    {
      id: "corpo_travado",
      act: "O que trava seu corpo",
      kind: "multi",
      fn: "segmentar",
      question: "Por que você acha que sente o corpo travado? (pode marcar mais de uma)",
      question_type: "button",
      options: [
        { id: "metabolismo", label: "Metabolismo lento" },
        { id: "hormonios", label: "Hormônios" },
        { id: "inflamacao", label: "Inflamação" },
        { id: "menopausa", label: "Menopausa" },
        { id: "nao_sei", label: "Não sei dizer" },
      ],
    },
    {
      id: "sai_dieta",
      act: "O que trava seu corpo",
      kind: "multi",
      fn: "qualificar",
      question: "O que mais te faz sair da dieta? (pode marcar mais de uma)",
      question_type: "button",
      options: [
        { id: "compulsao", label: "Compulsão alimentar" },
        { id: "ansiedade", label: "Ansiedade / estresse" },
        { id: "trabalho", label: "A correria do trabalho" },
        { id: "privacao", label: "Ter que parar de comer o que eu gosto" },
        { id: "nenhuma", label: "Nenhuma dessas" },
      ],
    },
    {
      id: "ja_tentou_metodos",
      act: "O que trava seu corpo",
      kind: "multi",
      fn: "quebrar-objecao",
      question: "O que você já tentou para emagrecer? (marque tudo que se aplica)",
      question_type: "button",
      microcopy: "Isso importa: quase tudo que você já testou desacelera o metabolismo em vez de acelerar.",
      options: [
        { id: "dietas", label: "Dietas restritivas" },
        { id: "chas", label: "Chás e suplementos" },
        { id: "academia", label: "Academia / exercícios intensos" },
        { id: "remedios", label: "Remédios para emagrecer" },
        { id: "jejum", label: "Jejum intermitente" },
        { id: "nada", label: "Ainda não tentei nada de verdade" },
      ],
    },

    /* Quebra de objeção COM O TRUQUE DO CAFÉ (placeholder do Quiz 1, agora escrito) */
    {
      id: "mecanismo_cafe",
      act: "Por que nada funcionou",
      kind: "statement",
      fn: "quebrar-objecao",
      question: "Por que nada disso funcionou (e o que muda agora)",
      body:
        "Nenhum desses métodos acelera o metabolismo de forma definitiva. Exercícios, dietas e chás " +
        "até fazem perder um pouco — mas depois o corpo volta ao normal e continua acumulando toxinas. " +
        "O Truque do Café é diferente: ele acelera o metabolismo de forma constante e desinflama o corpo, " +
        "colocando você em modo de queima permanente. É por isso que funciona quando o resto falhou.",
      signature: true,
      cta: "FAZ SENTIDO, CONTINUAR",
    },

    /* ═══ ACT 3 — APROFUNDAMENTO + ASPIRAÇÃO ═══ */
    {
      id: "pergunta_balde",
      act: "Seu momento",
      kind: "single",
      fn: "segmentar",
      // PERGUNTA-CHAVE de segmentação → define o perfil de resultado
      question: "Hoje, qual dessas situações MAIS parece com você?",
      question_type: "button",
      options: [
        { id: "metabolismo", label: "Sinto meu corpo travado (metabolismo lento)" },
        { id: "compulsao", label: "Eu como demais — principalmente doce e pão" },
        { id: "plato", label: "Faço de tudo e mesmo assim não emagreço" },
        { id: "sanfona", label: "Até emagreço, mas ganho tudo de volta" },
        { id: "recomeco", label: "Não sei nem por onde começar" },
      ],
    },
    {
      id: "incomoda",
      act: "Seu momento",
      kind: "single",
      fn: "aquecer",
      question: "Qual dessas coisas mais te incomoda hoje?",
      question_type: "button",
      options: [
        { id: "roupas", label: "Não entrar nas minhas roupas" },
        { id: "espelho", label: "Não me reconhecer no espelho" },
        { id: "fracasso", label: "O medo de fracassar de novo" },
        { id: "controle", label: "Não ter controle do meu próprio corpo" },
      ],
    },
    {
      id: "motivo_agora",
      act: "Seu momento",
      kind: "single",
      fn: "aspiracao",
      question: "Qual o motivo MAIS FORTE para você querer emagrecer agora?",
      question_type: "button",
      options: [
        { id: "saude", label: "Minha saúde está em risco" },
        { id: "autoestima", label: "Não me sinto mais atraente" },
        { id: "energia", label: "Quero ter disposição para a vida" },
        { id: "cansada", label: "Estou cansada de me sentir assim" },
      ],
    },
    {
      id: "evento_data",
      act: "Seu momento",
      kind: "single",
      fn: "aspiracao",
      question: "Você tem alguma data especial em mente para estar bem?",
      question_type: "button",
      options: [
        { id: "sim_breve", label: "Sim, e está chegando!" },
        { id: "sim_sem_pressa", label: "Sim, mas sem pressa" },
        { id: "por_mim", label: "Não — é por mim mesma" },
      ],
    },

    /* Ramificação real: já tentou antes? → dois caminhos que reconvergem no email gate */
    {
      id: "ja_tentou",
      act: "Seu momento",
      kind: "single",
      fn: "qualificar",
      question: "Você já tentou emagrecer seriamente antes?",
      question_type: "button",
      options: [
        { id: "sim", label: "Sim, já tentei" },
        { id: "nao", label: "Não, nunca tentei de verdade" },
      ],
      branch: { on: { sim: "tempo_tentando", nao: "porque_nunca" }, default: "tempo_tentando" },
    },
    {
      id: "tempo_tentando",
      act: "Seu momento",
      kind: "single",
      fn: "qualificar",
      skipInLinear: true,
      question: "Há quanto tempo você tenta sem o resultado que gostaria?",
      question_type: "button",
      options: [
        { id: "comecando", label: "Estou começando agora" },
        { id: "1_3a", label: "Entre 1 e 3 anos" },
        { id: "mais_3a", label: "Há mais de 3 anos" },
        { id: "vida_toda", label: "Praticamente a vida inteira" },
      ],
      next: "email_gate",
    },
    {
      id: "porque_nunca",
      act: "Seu momento",
      kind: "single",
      fn: "qualificar",
      skipInLinear: true,
      question: "O que mais te impediu de tentar até agora?",
      question_type: "button",
      options: [
        { id: "gosto_comer", label: "Eu gosto de comer" },
        { id: "dificil", label: "Acho difícil demais" },
        { id: "tempo", label: "Falta de tempo" },
        { id: "nao_sei", label: "Não sabia por onde começar" },
      ],
      next: "email_gate",
    },

    /* ═══ EMAIL GATE (~meio-fim do funil, após dor+aspiração) ═══ */
    {
      id: "email_gate",
      act: "Quase lá",
      kind: "email",
      fn: "capturar",
      question: "Para onde enviamos o seu diagnóstico personalizado?",
      body:
        "Vamos preparar o seu resultado e o passo a passo do Ritual Matinal do Truque do Café. " +
        "Deixe seu melhor e-mail para receber junto com a análise.",
      input: { type: "email", placeholder: "seu@email.com" },
      optIn: "Quero receber dicas e ofertas exclusivas por e-mail.",
      cta: "VER MEU DIAGNÓSTICO",
    },

    /* ═══ LOADING — processing theater (placeholders do Quiz 1, finalizados) ═══ */
    {
      id: "loading",
      act: "Analisando",
      kind: "loading",
      fn: "aquecer",
      question: "Analisando suas respostas…",
      frames: [
        "Cruzando seu perfil com o de milhares de mulheres…",
        "Identificando o que está travando seu metabolismo…",
        "Calculando seu nível de inflamação…",
        "Montando seu Ritual Matinal do Truque do Café…",
        "Quase pronto…",
      ],
      durationMs: 4200, // por frame
    },

    /* ═══ ACT 4 — RESULTADO SEGMENTADO + OFERTA ═══ */
    {
      id: "result",
      act: "Seu resultado",
      kind: "result",
      fn: "aspiracao",
      question: "Seu diagnóstico está pronto",
      // Copy é composta em result.js a partir do perfil + respostas.
      offer: {
        name: "Truque do Café",
        price: 37,
        priceLabel: "R$ 37",
        anchor: "R$ 197",
        guarantee: "Garantia incondicional de 7 dias — ou seu dinheiro de volta.",
        bullets: [
          "O ritual matinal completo do Truque do Café, passo a passo",
          "O protocolo para desinflamar e destravar o metabolismo",
          "Cardápio de apoio e a rotina dos primeiros 20 dias",
        ],
      },
    },
  ],
};

/* Exposição global (sem build step / sem módulos ES para abrir via file://) */
window.QUIZ = QUIZ;
