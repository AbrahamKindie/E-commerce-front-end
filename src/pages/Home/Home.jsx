
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Star,
  Truck,
  ShieldCheck,
  Headphones,
  RefreshCcw,
  Zap,
  LoaderCircle,
  Store,
  Layers,
  Package,
  ShoppingBag,
} from "lucide-react";

import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import { API_BASE_URL } from "../../services/api";

// ==========================================
// CONSTANTS
// ==========================================

const FALLBACK_IMAGE =
  "https://placehold.co/600x600?text=No+Image";

// ==========================================
// RESPONSE HELPERS
// ==========================================

const getArray = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.categories)) {
    return response.categories;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  return [];
};

// ==========================================
// SHOP HELPERS
// ==========================================

const getActiveShops = (category) => {
  if (!Array.isArray(category?.shops)) return [];

  return category.shops.filter((shop) => {
    if (shop?.status !== undefined) {
      return shop.status === "ACTIVE";
    }

    if (shop?.isActive !== undefined) {
      return shop.isActive === true;
    }

    // Backend already returns active shops.
    return true;
  });
};

// ==========================================
// GET SHOP CATEGORY COUNTS
// ==========================================

const getShopCount = (category) => {
  if (Number.isFinite(Number(category?.shopsCount))) {
    return Number(category.shopsCount);
  }

  return getActiveShops(category).length;
};

const getProductCount = (category) => {
  if (Number.isFinite(Number(category?.productsCount))) {
    return Number(category.productsCount);
  }

  return getActiveShops(category).reduce(
    (total, shop) =>
      total + Number(shop.productsCount ?? shop._count?.products ?? 0),
    0
  );
};

// ==========================================
// IMAGE HELPERS
// ==========================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return FALLBACK_IMAGE;
  }

  try {
    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    const apiOrigin = new URL(API_BASE_URL).origin;

    return `${apiOrigin}/${image.replace(/^\/+/, "")}`;
  } catch (error) {
    console.error("Invalid image URL:", error);
    return FALLBACK_IMAGE;
  }
};

const handleImageError = (event) => {
  const imageElement = event.currentTarget;

  imageElement.onerror = null;
  imageElement.src = FALLBACK_IMAGE;
};

// ==========================================
// HOMEPAGE SERVICES
// ==========================================

const services = [
  {
    icon: Truck,
    title: "Free Delivery",
    description: "On eligible orders",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "Secure transactions",
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    description: "Hassle-free returns",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "We're here to help",
  },
];

// ==========================================
// REUSABLE SECTION HEADING
// ==========================================

const SectionHeading = ({
  title,
  subtitle,
  link = "/products",
}) => (
  <div className="mb-7 flex items-end justify-between gap-4">
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">
        ShopEase Collection
      </p>

      <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>

    <Link
      to={link}
      className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-blue-700 transition hover:text-orange-500"
    >
      View All
      <ArrowRight size={16} />
    </Link>
  </div>
);

// ==========================================
// REUSABLE PRODUCT CARD
// ==========================================

