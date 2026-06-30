import { chromium, type Browser } from 'playwright'
import { logger } from '../../lib/logger'
import { listingScrapedSchema, type ListingScraped } from '../../validations/competitor.validation'

// User-Agents realistas alternados para reduzir bloqueio (estratégia anti-bloqueio do scraper)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
]

// Erros específicos para o worker reagir (retry vs pausar)
export class CaptchaDetectadoError extends Error {
  constructor() {
    super('CAPTCHA detectado pelo Mercado Livre')
    this.name = 'CaptchaDetectadoError'
  }
}
export class LayoutMudouError extends Error {
  constructor(campo: string) {
    super(`Elemento não encontrado (layout pode ter mudado): ${campo}`)
    this.name = 'LayoutMudouError'
  }
}

// Extrai o ID do anúncio (MLB...) da URL do Mercado Livre
export function extrairExternalId(url: string): string {
  const match = url.match(/MLB-?(\d+)/i)
  if (!match) throw new Error('Não foi possível extrair o ID do anúncio (MLB) da URL')
  return `MLB${match[1]}`
}

// Configura proxy BrightData se as credenciais existirem; senão roda com IP direto (dev).
function configurarProxy() {
  const user = process.env.BRIGHTDATA_USERNAME
  const pass = process.env.BRIGHTDATA_PASSWORD
  if (!user || !pass) return undefined
  return {
    server: 'http://brd.superproxy.io:22225',
    username: user,
    password: pass,
  }
}

// Delay aleatório entre requests (0.8s a 2.5s) — parece tráfego humano
function delayAleatorio(): Promise<void> {
  const ms = 800 + Math.floor(Math.random() * 1700)
  return new Promise((r) => setTimeout(r, ms))
}

// Faz o scraping de UMA página de anúncio do ML. Reutiliza um Browser passado para
// não abrir um Chromium por concorrente (o worker abre 1 browser por rodada).
export async function scrapeMercadoLivre(url: string, browser: Browser): Promise<ListingScraped> {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  const context = await browser.newContext({
    userAgent,
    locale: 'pt-BR',
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
  })

  try {
    const page = await context.newPage()
    await delayAleatorio()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    // Detecta CAPTCHA / página de bloqueio
    const html = await page.content()
    if (/captcha|robot|verifique que você é humano|access denied/i.test(html)) {
      logger.warn('Scraper: CAPTCHA/bloqueio detectado', { url })
      throw new CaptchaDetectadoError()
    }

    // Preço: o ML expõe o valor numérico no meta itemprop="price" (mais estável que o DOM)
    const precoMeta = await page.getAttribute('meta[itemprop="price"]', 'content').catch(() => null)
    let price = precoMeta ? Number(precoMeta) : NaN

    // Fallback: monta o preço a partir dos spans de inteiro + centavos do bloco principal
    if (!Number.isFinite(price) || price <= 0) {
      const inteiro = (await page.locator('.andes-money-amount__fraction').first().textContent().catch(() => null)) ?? ''
      const centavos = (await page.locator('.andes-money-amount__cents').first().textContent().catch(() => null)) ?? '0'
      const limpoInt = inteiro.replace(/\D/g, '')
      const limpoCent = centavos.replace(/\D/g, '').padEnd(2, '0').slice(0, 2)
      price = Number(`${limpoInt}.${limpoCent}`)
    }
    if (!Number.isFinite(price) || price <= 0) throw new LayoutMudouError('preço')

    const title =
      (await page.locator('.ui-pdp-title').first().textContent().catch(() => null))?.trim() ||
      (await page.title()).replace(/\s*\|\s*Mercado Livre.*$/i, '').trim()
    if (!title) throw new LayoutMudouError('título')

    const sellerName =
      (await page.locator('.ui-pdp-seller__link-trigger, .ui-box-component__title').first().textContent().catch(() => null))?.trim() ||
      'Vendedor não identificado'

    // Estoque: o ML mostra "Estoque disponível" / "(N disponíveis)" — extrai o número se houver
    const estoqueTexto = (await page.locator('.ui-pdp-buybox__quantity, .ui-pdp-stock').first().textContent().catch(() => null)) ?? ''
    const estoqueMatch = estoqueTexto.match(/(\d+)\s*dispon/i)
    const stock = estoqueMatch ? Number(estoqueMatch[1]) : null

    // Buy box: na página do produto, ter um botão "Comprar agora" sem "outros vendedores" em destaque
    // indica que este vendedor detém a oferta principal (buy box).
    const temComprar = (await page.locator('.ui-pdp-action--primary, [data-testid="action-add-to-cart"]').count()) > 0
    const temOutrosVendedores = (await page.locator('.ui-pdp-other-sellers, a:has-text("Outras opções de compra")').count()) > 0
    const hasBuyBox = temComprar && !temOutrosVendedores

    const dado = {
      externalId: extrairExternalId(url),
      title,
      price,
      stock,
      sellerName,
      hasBuyBox,
    }

    // Valida antes de sair do scraper — só dado consistente prossegue
    return listingScrapedSchema.parse(dado)
  } finally {
    await context.close()
  }
}

// Abre um Browser com proxy/headless configurado. O worker é responsável por fechá-lo.
export async function abrirBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    proxy: configurarProxy(),
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
}
