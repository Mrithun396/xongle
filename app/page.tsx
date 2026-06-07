import HomeClient from '@/app/components/HomeClient'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

interface ProductCard {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  discount_percent: number
  image_url: string | null
}

interface GroupBuyCard {
  id: string
  product_id: string
  member_count: number
  expires_at: string
  products: ProductCard | null
}

export default async function HomePage() {
  const supabase = createServerSupabaseClient()

  const { data: allProducts, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (productsError) {
    console.error('Home page products fetch error:', productsError)
  }

  const { data: groupBuysData, error: groupBuysError } = await supabase
    .from('group_buys')
    .select('*, products(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4)

  if (groupBuysError) {
    console.error('Home page group buys fetch error:', groupBuysError)
  }

  const categoryProducts: Record<string, ProductCard[]> = {
    grocery: (allProducts || []).filter((product) => product.category === 'grocery').slice(0, 8),
    electronics: (allProducts || []).filter((product) => product.category === 'electronics').slice(0, 8),
    fashion: (allProducts || []).filter((product) => product.category === 'fashion').slice(0, 8),
    home: (allProducts || []).filter((product) => product.category === 'home').slice(0, 8),
    beauty: (allProducts || []).filter((product) => product.category === 'beauty').slice(0, 8),
  }

  const activeGroupBuys: GroupBuyCard[] = (groupBuysData || []).map((groupBuy) => ({
    ...groupBuy,
    products: Array.isArray(groupBuy.products) ? groupBuy.products[0] ?? null : groupBuy.products ?? null,
  }))

  return <HomeClient categoryProducts={categoryProducts} activeGroupBuys={activeGroupBuys} />
}
