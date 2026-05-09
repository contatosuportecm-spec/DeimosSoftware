-- Migration 010 — Reset completo de spy_keywords com listas curadas pelo usuário (2026-05-09).
-- Estratégia:
--   1. Wipe de todas as keywords antigas.
--   2. Insere por ordem de especificidade (nichos específicos PRIMEIRO, geral por último)
--      para que keywords compartilhadas (ex: "ritual matinal", "método") fiquem no nicho
--      mais específico via ON CONFLICT DO NOTHING (idx_spy_keywords_unique em LOWER(keyword)).
--
-- Mapeamento de nichos:
--   Emagrecimento  → niche_id='emagrecimento'
--   ED             → niche_id='saude-masculina'
--   Diabetes       → niche_id='diabetes'
--   Low ticket     → niche_id='low_ticket'
--   Geral          → niche_id=NULL  (agrupador "Gerais" da UI — ver useNicheKeywords.ts)

-- ══════════════════════════════════════════
-- 1. Wipe completo
-- ══════════════════════════════════════════
DELETE FROM spy_keywords;

-- ══════════════════════════════════════════
-- 2. EMAGRECIMENTO  (23 termos)
-- ══════════════════════════════════════════
INSERT INTO spy_keywords (keyword, category, language, niche_id) VALUES
  ('gordura',                'emagrecimento', 'pt', 'emagrecimento'),
  ('peso',                   'emagrecimento', 'pt', 'emagrecimento'),
  ('receitinha',             'emagrecimento', 'pt', 'emagrecimento'),
  ('especialista revela',    'emagrecimento', 'pt', 'emagrecimento'),
  ('truque caseiro',         'emagrecimento', 'pt', 'emagrecimento'),
  ('receita simples',        'emagrecimento', 'pt', 'emagrecimento'),
  ('ritual matinal',         'emagrecimento', 'pt', 'emagrecimento'),
  ('ritual noturno',         'emagrecimento', 'pt', 'emagrecimento'),
  ('bebida caseira',         'emagrecimento', 'pt', 'emagrecimento'),
  ('metabolismo',            'emagrecimento', 'pt', 'emagrecimento'),
  ('acelerar o metabolismo', 'emagrecimento', 'pt', 'emagrecimento'),
  ('derreter',               'emagrecimento', 'pt', 'emagrecimento'),
  ('secar',                  'emagrecimento', 'pt', 'emagrecimento'),
  ('gordura localizada',     'emagrecimento', 'pt', 'emagrecimento'),
  ('banha',                  'emagrecimento', 'pt', 'emagrecimento'),
  ('gordurinha',             'emagrecimento', 'pt', 'emagrecimento'),
  ('truque matinal',         'emagrecimento', 'pt', 'emagrecimento'),
  ('queimar gordura',        'emagrecimento', 'pt', 'emagrecimento'),
  ('segredinho',             'emagrecimento', 'pt', 'emagrecimento'),
  ('misturinha',             'emagrecimento', 'pt', 'emagrecimento'),
  ('dieta',                  'emagrecimento', 'pt', 'emagrecimento'),
  ('semente bariátrica',     'emagrecimento', 'pt', 'emagrecimento'),
  ('mounjaro',               'emagrecimento', 'pt', 'emagrecimento')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════
-- 3. ED / SAÚDE MASCULINA  (8 termos)
-- ══════════════════════════════════════════
INSERT INTO spy_keywords (keyword, category, language, niche_id) VALUES
  ('viagra',           'ed', 'pt', 'saude-masculina'),
  ('azulzinho',        'ed', 'pt', 'saude-masculina'),
  ('marido',           'ed', 'pt', 'saude-masculina'),
  ('na cama',          'ed', 'pt', 'saude-masculina'),
  ('tentou de tudo',   'ed', 'pt', 'saude-masculina'),
  ('durar mais',       'ed', 'pt', 'saude-masculina'),
  ('duro como pedra',  'ed', 'pt', 'saude-masculina'),
  ('ferramenta marido','ed', 'pt', 'saude-masculina')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════
-- 4. DIABETES  (5 termos)
-- ══════════════════════════════════════════
INSERT INTO spy_keywords (keyword, category, language, niche_id) VALUES
  ('açúcar no sangue', 'diabetes', 'pt', 'diabetes'),
  ('glicose',          'diabetes', 'pt', 'diabetes'),
  ('canetinha',        'diabetes', 'pt', 'diabetes'),
  ('diabetes',         'diabetes', 'pt', 'diabetes'),
  ('insulina',         'diabetes', 'pt', 'diabetes')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════
