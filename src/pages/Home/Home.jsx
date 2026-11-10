
import { useEffect, useState } from "react";
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
} from "lucide-react";

import productService from "../../services/productService";
import categoryService from "../../services/categoryService";

// Backend URL
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

// Convert uploaded image paths into complete URLs
const getImageUrl = (image) => {
  if (!image) {
    return "https://placehold.co/600x600?text=No+Image";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

const handleImageError = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src =
    "https://placehold.co/600x600?text=No+Image";
};

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

const SectionHeading = ({
  title,
  subtitle,
  link = "/products",
}) => (
  <div className="flex justify-between items-end gap-4 mb-7">
    <div>
      <p className="text-orange-500 uppercase text-xs font-bold tracking-widest mb-2">
        ShopEase Collection
      </p>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
        {title}
      </h2>

      {subtitle && (
        <p className="text-gray-500 mt-2 text-sm">
          {subtitle}
        </p>
      )}
    </div>

    <Link
      to={link}
      className="text-blue-700 font-semibold text-sm flex items-center gap-1 hover:text-orange-500 whitespace-nowrap"
    >
      View All <ArrowRight size={16} />
    </Link>
  </div>
);

// Product Card
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
    <div className="group border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-xl transition duration-300">
      <div className="relative bg-gray-50 overflow-hidden">
        <Link to={`/products/${product.id}`}>
          <img
            src={image}
            alt={product.name}
            onError={handleImageError}
            className="w-full aspect-square object-cover group-hover:scale-105 transition duration-500"
          />
        </Link>

        {product.hasActiveDiscount && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {product.discount?.type === "PERCENTAGE"
              ? `-${Number(product.discount.value)}%`
              : `-${Number(product.discountAmount).toFixed(2)}`}
          </span>
        )}

        {product.isNewArrival && (
          <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            NEW
          </span>
        )}

        <Link
          to={`/products/${product.id}`}
          className="absolute bottom-3 left-3 right-3 bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold text-center opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition"
        >
          View Product
        </Link>
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-400 mb-2">
          {product.category?.name || "Uncategorized"}
        </p>

        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm hover:text-blue-700 line-clamp-2 min-h-10">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-2">
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

        <div className="flex flex-wrap items-center gap-2 mt-3">
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
          className={`text-xs mt-2 ${
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

// Reusable Product Section
const ProductSection = ({
  title,
  subtitle,
  products,
  loading,
}) => (
  <section className="max-w-7xl mx-auto px-4 py-12">
    <SectionHeading title={title} subtitle={subtitle} />

    {loading ? (
      <div className="flex justify-center py-12">
        <LoaderCircle
          className="animate-spin text-blue-700"
          size={32}
        />
      </div>
    ) : products.length === 0 ? (
      <p className="text-center text-gray-500 py-12">
        No products available in this section yet.
      </p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    )}
  </section>
);

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          categoryResponse,
          featuredResponse,
          bestSellingResponse,
          newArrivalResponse,
        ] = await Promise.all([
          categoryService.getCategories(),
          productService.getFeaturedProducts(8),
          productService.getBestSellingProducts(8),
          productService.getNewArrivals(8),
        ]);

        setCategories(categoryResponse.data || []);
        setFeaturedProducts(featuredResponse.data || []);
        setBestSellingProducts(bestSellingResponse.data || []);
        setNewArrivals(newArrivalResponse.data || []);
      } catch (err) {
        console.error("Homepage loading error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load homepage information. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="bg-white text-gray-800">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 relative min-h-[440px] md:min-h-[510px] bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400"
                alt="Premium headphones"
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />

              <div className="relative z-10 p-8 md:p-14 flex flex-col justify-center h-full max-w-xl">
                <span className="bg-orange-100 text-orange-600 rounded-full px-4 py-2 text-xs font-bold w-fit mb-6">
                  WELCOME TO SHOPEASE
                </span>

                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
                  Discover Your
                  <span className="block text-blue-700">
                    Perfect Style.
                  </span>
                </h1>

                <p className="text-gray-600 mt-5 max-w-md leading-7">
                  Explore quality products, exciting offers and
                  everyday essentials. Everything you love, all
                  in one place.
                </p>

                <div className="flex flex-wrap gap-3 mt-8">
                  <Link
                    to="/products"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-7 py-4 rounded-lg font-semibold flex items-center gap-2"
                  >
                    Shop Now <ArrowRight size={18} />
                  </Link>

                  <Link
                    to="/categories"
                    className="border border-gray-300 hover:border-blue-700 px-7 py-4 rounded-lg font-semibold"
                  >
                    Explore Categories
                  </Link>
                </div>

                <div className="flex gap-8 mt-10">
                  <div>
                    <p className="text-2xl font-extrabold text-blue-800">
                      {categories.length}+
                    </p>
                    <p className="text-xs text-gray-500">
                      Categories
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

            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="relative flex-1 min-h-[210px] rounded-2xl overflow-hidden bg-blue-50">
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700"
                  alt="Smartphones"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-white/95 to-transparent p-6 flex flex-col justify-center">
                  <p className="text-orange-500 font-bold text-sm">
                    EXPLORE OUR STORE
                  </p>

                  <h2 className="text-2xl font-extrabold text-gray-900 mt-2">
                    Electronics
                  </h2>

                  <Link
                    to="/products"
                    className="text-blue-700 font-bold text-sm mt-4"
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>

              <div className="relative flex-1 min-h-[210px] rounded-2xl overflow-hidden bg-orange-50">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700"
                  alt="Fashion collection"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-white/95 to-transparent p-6 flex flex-col justify-center">
                  <p className="text-orange-500 font-bold text-sm">
                    DISCOVER MORE
                  </p>

                  <h2 className="text-2xl font-extrabold text-gray-900 mt-2">
                    New Collections
                  </h2>

                  <Link
                    to="/products?sortBy=newest"
                    className="text-blue-700 font-bold text-sm mt-4"
                  >
                    Explore More →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="flex items-center gap-4 p-5 border border-gray-100 rounded-xl"
              >
                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl">
                  <Icon size={25} />
                </div>

                <div>
                  <h3 className="font-bold text-sm">
                    {service.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <SectionHeading
          title="Shop By Categories"
          subtitle="Find exactly what you are looking for."
          link="/categories"
        />

        {loading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle
              className="animate-spin text-blue-700"
              size={30}
            />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">
            No categories available yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {categories.slice(0, 6).map((category) => {
              const categoryProduct = category.products?.find(
                (product) => product.images?.length > 0
              );

              const categoryImage =
                category.image || categoryProduct?.images?.[0];

              return (
                <Link
                  to={`/categories/${category.id}`}
                  key={category.id}
                  className="group text-center"
                >
                  <div className="bg-gray-50 rounded-2xl p-3 overflow-hidden">
                    {categoryImage ? (
                      <img
                        src={getImageUrl(categoryImage)}
                        alt={category.name}
                        onError={handleImageError}
                        className="w-full aspect-square object-cover rounded-xl group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-sm mt-4 group-hover:text-blue-700">
                    {category.name}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    {category._count?.products ??
                      category.products?.length ??
                      0}{" "}
                    Products
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* FLASH DEAL */}
      <section className="bg-blue-800 text-white my-12">
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 text-orange-300 font-bold text-sm">
              <Zap size={18} /> SPECIAL OFFERS
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">
              Great Deals Are Here!
            </h2>

            <p className="text-blue-100 mt-3">
              Discover incredible prices on selected products.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-7 py-3 rounded-lg font-bold mt-6"
            >
              Explore Products <ArrowRight size={18} />
            </Link>
          </div>

          <div className="text-center">
            <p className="text-5xl font-extrabold">
              {featuredProducts.length}
            </p>
            <p className="text-blue-100 mt-2">
              Featured products
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <ProductSection
        title="Featured Products"
        subtitle="Handpicked products we think you'll love."
        products={featuredProducts}
        loading={loading}
      />

      {/* LARGE PROMOTION */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="relative rounded-3xl overflow-hidden min-h-[330px] bg-gray-900">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400"
            alt="Shopping collection"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />

          <div className="relative p-8 md:p-16 max-w-2xl">
            <span className="text-orange-300 font-bold text-sm tracking-widest">
              THE SHOPEASE COLLECTION
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-4">
              Upgrade Your Everyday.
            </h2>

            <p className="text-gray-200 mt-4">
              Discover amazing products and exclusive offers
              for your lifestyle.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3 rounded-lg font-bold mt-7"
            >
              Start Shopping <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <ProductSection
        title="Best Selling Products"
        subtitle="Our customers' favorite picks."
        products={bestSellingProducts}
        loading={loading}
      />

      {/* NEW ARRIVALS */}
      <section className="bg-gray-50 py-14">
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh additions to our collection."
          products={newArrivals}
          loading={loading}
        />
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
            {error}
          </p>
        </div>
      )}

      {/* CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-orange-500 text-xs font-bold tracking-widest">
            CUSTOMER EXPERIENCES
          </p>

          <h2 className="text-3xl font-extrabold mt-2">
            What Our Customers Say
          </h2>

          <p className="text-gray-500 mt-3">
            We look forward to making your shopping experience
            exceptional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            "A simple and convenient shopping experience.",
            "Discover products and find what you need with ease.",
            "ShopEase makes browsing products simple and enjoyable.",
          ].map((review, index) => (
            <div
              key={index}
              className="border border-gray-100 shadow-sm rounded-2xl p-7"
            >
              <div className="flex gap-1 text-yellow-400 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={17}
                    className="fill-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-600 leading-7 text-sm">
                "{review}"
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-blue-50 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold">
            Stay Updated With ShopEase
          </h2>

          <p className="text-gray-500 mt-3">
            Discover new arrivals and special offers.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              alert(
                "Newsletter subscription will be available soon!"
              );
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-7"
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="flex-1 px-5 py-4 rounded-lg border border-gray-200 outline-none focus:border-blue-700"
            />

            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white px-7 py-4 rounded-lg font-bold"
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
