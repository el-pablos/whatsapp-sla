import { useState, useCallback, useMemo } from 'react'
import type { Catalog } from './Index'

interface PreviewModalProps {
  catalog: Catalog
  onClose: () => void
}

export default function PreviewModal({ catalog, onClose }: PreviewModalProps) {
  const [copied, setCopied] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const whatsappText = useMemo(() => {
    const lines: string[] = []

    // Header
    lines.push(`*${catalog.name}*`)
    if (catalog.description) {
      lines.push(catalog.description)
    }
    lines.push('')
    lines.push('---')
    lines.push('')

    // Group products by category
    const telurProducts = catalog.products.filter(p => p.category === 'telur')
    const ayamProducts = catalog.products.filter(p => p.category === 'ayam')

    if (telurProducts.length > 0) {
      lines.push('*TELUR*')
      telurProducts.forEach((product, index) => {
        lines.push(`${index + 1}. ${product.name}`)
        lines.push(`   ${formatCurrency(product.price)}/${product.unit}`)
        if (product.stock > 0) {
          lines.push(`   Stok: ${product.stock} ${product.unit}`)
        } else {
          lines.push(`   _Stok habis_`)
        }
      })
      lines.push('')
    }

    if (ayamProducts.length > 0) {
      lines.push('*AYAM*')
      ayamProducts.forEach((product, index) => {
        lines.push(`${index + 1}. ${product.name}`)
        lines.push(`   ${formatCurrency(product.price)}/${product.unit}`)
        if (product.stock > 0) {
          lines.push(`   Stok: ${product.stock} ${product.unit}`)
        } else {
          lines.push(`   _Stok habis_`)
        }
      })
      lines.push('')
    }

    // Footer
    lines.push('---')
    lines.push('')
    lines.push('Untuk pemesanan, balas pesan ini dengan format:')
    lines.push('`Nama - Alamat - Produk (jumlah)`')
    lines.push('')
    lines.push('Terima kasih!')

    return lines.join('\n')
  }, [catalog])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(whatsappText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = whatsappText
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [whatsappText])

  const handleShareWhatsApp = useCallback(() => {
    const encodedText = encodeURIComponent(whatsappText)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }, [whatsappText])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Preview WhatsApp</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* WhatsApp chat bubble style */}
            <div className="bg-[#e7ffdb] rounded-lg p-3 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 leading-relaxed">
                {whatsappText}
              </pre>
              <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-500">
                <span>
                  {new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Preview ini menunjukkan bagaimana katalog akan tampil di WhatsApp
            </p>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 space-y-3">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tersalin!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Salin Teks
                </>
              )}
            </button>

            {/* Share to WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Bagikan ke WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