-- 5. LOW TICKET  (~40 termos · gatilhos de preço/persuasão)
-- ══════════════════════════════════════════
INSERT INTO spy_keywords (keyword, category, language, niche_id) VALUES
  ('responda',          'low_ticket', 'pt', 'low_ticket'),
  ('diagnóstico',       'low_ticket', 'pt', 'low_ticket'),
  ('fórmula',           'low_ticket', 'pt', 'low_ticket'),
  ('método',            'low_ticket', 'pt', 'low_ticket'),
  ('segredo',           'low_ticket', 'pt', 'low_ticket'),
  ('análise',           'low_ticket', 'pt', 'low_ticket'),
  ('desafio',           'low_ticket', 'pt', 'low_ticket'),
  ('funciona',          'low_ticket', 'pt', 'low_ticket'),
  ('dinamicas apenas',  'low_ticket', 'pt', 'low_ticket'),
  ('comprovado',        'low_ticket', 'pt', 'low_ticket'),
  ('pdf apenas',        'low_ticket', 'pt', 'low_ticket'),
  ('definitivo',        'low_ticket', 'pt', 'low_ticket'),
  ('natural',           'low_ticket', 'pt', 'low_ticket'),
  ('teste gratuito',    'low_ticket', 'pt', 'low_ticket'),
  ('guia prático',      'low_ticket', 'pt', 'low_ticket'),
  ('guia completo',     'low_ticket', 'pt', 'low_ticket'),
  ('nova forma',        'low_ticket', 'pt', 'low_ticket'),
  ('nova técnica',      'low_ticket', 'pt', 'low_ticket'),
  ('7 dias',            'low_ticket', 'pt', 'low_ticket'),
  ('15 dias',           'low_ticket', 'pt', 'low_ticket'),
  ('21 dias',           'low_ticket', 'pt', 'low_ticket'),
  ('30 dias',           'low_ticket', 'pt', 'low_ticket'),
  ('60 dias',           'low_ticket', 'pt', 'low_ticket'),
  ('ebook',             'low_ticket', 'pt', 'low_ticket'),
  ('curso online',      'low_ticket', 'pt', 'low_ticket'),
  ('treinamento',       'low_ticket', 'pt', 'low_ticket'),
  ('mentor',            'low_ticket', 'pt', 'low_ticket'),
  ('especialista',      'low_ticket', 'pt', 'low_ticket'),
  ('fórmula milagrosa', 'low_ticket', 'pt', 'low_ticket'),
  ('passo a passo',     'low_ticket', 'pt', 'low_ticket'),
  ('passo simples',     'low_ticket', 'pt', 'low_ticket'),
  ('acesso imediato',   'low_ticket', 'pt', 'low_ticket'),
  ('19,90',             'low_ticket', 'pt', 'low_ticket'),
  ('29,90',             'low_ticket', 'pt', 'low_ticket'),
  ('9,90',              'low_ticket', 'pt', 'low_ticket'),
  ('47,90',             'low_ticket', 'pt', 'low_ticket'),
  ('49,90',             'low_ticket', 'pt', 'low_ticket'),
  ('59,90',             'low_ticket', 'pt', 'low_ticket'),
  ('97,00',             'low_ticket', 'pt', 'low_ticket'),
  ('99,90',             'low_ticket', 'pt', 'low_ticket')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════