const ProductCard = ({ product }) => {
  const image = getImageUrl(product.images?.[0]);

  const availableStock =
    product.stockInfo?.available ?? product.stock ?? 0;

  const currentPrice = Number(
    product.hasActiveDiscount
      ? product.discountedPrice
      : product.price
  );

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition duration-300 hover:shadow-xl">
      <div className="relative overflow-hidden bg-gray-50">
        <Link to={`/products/${product.id}`}>
          <img
            src={image}
            alt={product.name || "Product"}
            onError={handleImageError}
            loading="lazy"
            className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>

        {product.hasActiveDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
            {product.discount?.type === "PERCENTAGE"
              ? `-${Number(product.discount.value)}%`
              : `-${Number(product.discountAmount).toFixed(2)}`}
          </span>
        )}

        {product.isNewArrival && (
          <span className="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
            NEW
          </span>
        )}

        <Link
          to={`/products/${product.id}`}
          className="absolute bottom-3 left-3 right-3 translate-y-3 rounded-lg bg-blue-700 py-2.5 text-center text-sm font-semibold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
        >
          View Product
        </Link>
      </div>

      <div className="p-4">
        <p className="mb-2 text-xs text-gray-400">
          {product.category?.name || "Uncategorized"}
        </p>

        <Link to={`/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-gray-800 hover:text-blue-700">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <Star
            size={14}
            className="fill-yellow-400 text-yellow-400"
          />

          <span className="text-xs font-semibold">
            {Number(product.averageRating || 0).toFixed(1)}
          </span>

          <span className="text-xs text-gray-400">
            ({product.totalReviews || 0} reviews)
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-blue-800">
            {Number.isFinite(currentPrice)
              ? currentPrice.toLocaleString()
              : "0"}
          </span>

          {product.hasActiveDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {Number(product.price).toLocaleString()}
            </span>
          )}
        </div>

        <p
          className={`mt-2 text-xs ${
            availableStock > 0
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {availableStock > 0
            ? `${availableStock} available`
            : "Out of stock"}
        </p>
      </div>
    </div>
  );
};

// ==========================================
// REUSABLE PRODUCT SECTION
// ==========================================

