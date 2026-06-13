import ProductsClient from '@/app/components/ProductsClient'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

interface ProductWithGroupBuy {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  discount_percent: number
  seller_id: string
  created_at?: string | null
  activeGroupBuyCount?: number
}

export default async function ProductsPage() {
  const supabase = createServerSupabaseClient()

  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (productsError) {
    console.error('Products page fetch error:', productsError)
  }

  const { data: groupBuysData, error: groupBuysError } = await supabase
    .from('group_buys')
    .select('*')
    .eq('status', 'active')

  if (groupBuysError) {
    console.error('Products page group buys fetch error:', groupBuysError)
  }

  const products: ProductWithGroupBuy[] = (productsData || []).map((product) => {
    const activeGroupBuyCount = (groupBuysData || []).filter((gb) => gb.product_id === product.id).length
    return {
      ...product,
      activeGroupBuyCount,
    }
  })

  return <ProductsClient products={products} />
}