-- 6. GERAL  (~94 termos · niche_id NULL = agrupador "Gerais")
-- Keywords sobrepostas com nichos específicos cairão automaticamente
-- via ON CONFLICT (já inseridas acima).
-- ══════════════════════════════════════════
INSERT INTO spy_keywords (keyword, category, language, niche_id) VALUES
  ('truque',                            'geral', 'pt', NULL),
  ('método',                            'geral', 'pt', NULL),
  ('caseiro',                           'geral', 'pt', NULL),
  ('truquezinho',                       'geral', 'pt', NULL),
  ('natural',                           'geral', 'pt', NULL),
  ('sujo',                              'geral', 'pt', NULL),
  ('secreto',                           'geral', 'pt', NULL),
  ('segredo',                           'geral', 'pt', NULL),
  ('ritual',                            'geral', 'pt', NULL),
  ('matinal',                           'geral', 'pt', NULL),
  ('verdadeira causa',                  'geral', 'pt', NULL),
  ('causa raiz',                        'geral', 'pt', NULL),
  ('simples',                           'geral', 'pt', NULL),
  ('receita',                           'geral', 'pt', NULL),
  ('truque caseiro',                    'geral', 'pt', NULL),
  ('truque simples',                    'geral', 'pt', NULL),
  ('truque natural',                    'geral', 'pt', NULL),
  ('truque secreto',                    'geral', 'pt', NULL),
  ('método natural',                    'geral', 'pt', NULL),
  ('método caseiro',                    'geral', 'pt', NULL),
  ('método simples',                    'geral', 'pt', NULL),
  ('método desconhecido',               'geral', 'pt', NULL),
  ('método revolucionário',             'geral', 'pt', NULL),
  ('ritual matinal',                    'geral', 'pt', NULL),
  ('ritual noturno',                    'geral', 'pt', NULL),
  ('ritual de 10 segundos',             'geral', 'pt', NULL),
  ('ritual de 15 segundos',             'geral', 'pt', NULL),
  ('hábito simples',                    'geral', 'pt', NULL),
  ('hábito escondido',                  'geral', 'pt', NULL),
  ('protocolo',                         'geral', 'pt', NULL),
  ('protocolo natural',                 'geral', 'pt', NULL),
  ('protocolo caseiro',                 'geral', 'pt', NULL),
  ('protocolo matinal',                 'geral', 'pt', NULL),
  ('método secreto',                    'geral', 'pt', NULL),
  ('segredo caseiro',                   'geral', 'pt', NULL),
  ('segredo natural',                   'geral', 'pt', NULL),
  ('técnica secreta',                   'geral', 'pt', NULL),
  ('milagre escondido',                 'geral', 'pt', NULL),
  ('o que ninguém fala',                'geral', 'pt', NULL),
  ('o que ninguém conta',               'geral', 'pt', NULL),
  ('o que médicos não contam',          'geral', 'pt', NULL),
  ('escondido da população',            'geral', 'pt', NULL),
  ('proibido pela indústria',           'geral', 'pt', NULL),
  ('removido pela anvisa',              'geral', 'pt', NULL),
  ('vídeo proibido',                    'geral', 'pt', NULL),
  ('vídeo derrubado',                   'geral', 'pt', NULL),
  ('antes que tirem do ar',             'geral', 'pt', NULL),
  ('antes que removam',                 'geral', 'pt', NULL),
  ('caseirinho',                        'geral', 'pt', NULL),
  ('solução caseira',                   'geral', 'pt', NULL),
  ('receita caseira',                   'geral', 'pt', NULL),
  ('receita simples',                   'geral', 'pt', NULL),
  ('receita natural',                   'geral', 'pt', NULL),
  ('receita antiga',                    'geral', 'pt', NULL),
  ('fácil de fazer',                    'geral', 'pt', NULL),
  ('fácil',                             'geral', 'pt', NULL),
  ('do dia a dia',                      'geral', 'pt', NULL),
  ('ingrediente que você tem em casa',  'geral', 'pt', NULL),
  ('misturinha',                        'geral', 'pt', NULL),
  ('mistura poderosa',                  'geral', 'pt', NULL),
  ('causa principal',                   'geral', 'pt', NULL),
  ('problema oculto',                   'geral', 'pt', NULL),
  ('o que está por trás',               'geral', 'pt', NULL),
  ('a raiz do problema',                'geral', 'pt', NULL),
  ('motivo real',                       'geral', 'pt', NULL),
  ('por que nada funciona',             'geral', 'pt', NULL),
  ('o que bloqueia seu corpo',          'geral', 'pt', NULL),
  ('razão escondida',                   'geral', 'pt', NULL),
  ('gatilho oculto',                    'geral', 'pt', NULL),
  ('trava hormonal',                    'geral', 'pt', NULL),
  ('comprovado',                        'geral', 'pt', NULL),
  ('estudos mostram',                   'geral', 'pt', NULL),
  ('estudo recente',                    'geral', 'pt', NULL),
  ('pesquisadores',                     'geral', 'pt', NULL),
  ('cientistas',                        'geral', 'pt', NULL),
  ('pesquisadores de harvard',          'geral', 'pt', NULL),
  ('especialistas',                     'geral', 'pt', NULL),
  ('médicos revelam',                   'geral', 'pt', NULL),
  ('testado e aprovado',                'geral', 'pt', NULL),
  ('baseado em pesquisas',              'geral', 'pt', NULL),
  ('chocante',                          'geral', 'pt', NULL),
  ('surpreendente',                     'geral', 'pt', NULL),
  ('bizarro',                           'geral', 'pt', NULL),
  ('estranho',                          'geral', 'pt', NULL),
  ('insólito',                          'geral', 'pt', NULL),
  ('oculto',                            'geral', 'pt', NULL),
  ('esquecido',                         'geral', 'pt', NULL),
  ('mistério',                          'geral', 'pt', NULL),
  ('descoberta',                        'geral', 'pt', NULL),
  ('revelado',                          'geral', 'pt', NULL),
  ('finalmente revelado',               'geral', 'pt', NULL),
  ('descoberta acidental',              'geral', 'pt', NULL)
ON CONFLICT DO NOTHING;
