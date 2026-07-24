# DEIMOS — Offer Collector

Coleta anúncios ativos da **Meta Ad Library** e transforma em `offer_observations` estruturadas em Excel. Alimenta o modelo de inteligência de mercado do **NOVA**.

---

## Instalação

```bash
pip install requests openpyxl
```

---

## Como obter o token gratuito da Meta

1. Acesse o [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Clique em **"Add a Permission"** e adicione `ads_read`
3. Clique em **"Generate Access Token"**
4. Copie o token gerado (válido por ~1h; renove quando expirar)

> Sem token, a API retorna campos reduzidos (sem copy, plataformas, idiomas, funding entity).

---

## Uso

### `collector.py` — coleta por query única ou múltipla

```bash
# Query única, sem token (campos reduzidos)
python collector.py --query "emagrecimento"

# Query única, com token
python collector.py --query "emagrecimento" --token SEU_TOKEN

# Múltiplas queries separadas por vírgula
python collector.py --query "emagrecimento,perder peso,dieta" --token SEU_TOKEN

# Opções adicionais
python collector.py \
  --query "renda extra" \
  --token SEU_TOKEN \
  --limit 200 \
  --min_ads 5 \
  --countries BR \
  --output minha_coleta.xlsx \
  --inactive          # inclui anúncios inativos
```

| Flag | Padrão | Descrição |
|------|--------|-----------|
| `--query` | obrigatório | Keyword(s) separadas por vírgula |
| `--token` | `None` | Meta access token com permissão `ads_read` |
| `--limit` | `100` | Máximo de anúncios por query |
| `--min_ads` | `1` | Mínimo de ads ativos para incluir um player |
| `--countries` | `BR` | País(es) separados por vírgula |
| `--output` | `spy_YYYY-MM-DD.xlsx` | Caminho do arquivo de saída |
| `--inactive` | `False` | Incluir anúncios inativos |

---

### `run.py` — runner automático via `keywords.txt`

```bash
# Execução básica (lê keywords.txt no mesmo diretório)
python run.py --token SEU_TOKEN

# Com opções
python run.py \
  --token SEU_TOKEN \
  --min_ads 3 \
  --limit 150 \
  --delay 2.0 \
  --output spy_2026-03-27.xlsx
```

| Flag | Padrão | Descrição |
|------|--------|-----------|
| `--token` | `None` | Meta access token |
| `--min_ads` | `1` | Mínimo de ads para incluir player |
| `--limit` | `100` | Máx de anúncios por query |
| `--delay` | `1.5` | Delay em segundos entre queries |
| `--output` | `spy_YYYY-MM-DD.xlsx` | Arquivo de saída |
| `--keywords_file` | `keywords.txt` | Caminho alternativo para o arquivo de keywords |

**Saída esperada no terminal:**
```
DEIMOS — Iniciando coleta de 22 keywords

[01/22] 🔍 "emagrecimento" → ads: 87 | players: 34 | novos únicos: 34
[02/22] 🔍 "gelatina emagrecer" → ads: 41 | players: 18 | novos únicos: 11
...
COLETA FINALIZADA
Total de players únicos: 210
🔴 FORTE: 12  🟠 MÉDIO: 28  🟡 FRACO: 51  ⚪ RUÍDO: 119
✅ Exportado para: spy_2026-03-27.xlsx
```

---

## Editar keywords

Abra `keywords.txt` e adicione, remova ou reorganize as palavras-chave. Linhas começando com `#` são comentários e são ignoradas.

```
# ── EMAGRECIMENTO ──
emagrecimento
gelatina emagrecer
perder peso
```

---

## Critério de Sinal

| Sinal | Cor | Ads Ativos do Player |
|-------|-----|----------------------|
| 🔴 FORTE | Vermelho | ≥ 20 |
| 🟠 MÉDIO | Laranja | 10 – 19 |
| 🟡 FRACO | Amarelo | 5 – 9 |
| ⚪ RUÍDO | Cinza | < 5 |

Players com sinal **FORTE** ou **MÉDIO** são os concorrentes/parceiros de maior relevância para análise de mercado.

---

## Estrutura do Excel gerado

**Aba "Offer Observations"** — uma linha por player único:

| Campo | Descrição |
|-------|-----------|
| ID Observação | Hash SHA-256 (12 chars) de `page_id:query:date` |
| Coletado em | Timestamp da coleta |
| Query | Keyword usada na busca |
| Anunciante | Nome da página no Facebook |
| Page ID | ID único da página |
| Financiador | Entidade financiadora declarada |
| Ads Ativos | Contagem de anúncios do player nessa query |
| Sinal | Classificação FORTE/MÉDIO/FRACO/RUÍDO |
| Primeiro Ad | Data do anúncio mais antigo |
| Último Ad | Data do anúncio mais recente |
| Plataformas | Facebook, Instagram, etc. |
| Idiomas | Idiomas declarados |
| Amostra de Copy | Primeiro body de anúncio encontrado |
| Link | Hyperlink para o Ad Snapshot |
| Notas | Campo livre para anotações manuais |

**Aba "Resumo"** — contagem por força de sinal + tabela de stats por keyword.

---

## Integração futura com Supabase (NOVA)

```python
import supabase

SUPABASE_URL = "https://SEU_PROJETO.supabase.co"
SUPABASE_KEY = "sua_anon_key"

client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

def push_observations_to_nova(observations: list[dict]) -> None:
    """Envia offer_observations para a tabela do NOVA no Supabase."""
    # upsert por obs_id para evitar duplicatas
    result = (
        client.table("offer_observations")
        .upsert(observations, on_conflict="obs_id")
        .execute()
    )
    print(f"✅ {len(result.data)} observações sincronizadas com o NOVA")

# Após export_to_excel:
# push_observations_to_nova(all_observations)
```

Instale o cliente: `pip install supabase`
