/* ═══════════════════════════════════════════════════════════════════════
   quiz-data.js — ÚNICA fonte de conteúdo do quiz.
   Nenhuma string de pergunta mora em HTML/CSS/render: tudo aqui.

   Schema de um step:
   • id            identificador único (usado em answers/tracking)
   • kind          "single" | "multi" | "scale" | "open" | "email" |
                   "statement" | "loading" | "result"
   • chapter       id de `chapters` — só perguntas têm; statements não
                   consomem progresso (a barra some, entra o logo)
   • question      título; **trecho** vira o destaque da headline
   • microcopy     linha de apoio abaixo do título
   • options       [{ id, label, icon?, body?, image? }]
                   icon → ASSETS.icons · body → ASSETS.body (silhuetas)
                   image → "img/foto.png" (foto substitui o ícone)
   • branch        { on: { resposta: proximoStepId }, default }
   • next          próximo step explícito (para alvos de branch)
   • skipInLinear  step que SÓ é alcançado via branch/next
   • fn / question_type — metadados do schema DeimosSoftware (não usados
                   pelo render; mantidos para importação na plataforma)
   ═══════════════════════════════════════════════════════════════════════ */

QuizApp.define("data", function () {
  "use strict";

  return {
    meta: {
      slug: "truque-do-cafe",
      offer: "Truque do Café",
      tagline: "O seu momento. Sua melhor versão.",
      ticket: 37,
      source_funnel_id: "026ce1e4-805a-431b-a177-b8cd8cd7606c",
    },

    config: {
      checkoutUrl: "#checkout",      // ► troque pela URL real do checkout (R$37)
      leadWebhook: "",               // ► opcional: endpoint que recebe lead_submit
      persistKey: "quiz_truque_cafe_v3",
      socialProofCount: "127 mil",
      autoAdvanceMs: 260,            // delay do auto-avanço (usuário vê a seleção)
      debug: false,
    },

    /* Capítulos do progresso segmentado (rótulo nomeado acima da barra) */
    chapters: [
      { id: "voce",      label: "Sobre você" },
      { id: "historico", label: "Seu histórico" },
      { id: "trava",     label: "O que trava" },
      { id: "momento",   label: "Seu momento" },
      { id: "quase",     label: "Quase lá" },
    ],

    /* Strings de interface e validação (fora do render por contrato) */
    ui: {
      back: "Voltar",
      continueLabel: "CONTINUAR",
      progressLabel: "Progresso do quiz",
      errors: {
        selectOne: "Selecione uma opção para continuar.",
        selectAtLeastOne: "Selecione ao menos uma opção.",
        scale: "Escolha um ponto na escala.",
        required: "Preencha o campo para continuar.",
        invalidNumber: "Digite um número válido.",
        numberMin: "Valor mínimo: {min} {unit}.",
        numberMax: "Valor máximo: {max} {unit}.",
        invalidEmail: "Digite um e-mail válido.",
      },
    },

    profiles: {
      metabolismo: { key: "metabolismo", badge: "Metabolismo travado",
        title: "Seu corpo está em **modo de defesa**",
        diagnosis: "Anos de dieta e efeito sanfona ensinaram seu corpo a economizar energia: o metabolismo desacelerou, o corpo inflamou e passou a acumular gordura como proteção. Não é falta de força de vontade — é biologia travada.",
        why_coffee: "O Truque do Café age exatamente aí: acelera o metabolismo de forma constante e desinflama o corpo, tirando ele do modo de defesa e colocando em queima permanente.",
        cta: "QUERO DESTRAVAR MEU METABOLISMO" },
      compulsao: { key: "compulsao", badge: "Compulsão & ansiedade",
        title: "Não é fome. É o seu corpo **pedindo socorro**",
        diagnosis: "A vontade incontrolável de doce, pão e massa não é indisciplina — é o resultado dos picos e quedas de energia que a inflamação e o metabolismo lento provocam. Você come para compensar o cansaço, e o ciclo se repete.",
        why_coffee: "O Truque do Café estabiliza sua energia logo pela manhã, cortando os gatilhos de compulsão antes que apareçam. Menos ansiedade, menos beliscar à toa.",
        cta: "QUERO PARAR DE BRIGAR COM A COMIDA" },
      plato: { key: "plato", badge: "Platô & inflamação",
        title: "Você faz tudo certo e a balança **não move**",
        diagnosis: "Dieta, exercício, sacrifício — e o ponteiro travado. O motivo é a inflamação: com o corpo inflamado, as toxinas se acumulam nas células e o metabolismo trava. Por isso o esforço não vira resultado.",
        why_coffee: "O Truque do Café ataca a causa raiz — desinflama e reativa o metabolismo — para que o esforço que você já faz finalmente apareça na balança.",
        cta: "QUERO SAIR DO PLATÔ" },
      sanfona: { key: "sanfona", badge: "Efeito sanfona",
        title: "Você emagrece — e **ganha tudo de volta**",
        diagnosis: "Você perde peso, mas nunca sustenta. Dietas e chás diminuem o metabolismo: você perde no início e, ao voltar ao normal, o corpo recupera tudo (e um pouco mais) por defesa.",
        why_coffee: "O Truque do Café acelera o metabolismo de forma definitiva, não temporária. É o que quebra o ciclo da sanfona e mantém o peso controlado depois dos 20 dias.",
        cta: "QUERO ACABAR COM A SANFONA" },
      recomeco: { key: "recomeco", badge: "Recomeço",
        title: "O ponto de partida mais **simples** que existe",
        diagnosis: "Você sente que precisa começar, mas não sabe por onde — e a confusão de dietas e regras só paralisa. O começo não precisa ser complicado nem radical.",
        why_coffee: "O Truque do Café é um ritual matinal de poucos minutos: o passo mais simples possível para destravar o corpo sem virar sua vida de cabeça para baixo.",
        cta: "QUERO COMEÇAR DO JEITO SIMPLES" },
    },

    steps: [
      /* ═══ ABERTURA ═══ */
      { id: "intro", kind: "statement", fn: "aquecer", hero: "cup",
        question: "Descubra o seu **Truque do Café** ideal",
        body: "Um ritual de cuidado que transforma de dentro para fora. Responda 12 perguntas rápidas e receba seu diagnóstico personalizado.",
        benefits: [
          "Seu diagnóstico de por que o corpo trava o emagrecimento",
          "O ritual matinal para desinflamar e acelerar o metabolismo",
          "Um plano simples, feito para a sua rotina",
        ],
        estimatedTime: "menos de 3 minutos",
        cta: "COMEÇAR" },

      /* ═══ CAPÍTULO 1 — SOBRE VOCÊ ═══ */
      { id: "genero", chapter: "voce", kind: "single", fn: "segmentar",
        question: "Para começar: você é mulher ou homem?", question_type: "button",
        options: [
          { id: "mulher", label: "Mulher", icon: "person" },
          { id: "homem", label: "Homem", icon: "person" },
        ] },
      { id: "idade", chapter: "voce", kind: "single", fn: "qualificar",
        question: "Qual é a sua idade?", question_type: "button",
        microcopy: "Sua idade muda o metabolismo e os hormônios — usamos isso para calibrar seu diagnóstico.",
        options: [
          { id: "35_45", label: "35 a 45 anos" }, { id: "45_60", label: "45 a 60 anos" },
          { id: "60_mais", label: "60 anos ou mais" }, { id: "menos_35", label: "Menos de 35 anos" },
        ] },
      { id: "silhueta", chapter: "voce", kind: "single", fn: "qualificar",
        question: "Qual silhueta mais parece com você hoje?", question_type: "button",
        options: [
          { id: "oval", label: "Barriga (oval)", body: "oval" },
          { id: "pera", label: "Quadril/coxas (pera)", body: "pera" },
          { id: "retangular", label: "Sem cintura (reto)", body: "reto" },
          { id: "ampulheta", label: "Cintura fina (ampulheta)", body: "ampulheta" },
        ] },
      { id: "peso_atual", chapter: "voce", kind: "open", fn: "qualificar",
        question: "Qual é o seu peso atual?", question_type: "open",
        microcopy: "Um número aproximado já serve — você pode ajustar depois.",
        input: { type: "number", unit: "kg", min: 40, max: 250, placeholder: "Ex: 78" } },
      { id: "altura", chapter: "voce", kind: "open", fn: "qualificar",
        question: "E qual é a sua altura?", question_type: "open",
        input: { type: "number", unit: "m", min: 1.3, max: 2.2, placeholder: "Ex: 1,65" } },
      { id: "meta_peso", chapter: "voce", kind: "open", fn: "aspiracao",
        question: "Qual é a sua meta de peso?", question_type: "open",
        microcopy: "Não precisa ser exato. É só para projetarmos o seu caminho.",
        input: { type: "number", unit: "kg", min: 40, max: 250, placeholder: "Ex: 68" } },

      { id: "validacao_1", kind: "statement", fn: "aquecer",
        question: "Obrigada por compartilhar 💛",
        body: "A maioria pula essa etapa honesta. Responder com sinceridade já te coloca à frente da maioria das mulheres que tentam emagrecer no escuro.",
        cta: "CONTINUAR" },

      /* ═══ CAPÍTULO 2 — SEU HISTÓRICO / DOR ═══ */
      { id: "resposta_corpo", chapter: "historico", kind: "single", fn: "qualificar",
        question: "Como seu corpo responde quando você tenta emagrecer?", question_type: "button",
        options: [
          { id: "estaciona", label: "Emagreço rápido no início, depois estaciono" },
          { id: "luta", label: "É uma luta para perder cada quilo" },
          { id: "volta", label: "Perco peso, mas ganho tudo de volta" },
          { id: "nunca", label: "Nunca tentei de verdade" },
        ] },
      { id: "melhor_forma", chapter: "historico", kind: "single", fn: "aquecer",
        question: "Há quanto tempo você esteve na melhor forma da sua vida?", question_type: "button",
        options: [
          { id: "menos_1a", label: "Menos de 1 ano atrás" }, { id: "1_3a", label: "Entre 1 e 3 anos atrás" },
          { id: "mais_3a", label: "Mais de 3 anos atrás" }, { id: "nunca", label: "Nunca me senti realmente bem" },
        ] },
      { id: "evento_ganho", chapter: "historico", kind: "single", fn: "aquecer",
        question: "O que mais contribuiu para você ganhar peso?", question_type: "button",
        options: [
          { id: "hormonal", label: "Mudanças hormonais / idade (pré ou menopausa)" },
          { id: "estresse", label: "Estresse e rotina puxada" },
          { id: "gravidez", label: "Gravidez ou pós-parto" },
          { id: "vida", label: "Mudança de vida ou relacionamento" },
          { id: "gradual", label: "Foi gradual, sem um motivo único" },
        ] },
      { id: "energia", chapter: "historico", kind: "single", fn: "qualificar",
        question: "Como está a sua energia ao longo do dia?", question_type: "button",
        options: [
          { id: "acordo_cansada", label: "Acordo cansada e sigo assim o dia todo" },
          { id: "picos", label: "Tenho picos de energia e quedas bruscas" },
          { id: "cai_tarde", label: "É boa de manhã, mas some à tarde" },
          { id: "boa", label: "Tenho bastante energia, no geral" },
        ] },
      { id: "sono", chapter: "historico", kind: "single", fn: "qualificar",
        question: "Como você avalia a qualidade do seu sono?", question_type: "button",
        options: [
          { id: "pessimo", label: "Péssima — acordo várias vezes" }, { id: "demora", label: "Demoro muito para dormir" },
          { id: "nao_descanso", label: "Durmo, mas não descanso" }, { id: "boa", label: "Boa na maioria das noites" },
        ] },
      { id: "escala_espelho", chapter: "historico", kind: "scale", fn: "aquecer",
        question: "O quanto você concorda: “Sinto vergonha quando me olho no espelho.”", question_type: "scale",
        scale: { min: 1, max: 5, minLabel: "Discordo", maxLabel: "Concordo" } },
      { id: "escala_cansaco", chapter: "historico", kind: "scale", fn: "aquecer",
        question: "E esta: “O cansaço me impede de aproveitar o dia como eu queria.”", question_type: "scale",
        scale: { min: 1, max: 5, minLabel: "Discordo", maxLabel: "Concordo" } },

      { id: "validacao_2", kind: "statement", fn: "quebrar-objecao",
        question: "Você **não está sozinha** — e o problema não é você",
        body: "Anos de dieta, ansiedade, noites ruins e efeito sanfona colocaram seu corpo em modo de defesa. Nesse modo ele desacelera o metabolismo, retém líquido, inflama e trava o emagrecimento — não importa o quanto você se esforce.",
        reassure: "Mais de {socialProofCount} mulheres já passaram por este mesmo diagnóstico.",
        cta: "CONTINUAR" },

      /* ═══ CAPÍTULO 3 — O QUE TRAVA (mecanismo) ═══ */
      { id: "corpo_travado", chapter: "trava", kind: "multi", fn: "segmentar",
        question: "Por que você acha que sente o corpo travado?", question_type: "button",
        microcopy: "Pode marcar mais de uma.",
        options: [
          { id: "metabolismo", label: "Metabolismo lento", icon: "flame" },
          { id: "hormonios", label: "Hormônios", icon: "droplet" },
          { id: "inflamacao", label: "Inflamação", icon: "leaf" },
          { id: "menopausa", label: "Menopausa", icon: "moon" },
        ] },
      { id: "sai_dieta", chapter: "trava", kind: "multi", fn: "qualificar",
        question: "O que mais te faz sair da dieta?", question_type: "button",
        microcopy: "Pode marcar mais de uma.",
        options: [
          { id: "compulsao", label: "Compulsão alimentar" }, { id: "ansiedade", label: "Ansiedade / estresse" },
          { id: "trabalho", label: "A correria do trabalho" }, { id: "privacao", label: "Parar de comer o que gosto" },
          { id: "nenhuma", label: "Nenhuma dessas" },
        ] },
      { id: "ja_tentou_metodos", chapter: "trava", kind: "multi", fn: "quebrar-objecao",
        question: "O que você já tentou para emagrecer?", question_type: "button",
        microcopy: "Quase tudo que você já testou desacelera o metabolismo em vez de acelerar.",
        options: [
          { id: "dietas", label: "Dietas restritivas" }, { id: "chas", label: "Chás e suplementos" },
          { id: "academia", label: "Academia / exercícios" }, { id: "remedios", label: "Remédios para emagrecer" },
          { id: "jejum", label: "Jejum intermitente" }, { id: "nada", label: "Ainda não tentei nada" },
        ] },

      { id: "mecanismo_cafe", kind: "statement", fn: "quebrar-objecao", hero: "cup",
        question: "Por que **nada disso funcionou** (e o que muda agora)",
        body: "Nenhum desses métodos acelera o metabolismo de forma definitiva — muitos até o desaceleram. O Truque do Café é diferente: acelera o metabolismo de forma constante e desinflama o corpo, colocando você em modo de queima permanente. É por isso que funciona quando o resto falhou.",
        cta: "FAZ SENTIDO, CONTINUAR" },

      /* ═══ CAPÍTULO 4 — SEU MOMENTO / ASPIRAÇÃO ═══ */
      { id: "pergunta_balde", chapter: "momento", kind: "single", fn: "segmentar",
        question: "Qual dessas situações **mais parece com você**?", question_type: "button",
        options: [
          { id: "metabolismo", label: "Sinto o corpo travado", icon: "flame" },
          { id: "compulsao", label: "Como demais (doce e pão)", icon: "cupcake" },
          { id: "plato", label: "Faço tudo e não emagreço", icon: "scale" },
          { id: "sanfona", label: "Emagreço e ganho de volta", icon: "repeat" },
          { id: "recomeco", label: "Não sei por onde começar", icon: "question" },
        ] },
      { id: "incomoda", chapter: "momento", kind: "single", fn: "aquecer",
        question: "O que mais te incomoda hoje?", question_type: "button",
        options: [
          { id: "roupas", label: "Não entrar nas minhas roupas", icon: "ruler" },
          { id: "espelho", label: "Não me reconhecer no espelho", icon: "mirror" },
          { id: "fracasso", label: "Medo de fracassar de novo", icon: "shield" },
          { id: "controle", label: "Não ter controle do corpo", icon: "person" },
        ] },
      { id: "motivo_agora", chapter: "momento", kind: "single", fn: "aspiracao",
        question: "Qual o motivo **mais forte** para emagrecer agora?", question_type: "button",
        options: [
          { id: "saude", label: "Minha saúde", icon: "shield" },
          { id: "autoestima", label: "Minha autoestima", icon: "heart" },
          { id: "energia", label: "Ter mais disposição", icon: "bolt" },
          { id: "cansada", label: "Cansei de me sentir assim", icon: "star" },
        ] },
      { id: "evento_data", chapter: "momento", kind: "single", fn: "aspiracao",
        question: "Você tem alguma data especial em mente?", question_type: "button",
        options: [
          { id: "sim_breve", label: "Sim, e está chegando!" }, { id: "sim_sem_pressa", label: "Sim, mas sem pressa" },
          { id: "por_mim", label: "Não — é por mim mesma" },
        ] },

      { id: "ja_tentou", chapter: "momento", kind: "single", fn: "qualificar",
        question: "Você já tentou emagrecer seriamente antes?", question_type: "button",
        options: [ { id: "sim", label: "Sim, já tentei", icon: "repeat" }, { id: "nao", label: "Não, nunca de verdade", icon: "star" } ],
        branch: { on: { sim: "tempo_tentando", nao: "porque_nunca" }, default: "tempo_tentando" } },
      { id: "tempo_tentando", chapter: "momento", kind: "single", fn: "qualificar", skipInLinear: true,
        question: "Há quanto tempo você tenta sem o resultado que queria?", question_type: "button",
        options: [
          { id: "comecando", label: "Estou começando agora" }, { id: "1_3a", label: "Entre 1 e 3 anos" },
          { id: "mais_3a", label: "Há mais de 3 anos" }, { id: "vida_toda", label: "Praticamente a vida inteira" },
        ], next: "email_gate" },
      { id: "porque_nunca", chapter: "momento", kind: "single", fn: "qualificar", skipInLinear: true,
        question: "O que mais te impediu de tentar até agora?", question_type: "button",
        options: [
          { id: "gosto_comer", label: "Eu gosto de comer" }, { id: "dificil", label: "Acho difícil demais" },
          { id: "tempo", label: "Falta de tempo" }, { id: "nao_sei", label: "Não sabia por onde começar" },
        ], next: "email_gate" },

      /* ═══ CAPÍTULO 5 — EMAIL GATE ═══ */
      { id: "email_gate", chapter: "quase", kind: "email", fn: "capturar",
        question: "Para onde enviamos o seu **diagnóstico**?",
        body: "Vamos preparar seu resultado e o passo a passo do Ritual Matinal do Truque do Café. Deixe seu melhor e-mail.",
        input: { type: "email", placeholder: "seu@email.com" },
        optIn: "Quero receber dicas e ofertas exclusivas por e-mail.",
        cta: "VER MEU DIAGNÓSTICO" },

      /* ═══ LOADING TEATRAL ═══ */
      { id: "loading", kind: "loading", fn: "aquecer",
        question: "Montando seu plano **personalizado**…",
        frames: [
          "Cruzando seu perfil com o de milhares de mulheres…",
          "Identificando o que trava seu metabolismo…",
          "Calculando seu nível de inflamação…",
          "Montando seu Ritual Matinal do Truque do Café…",
          "Quase pronto…",
        ],
        foot: "Estamos preparando o seu plano com muito cuidado. Já já você terá acesso!",
        durationMs: 6500 },

      /* ═══ RESULTADO ═══ */
      { id: "result", kind: "result", fn: "aspiracao",
        question: "Seu diagnóstico está pronto",
        /* Diagnóstico devolve as respostas da usuária como "achados" */
        findings: [
          { source: "pergunta_balde", label: "Seu maior desafio" },
          { source: "energia", label: "Sua energia" },
          { source: "sono", label: "Seu sono" },
        ],
        copy: {
          findingsTitle: "O que suas respostas mostram",
          projectionLead: "Com base no seu peso atual e na sua meta:",
          projectionFoot: "de {atual} kg para {meta} kg com o Ritual Matinal",
          mechanismLabel: "Por que o Truque do Café resolve",
          unitKg: "kg", unitDays: "dias",
          restart: "Refazer o quiz",
        },
        offer: { name: "Truque do Café", price: 37, priceLabel: "R$ 37", anchor: "R$ 197",
          guarantee: "Garantia incondicional de 7 dias — ou seu dinheiro de volta.",
          bullets: [
            "O ritual matinal completo do Truque do Café, passo a passo",
            "O protocolo para desinflamar e destravar o metabolismo",
            "Cardápio de apoio e a rotina dos primeiros 20 dias",
          ] } },
    ],
  };
});