const ProductSection = ({
  title,
  subtitle,
  products = [],
  loading,
  limit = 8,
  columns = "lg:grid-cols-4",
}) => (
  <section className="mx-auto max-w-7xl px-4 py-12">
    <SectionHeading
      title={title}
      subtitle={subtitle}
    />

    {loading ? (
      <div className="flex justify-center py-12">
        <LoaderCircle
          className="animate-spin text-blue-700"
          size={32}
        />
      </div>
    ) : products.length === 0 ? (
      <p className="py-12 text-center text-gray-500">
        No products available in this section yet.
      </p>
    ) : (
      <div
        className={`grid grid-cols-2 gap-5 sm:grid-cols-3 ${columns}`}
      >
        {products.slice(0, limit).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    )}
  </section>
);

// ==========================================
// SHOP CATEGORY CARD
//
// Displays ONLY:
// 1. Active Shops Count
// 2. Active Products Count
// ==========================================

const ShopCategoryCard = ({ category }) => {
  const totalShops = getShopCount(category);
  const totalProducts = getProductCount(category);

  const categoryUrl = `/categories/${category.id}`;

  return (
    <Link
      to={categoryUrl}
      className="group w-[270px] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-blue-50 to-orange-50">
        <img
          src={getImageUrl(category.image)}
          alt={category.name || "Shop category"}
          loading="lazy"
          onError={handleImageError}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-orange-50 p-5 transition group-hover:from-blue-100 group-hover:to-orange-100">
        <h3 className="text-lg font-extrabold text-gray-900">
          {category.name}
        </h3>

        {category.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
            {category.description}
          </p>
        )}

        {/* ONLY SHOPS AND PRODUCTS */}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/80 p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Store size={15} />

              <span className="text-xs font-medium text-gray-500">
                Shops
              </span>
            </div>

            <p className="mt-1 text-xl font-extrabold text-gray-900">
              {totalShops.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg bg-white/80 p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Package size={15} />

              <span className="text-xs font-medium text-gray-500">
                Products
              </span>
            </div>

            <p className="mt-1 text-xl font-extrabold text-gray-900">
              {totalProducts.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-700">
            Explore Category
          </span>

          <ArrowRight
            size={16}
            className="text-blue-700 transition group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
};

// ==========================================
// PRODUCT CATEGORY CARD
//
// Displays:
// 1. Product Category Name
// 2. Shop Category Name
// 3. Active Products Count
//
// URL:
// /categories/3?productCategory=Smartphones
// ==========================================

const ProductCategoryCard = ({ item }) => {
  const {
    productCategory,
    shopCategory,
    productsCount,
  } = item;

  const productCategoryUrl =
    `/categories/${shopCategory.id}?productCategory=${encodeURIComponent(
      productCategory.name
    )}`;

  return (
    <Link
      to={productCategoryUrl}
      className="group flex min-h-[160px] w-[245px] shrink-0 flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
          <Layers size={21} />
        </div>

        <ArrowRight
          size={17}
          className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-700"
        />
      </div>

      <div className="mt-4">
        <h3 className="line-clamp-1 text-base font-bold text-gray-900 group-hover:text-blue-700">
          {productCategory.name}
        </h3>

        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
          {shopCategory.name}
        </p>

        {productCategory.description && (
          <p className="mt-1 line-clamp-1 text-xs text-gray-400">
            {productCategory.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Package size={15} className="text-blue-700" />

        <span className="text-sm font-bold text-blue-700">
          {productsCount.toLocaleString()}
        </span>

        <span className="text-xs text-gray-500">
          {productsCount === 1 ? "Product" : "Products"}
        </span>
      </div>
    </Link>
  );
};

// ==========================================
// BUILD PRODUCT CATEGORY LIST
//
// Combines identical Product Category names
// within the same Shop Category.
//
// Counts active products across all active
// shops offering that Product Category.
// ==========================================

const buildProductCategoryList = (categories) => {
  const items = new Map();

  categories.forEach((shopCategory) => {
    const activeShops = getActiveShops(shopCategory);

    activeShops.forEach((shop) => {
      const productCategories = Array.isArray(
        shop.productCategories
      )
        ? shop.productCategories
        : [];

      productCategories.forEach((productCategory) => {
        if (!productCategory?.name) return;

        const name = String(productCategory.name).trim();

        if (!name) return;

        const normalizedName = name.toLowerCase();

        const key = `${shopCategory.id}:${normalizedName}`;

        if (!items.has(key)) {
          items.set(key, {
            productCategory: {
              name,
              description: productCategory.description || "",
            },

            shopCategory,

            shopIds: new Set(),

            productsCount: 0,
          });
        }

        const item = items.get(key);

        item.shopIds.add(shop.id);

        // Backend provides the active product count.
        item.productsCount += Number(
          productCategory.productsCount ??
          productCategory._count?.products ??
          0
        );
      });
    });
  });

  return Array.from(items.values())
    .map(({ productCategory, shopCategory, productsCount }) => ({
      productCategory,
      shopCategory,
      productsCount,
    }))
    .sort((a, b) =>
      a.productCategory.name.localeCompare(
        b.productCategory.name
      )
    );
};

// ==========================================
// HOME PAGE
// ==========================================

const Home = () => {
  const [categories, setCategories] = useState([]);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FILTER SHOP CATEGORIES
  // ==========================================

  const visibleShopCategories = useMemo(() => {
    return categories.filter((category) => {
      const name = String(category?.name || "")
        .trim()
        .toLowerCase();

      return name !== "other";
    });
  }, [categories]);

  // ==========================================
  // GET PRODUCT CATEGORIES FROM ACTIVE SHOPS
  // ==========================================

  const productCategories = useMemo(() => {
    return buildProductCategoryList(visibleShopCategories);
  }, [visibleShopCategories]);

  // ==========================================
  // LOAD HOMEPAGE DATA
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        categoryService.getCategories(),
        productService.getFeaturedProducts(8),
        productService.getBestSellingProducts(10),
        productService.getNewArrivals(8),
      ]);

      if (!isMounted) return;

      const [
        categoryResult,
        featuredResult,
        bestSellingResult,
        newArrivalResult,
      ] = results;

      if (categoryResult.status === "fulfilled") {
        setCategories(getArray(categoryResult.value));
      } else {
        console.error(
          "Shop categories loading error:",
          categoryResult.reason
        );
      }

      if (featuredResult.status === "fulfilled") {
        setFeaturedProducts(getArray(featuredResult.value));
      } else {
        console.error(
          "Featured products loading error:",
          featuredResult.reason
        );
      }

      if (bestSellingResult.status === "fulfilled") {
        setBestSellingProducts(
          getArray(bestSellingResult.value)
        );
      } else {
        console.error(
          "Best selling products loading error:",
          bestSellingResult.reason
        );
      }

      if (newArrivalResult.status === "fulfilled") {
        setNewArrivals(getArray(newArrivalResult.value));
      } else {
        console.error(
          "New arrivals loading error:",
          newArrivalResult.reason
        );
      }

      const allFailed = results.every(
        (result) => result.status === "rejected"
      );

      if (allFailed) {
        setError(
          "Unable to load homepage information. Please try again."
        );
      }

      setLoading(false);
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white text-gray-800">
      {/* ======================================
          HERO SECTION
      ====================================== */}

      <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="relative min-h-[440px] overflow-hidden rounded-2xl bg-gray-100 lg:col-span-8 md:min-h-[510px]">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400"
                alt="Premium headphones"
                onError={handleImageError}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />

              <div className="relative z-10 flex h-full max-w-xl flex-col justify-center p-8 md:p-14">
                <span className="mb-6 w-fit rounded-full bg-orange-100 px-4 py-2 text-xs font-bold text-orange-600">
                  WELCOME TO SHOPEASE
                </span>

                <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl">
                  Discover Your
                  <span className="block text-blue-700">
                    Perfect Style.
                  </span>
                </h1>

                <p className="mt-5 max-w-md leading-7 text-gray-600">
                  Explore quality products, exciting offers and
                  everyday essentials. Everything you love, all
                  in one place.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/products"
                    className="flex items-center gap-2 rounded-lg bg-blue-700 px-7 py-4 font-semibold text-white hover:bg-blue-800"
                  >
                    Shop Now
                    <ArrowRight size={18} />
                  </Link>

                  <Link
                    to="/categories"
                    className="rounded-lg border border-gray-300 px-7 py-4 font-semibold hover:border-blue-700"
                  >
                    Explore Categories
                  </Link>
                </div>

                <div className="mt-10 flex gap-8">
                  <div>
                    <p className="text-2xl font-extrabold text-blue-800">
                      {visibleShopCategories.length}+
                    </p>

                    <p className="text-xs text-gray-500">
                      Shop Categories
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-blue-800">
                      {featuredProducts.length}+
                    </p>

                    <p className="text-xs text-gray-500">
                      Featured Products
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-blue-800">
                      24/7
                    </p>

                    <p className="text-xs text-gray-500">
                      Support
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SIDE PROMOTIONS */}

            <div className="flex flex-col gap-5 lg:col-span-4">
              <div className="relative min-h-[210px] flex-1 overflow-hidden rounded-2xl bg-blue-50">
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700"
                  alt="Smartphones"
                  onError={handleImageError}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-white/95 to-transparent p-6">
                  <p className="text-sm font-bold text-orange-500">
                    EXPLORE OUR STORE
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                    Electronics
                  </h2>

                  <Link
                    to="/products"
                    className="mt-4 text-sm font-bold text-blue-700"
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[210px] flex-1 overflow-hidden rounded-2xl bg-orange-50">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700"
                  alt="Fashion collection"
                  onError={handleImageError}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-white/95 to-transparent p-6">
                  <p className="text-sm font-bold text-orange-500">
                    DISCOVER MORE
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                    New Collections
                  </h2>

                  <Link
                    to="/products?sortBy=newest"
                    className="mt-4 text-sm font-bold text-blue-700"
                  >
                    Explore More →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================
          BENEFITS
      ====================================== */}

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="flex items-center gap-4 rounded-xl border border-gray-100 p-5"
              >
                <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                  <Icon size={25} />
                </div>

                <div>
                  <h3 className="text-sm font-bold">
                    {service.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================
          SHOP CATEGORIES
      ====================================== */}

      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionHeading
          title="Shop By Categories"
          subtitle="Explore our shop categories, active shops, and available products."
          link="/categories"
        />

        {loading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle
              className="animate-spin text-blue-700"
              size={30}
            />
          </div>
        ) : visibleShopCategories.length === 0 ? (
          <div className="py-8 text-center">
            <Layers
              size={36}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 text-sm text-gray-500">
              No shop categories available yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-5">
            <div className="flex w-max gap-5">
              {visibleShopCategories.map((category) => (
                <ShopCategoryCard
                  key={category.id}
                  category={category}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ======================================
          PRODUCT CATEGORIES
          From active shops only
      ====================================== */}

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            title="Explore Product Categories"
            subtitle="Discover products by their categories."
            link="/categories"
          />

          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderCircle
                className="animate-spin text-blue-700"
                size={30}
              />
            </div>
          ) : productCategories.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag
                size={36}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm text-gray-500">
                No product categories are available yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-5">
              <div className="flex w-max gap-4">
                {productCategories.map((item) => (
                  <ProductCategoryCard
                    key={`${item.shopCategory.id}-${item.productCategory.name.toLowerCase()}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================
          FLASH DEAL
      ====================================== */}

      <section className="my-12 bg-blue-800 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 py-12 md:flex-row">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-orange-300">
              <Zap size={18} />
              SPECIAL OFFERS
            </div>

            <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
              Great Deals Are Here!
            </h2>

            <p className="mt-3 text-blue-100">
              Discover incredible prices on selected products.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-7 py-3 font-bold hover:bg-orange-600"
            >
              Explore Products
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="text-center">
            <p className="text-5xl font-extrabold">
              {featuredProducts.length}
            </p>

            <p className="mt-2 text-blue-100">
              Featured products
            </p>
          </div>
        </div>
      </section>

      {/* ======================================
          FEATURED PRODUCTS
      ====================================== */}

      <ProductSection
        title="Featured Products"
        subtitle="Handpicked products we think you'll love."
        products={featuredProducts}
        loading={loading}
      />

      {/* ======================================
          LARGE PROMOTION
      ====================================== */}

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="relative min-h-[330px] overflow-hidden rounded-3xl bg-gray-900">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400"
            alt="Shopping collection"
            onError={handleImageError}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />

          <div className="relative max-w-2xl p-8 md:p-16">
            <span className="text-sm font-bold tracking-widest text-orange-300">
              THE SHOPEASE COLLECTION
            </span>

            <h2 className="mt-4 text-4xl font-extrabold text-white md:text-5xl">
              Upgrade Your Everyday.
            </h2>

            <p className="mt-4 text-gray-200">
              Discover amazing products and exclusive offers
              for your lifestyle.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-7 py-3 font-bold text-white hover:bg-orange-600"
            >
              Start Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================
          BEST SELLING PRODUCTS
      ====================================== */}

      <ProductSection
        title="Best Selling Products"
        subtitle="Explore the products our customers love and order most."
        products={bestSellingProducts}
        loading={loading}
        limit={10}
        columns="lg:grid-cols-5"
      />

      {/* ======================================
          NEW ARRIVALS
      ====================================== */}

      <section className="bg-gray-50 py-2">
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh additions to our collection."
          products={newArrivals}
          loading={loading}
        />
      </section>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* ======================================
          CUSTOMER REVIEWS
      ====================================== */}

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold tracking-widest text-orange-500">
            CUSTOMER EXPERIENCES
          </p>

          <h2 className="mt-2 text-3xl font-extrabold">
            What Our Customers Say
          </h2>

          <p className="mt-3 text-gray-500">
            We look forward to making your shopping experience
            exceptional.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            "A simple and convenient shopping experience.",
            "Discover products and find what you need with ease.",
            "ShopEase makes browsing products simple and enjoyable.",
          ].map((review, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 p-7 shadow-sm"
            >
              <div className="mb-5 flex gap-1 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={17}
                    className="fill-yellow-400"
                  />
                ))}
              </div>

              <p className="text-sm leading-7 text-gray-600">
                "{review}"
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================
          NEWSLETTER
      ====================================== */}

      <section className="bg-blue-50 py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-extrabold">
            Stay Updated With ShopEase
          </h2>

          <p className="mt-3 text-gray-500">
            Discover new arrivals and special offers.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();

              alert(
                "Newsletter subscription will be available soon!"
              );
            }}
            className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="flex-1 rounded-lg border border-gray-200 px-5 py-4 outline-none focus:border-blue-700"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-7 py-4 font-bold text-white hover:bg-blue-800"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
