'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import { useCart } from '@/app/context/CartContext'
import { createClient } from '@/app/lib/supabase'
import {
  Search,
  ShoppingCart,
  Sparkles,
  Star,
} from 'lucide-react'

interface Product {
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

interface ProductsClientProps {
  products: Product[]
}

const CATEGORY_OPTIONS = ['All', 'Grocery', 'Electronics', 'Fashion', 'Home']
const PRICE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: '₹0 - ₹500', value: '0-500' },
  { label: '₹500 - ₹1000', value: '500-1000' },
  { label: '₹1000+', value: '1000+' },
]

export default function ProductsClient({ products }: ProductsClientProps) {
  const router = useRouter()
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceFilter, setPriceFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [user, setUser] = useState<any>(null)
  const [cartMessage, setCartMessage] = useState<Record<string, string>>({})
  const { addToCart } = useCart()

  useEffect(() => {
    const loadSession = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('ProductsClient session error:', error)
          return
        }

        const currentUser = data?.session?.user || null
        setUser(currentUser)
      } catch (err) {
        console.error('ProductsClient auth load failed:', err)
      }
    }

    loadSession()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search).get('search') || new URLSearchParams(window.location.search).get('q')
    const categoryParam = new URLSearchParams(window.location.search).get('category')
    if (q) setSearchQuery(q)
    if (categoryParam) setSelectedCategory(categoryParam)
  }, [])

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()

    const newFiltered = products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const matchesSearch =
        !query ||
        [product.name, product.description]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query))

      let matchesPrice = true
      const discountedPrice = product.price * (1 - product.discount_percent / 100)
      if (priceFilter === '0-500') matchesPrice = discountedPrice <= 500
      if (priceFilter === '500-1000') matchesPrice = discountedPrice >= 500 && discountedPrice <= 1000
      if (priceFilter === '1000+') matchesPrice = discountedPrice >= 1000

      return matchesCategory && matchesSearch && matchesPrice
    })

    const sorted = [...newFiltered].sort((a, b) => {
      if (sortBy === 'price-low') return (a.price * (1 - a.discount_percent / 100)) - (b.price * (1 - b.discount_percent / 100))
      if (sortBy === 'price-high') return (b.price * (1 - b.discount_percent / 100)) - (a.price * (1 - a.discount_percent / 100))
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      return (b.discount_percent || 0) - (a.discount_percent || 0)
    })

    setFilteredProducts(sorted)
  }, [products, selectedCategory, priceFilter, searchQuery, sortBy])

  const handleJoinGroupBuy = (productId: string) => {
    if (!user) {
      router.push(`/login?redirect=/products/${productId}`)
      return
    }
    router.push(`/products/${productId}`)
  }

  const handleStartGroupBuy = (productId: string) => {
    if (!user) {
      router.push(`/login?redirect=/start-group/${productId}`)
      return
    }
    router.push(`/start-group/${productId}`)
  }

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      discount_percent: product.discount_percent,
    })

    setCartMessage((current) => ({ ...current, [product.id]: 'Added to cart!' }))
    window.setTimeout(() => {
      setCartMessage((current) => ({ ...current, [product.id]: '' }))
    }, 2000)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`)
    } else {
      router.push('/products')
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    router.push('/products')
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#2D2D2D]">
      <Navbar showSearch={true} onSearch={handleSearch} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {searchQuery ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Search results</p>
                  <h1 className="mt-2 text-3xl font-bold text-[#2D2D2D] sm:text-4xl">{filteredProducts.length} results for "{searchQuery}"</h1>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Shop curated deals</p>
                  <h1 className="mt-2 text-3xl font-bold text-[#2D2D2D] sm:text-4xl">Premium products for every group buy</h1>
                  <p className="mt-2 max-w-2xl text-sm text-gray-600">
                    Filter by category, compare prices, and join community deals with one click.
                  </p>
                </>
              )}
            </div>

            <div className="w-full max-w-sm rounded-2xl bg-[#F6F6F6] p-3">
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-[#1D9E75]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Search products"
                  className="w-full bg-transparent text-sm text-[#2D2D2D] outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Category</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedCategory(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedCategory === option ? 'bg-[#1D9E75] text-white' : 'bg-[#F6F6F6] text-[#2D2D2D]'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Price</p>
            <div className="mt-3 space-y-2">
              {PRICE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setPriceFilter(filter.value)}
                  className={`block w-full rounded-2xl px-4 py-2 text-left text-sm font-semibold transition ${priceFilter === filter.value ? 'bg-[#1D9E75] text-white' : 'bg-[#F6F6F6] text-[#2D2D2D]'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Sort</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const discountedPrice = product.price * (1 - product.discount_percent / 100)

            return (
              <div key={product.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#F6F6F6]">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">📦</div>
                    )}
                  </div>
                </Link>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-[#2D2D2D]">{product.category}</p>
                  <h2 className="mt-2 text-lg font-bold text-[#2D2D2D]">{product.name}</h2>
                  <p className="mt-2 text-sm text-[#6B7280] line-clamp-2">{product.description || 'High-quality product for your group buy.'}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-[#1D9E75]">₹{discountedPrice.toFixed(2)}</p>
                    {product.discount_percent > 0 && <p className="text-xs text-gray-400 line-through">₹{product.price.toFixed(2)}</p>}
                  </div>
                  <span className="rounded-full bg-[#E6F7F0] px-2 py-1 text-[10px] font-bold text-[#1D9E75]">
                    {product.activeGroupBuyCount ?? 0} live
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="rounded-2xl bg-[#1D9E75] px-3 py-3 text-xs font-bold text-white transition hover:bg-[#15845f]"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleStartGroupBuy(product.id)}
                    className="rounded-2xl border border-[#1D9E75] bg-white px-3 py-3 text-xs font-bold text-[#1D9E75] transition hover:bg-emerald-50"
                  >
                    Group Buy
                  </button>
                </div>

                {cartMessage[product.id] && (
                  <div className="mt-3 rounded-2xl bg-[#E6F7F0] px-3 py-2 text-sm font-semibold text-[#1D9E75]">
                    {cartMessage[product.id]}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
