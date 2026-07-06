import sallaLogo from '../assets/salla.webp'
import wooLogo from '../assets/woocommerce.webp'
import zidLogo from '../assets/zid.webp'
import shopifyLogo from '../assets/shopify.webp'

/** Platform brand marks — the official logos, bundled as assets. */

/** Shared <img> renderer: fixed height, natural width, contained. */
function ImgLogo({ src, alt, size }: { src: string; alt: string; size: number }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ height: size, width: 'auto', maxWidth: size * 2.6, objectFit: 'contain' }}
    />
  )
}

export function SallaLogo({ size = 34 }: { size?: number }) {
  return <ImgLogo src={sallaLogo} alt="Salla" size={size} />
}

export function ZidLogo({ size = 34 }: { size?: number }) {
  return <ImgLogo src={zidLogo} alt="Zid" size={size} />
}

export function WooLogo({ size = 34 }: { size?: number }) {
  return <ImgLogo src={wooLogo} alt="WooCommerce" size={size} />
}

export function ShopifyLogo({ size = 34 }: { size?: number }) {
  return <ImgLogo src={shopifyLogo} alt="Shopify" size={size} />
}
