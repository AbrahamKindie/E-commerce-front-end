
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  ArrowRight,
  Layers,
  RefreshCw,
  Store,
  ShoppingBag,
  Package,
  Filter,
  X,
} from "lucide-react";

import categoryService from "../../services/categoryService";
import { API_BASE_URL } from "../../services/api";

// ==========================================
// CONSTANTS
// ==========================================

const FALLBACK_IMAGE =
  "https://placehold.co/600x400?text=No+Image";

// ==========================================
// RESPONSE HELPERS
// ==========================================

const getArray = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.categories)) {
    return response.categories;
  }

  return [];
};

// ==========================================
// IMAGE HELPERS
// ==========================================

const getImageUrl = (image) => {
  if (!image) return FALLBACK_IMAGE;

  if (typeof image === "object") {
    image =
      image.url ||
      image.path ||
      image.image ||
      image.secure_url ||
      image.src;
  }

  if (typeof image !== "string") {
    return FALLBACK_IMAGE;
  }

  const imagePath = image.trim();

  if (!imagePath) return FALLBACK_IMAGE;

  if (/^(https?:\/\/|data:image\/|blob:)/i.test(imagePath)) {
    return imagePath;
  }

  try {
    const apiOrigin = new URL(API_BASE_URL).origin;

    const normalizedPath = imagePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    return `${apiOrigin}/${normalizedPath}`;
  } catch (error) {
    console.error("Invalid category image path:", error);
    return FALLBACK_IMAGE;
  }
};

const getCategoryImage = (category) => {
  return (
    category?.image ||
    category?.imageUrl ||
    category?.coverImage ||
    category?.photo ||
    null
  );
};

const handleImageError = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_IMAGE;
};

// ==========================================
// ACTIVE SHOPS
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

    return true;
  });
};

// ==========================================
// UNIQUE PRODUCT CATEGORIES
// ==========================================

const getUniqueProductCategories = (category) => {
  const uniqueCategories = new Map();

  getActiveShops(category).forEach((shop) => {
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

      if (!uniqueCategories.has(normalizedName)) {
        uniqueCategories.set(normalizedName, productCategory);
      }
    });
  });

  return Array.from(uniqueCategories.values());
};

// ==========================================
// PRODUCT COUNTS
// ==========================================

const getProductCategoryProductCount = (productCategory) => {
  if (typeof productCategory?.productsCount === "number") {
    return productCategory.productsCount;
  }

  if (typeof productCategory?._count?.products === "number") {
    return productCategory._count.products;
  }

  if (typeof productCategory?.productCount === "number") {
    return productCategory.productCount;
  }

  if (Array.isArray(productCategory?.products)) {
    return productCategory.products.length;
  }

  return null;
};

const getCategoryProductCount = (category) => {
  if (typeof category?.productsCount === "number") {
    return category.productsCount;
  }

  let total = 0;
  let hasUnknownCount = false;

  getActiveShops(category).forEach((shop) => {
    const productCategories = Array.isArray(
      shop.productCategories
    )
      ? shop.productCategories
      : [];

    productCategories.forEach((productCategory) => {
      const count =
        getProductCategoryProductCount(productCategory);

      if (count === null) {
        hasUnknownCount = true;
      } else {
        total += count;
      }
    });
  });

  return hasUnknownCount ? null : total;
};

// ==========================================
// BUILD PRODUCT CATEGORY GROUPS
// ==========================================

const buildProductCategoryGroups = (categories) => {
  const groups = [];

  categories.forEach((category) => {
    getActiveShops(category).forEach((shop) => {
      const productCategories = Array.isArray(
        shop.productCategories
      )
        ? shop.productCategories
        : [];

      productCategories.forEach((productCategory) => {
        if (!productCategory?.name) return;

        const name = String(productCategory.name).trim();

        if (!name) return;

        groups.push({
          category,
          shop,
          productCategory: {
            ...productCategory,
            name,
          },
        });
      });
    });
  });

  return groups;
};

// ==========================================
// SECTION HEADING
// ==========================================

const SectionHeading = ({
  title,
  subtitle,
  count,
}) => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">
        ShopEase Marketplace
      </p>

      <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          {subtitle}
        </p>
      )}
    </div>

    {count !== undefined && (
      <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
        {count} {count === 1 ? "Category" : "Categories"}
      </span>
    )}
  </div>
);

// ==========================================
// SHOP CATEGORY CARD
// ==========================================

const ShopCategoryCard = ({ category }) => {
  const totalProductCategories =
    typeof category.productCategoriesCount === "number"
      ? category.productCategoriesCount
      : getUniqueProductCategories(category).length;

  const totalProducts = getCategoryProductCount(category);
  const image = getCategoryImage(category);

  return (
    <Link
      to={`/categories/${category.id}`}
      className="group block w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
    >
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-50 to-orange-50">
        <img
          src={getImageUrl(image)}
          alt={category.name || "Shop category"}
          loading="lazy"
          onError={handleImageError}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <h3 className="absolute bottom-4 left-5 right-5 text-2xl font-extrabold text-white drop-shadow">
          {category.name}
        </h3>
      </div>

      <div className="p-5">
        {category.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-6 text-gray-500">
            {category.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Layers size={17} />

              <span className="text-xs font-medium">
                Product Categories
              </span>
            </div>

            <p className="mt-2 text-xl font-extrabold text-gray-900">
              {totalProductCategories}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-3">
            <div className="flex items-center gap-2 text-orange-600">
              <Package size={17} />

              <span className="text-xs font-medium">
                Products
              </span>
            </div>

            <p className="mt-2 text-xl font-extrabold text-gray-900">
              {totalProducts === null ? "—" : totalProducts}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-500">
            Explore this category
          </span>

          <span className="flex items-center gap-1 text-sm font-bold text-blue-700 transition group-hover:text-orange-500">
            Explore
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
};

// ==========================================
// PRODUCT CATEGORY CARD
// ==========================================

const ProductCategoryCard = ({
  productCategory,
  shop,
  shopCategory,
}) => {
  const productCategoryUrl =
    `/categories/${shopCategory.id}?productCategory=${encodeURIComponent(
      productCategory.name
    )}`;

  const image =
    productCategory.image ||
    productCategory.imageUrl ||
    productCategory.coverImage ||
    productCategory.photo ||
    productCategory.thumbnail ||
    productCategory.products?.find(
      (product) =>
        Array.isArray(product.images) &&
        product.images.length > 0
    )?.images?.[0] ||
    null;

  const productCount =
    getProductCategoryProductCount(productCategory);

  return (
    <Link
      to={productCategoryUrl}
      className="group block w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
    >
      {/* PRODUCT CATEGORY IMAGE */}

      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-50 to-orange-50">
        <img
          src={getImageUrl(image)}
          alt={productCategory.name || "Product category"}
          loading="lazy"
          onError={handleImageError}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* IMAGE OVERLAY */}

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/35" />

        {/* SHOP NAME BADGE */}

        <div className="absolute left-4 top-4 max-w-[85%]">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/30 bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-lg">
            <Store size={14} className="shrink-0" />

            <span className="truncate">
              {shop.name}
            </span>
          </span>
        </div>

        {/* PRODUCT CATEGORY NAME */}

        <h3 className="absolute bottom-4 left-5 right-5 line-clamp-2 text-2xl font-extrabold text-white drop-shadow">
          {productCategory.name}
        </h3>
      </div>

      {/* PRODUCT COUNT */}

      <div className="p-5">
        <div className="rounded-xl bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Package size={17} />

            <span className="text-xs font-medium">
              Products
            </span>
          </div>

          <p className="mt-2 text-xl font-extrabold text-gray-900">
            {productCount === null ? "—" : productCount}
          </p>
        </div>

        {/* EXPLORE */}

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-500">
            Explore this category
          </span>

          <span className="flex items-center gap-1 text-sm font-bold text-blue-700 transition group-hover:text-orange-500">
            Explore
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
};

// ==========================================
// CATEGORIES PAGE
// ==========================================

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();

  // ==========================================
  // URL FILTERS
  // ==========================================

  const selectedShopCategoryId =
    searchParams.get("shopCategoryId");

  const selectedProductCategoryName =
    searchParams.get("productCategory")?.trim() || "";

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await categoryService.getCategories();

      setCategories(getArray(response));
    } catch (err) {
      console.error("Fetch Categories Error:", err);

      setCategories([]);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ==========================================
  // ALL SHOP CATEGORIES
  // ==========================================

  const allShopCategories = useMemo(() => {
    return categories
      .filter((category) => {
        const name = String(category?.name || "")
          .trim()
          .toLowerCase();

        return name !== "other";
      })
      .map((category) => ({
        ...category,
        shops: getActiveShops(category),
      }));
  }, [categories]);

  // ==========================================
  // PRODUCT CATEGORY DATA
  // ==========================================

  const allProductCategoryGroups = useMemo(() => {
    return buildProductCategoryGroups(allShopCategories);
  }, [allShopCategories]);

  // ==========================================
  // FILTER PRODUCT CATEGORY GROUPS
  // ==========================================

  const productCategoryGroups = useMemo(() => {
    return allProductCategoryGroups.filter((group) => {
      if (
        selectedShopCategoryId &&
        String(group.category.id) !==
          String(selectedShopCategoryId)
      ) {
        return false;
      }

      if (
        selectedProductCategoryName &&
        group.productCategory.name.toLowerCase() !==
          selectedProductCategoryName.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [
    allProductCategoryGroups,
    selectedShopCategoryId,
    selectedProductCategoryName,
  ]);

  // ==========================================
  // UNIQUE PRODUCT CATEGORY COUNT
  // ==========================================

  const totalUniqueProductCategories = useMemo(() => {
    const uniqueCategories = new Set();

    productCategoryGroups.forEach((group) => {
      const key =
        `${group.category.id}:${group.productCategory.name.toLowerCase()}`;

      uniqueCategories.add(key);
    });

    return uniqueCategories.size;
  }, [productCategoryGroups]);

  // ==========================================
  // SELECTED FILTER INFORMATION
  // ==========================================

  const selectedShopCategory = allShopCategories.find(
    (category) =>
      String(category.id) ===
      String(selectedShopCategoryId)
  );

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-sm text-gray-500">
            Loading marketplace categories...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50">

      {/* PAGE HEADER */}

      <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-orange-600">
            <Layers size={15} />
            Explore ShopEase
          </span>

          <h1 className="mt-5 text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
            Explore Our Categories
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-500 md:text-base">
            Discover all marketplace categories, explore
            product collections, and find exactly what you
            are looking for.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* ERROR STATE */}

        {error && (
          <div className="mb-10 rounded-xl border border-red-100 bg-red-50 px-5 py-8 text-center">
            <p className="font-medium text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchCategories}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* ACTIVE FILTERS */}

            {(selectedShopCategoryId ||
              selectedProductCategoryName) && (
              <div className="mb-10 rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
                      <Filter size={17} />
                      Active Category Filters
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedShopCategoryId && (
                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                          Shop:{" "}
                          {selectedShopCategory?.name ||
                            selectedShopCategoryId}
                        </span>
                      )}

                      {selectedProductCategoryName && (
                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                          Product: {selectedProductCategoryName}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/categories"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <X size={15} />
                    Clear Filters
                  </Link>
                </div>
              </div>
            )}

            {/* SHOP CATEGORIES */}

            <section id="shop-categories" className="mb-16">
              <SectionHeading
                title="Shop Categories"
                subtitle="Explore marketplace categories and discover products from shops across the marketplace."
                count={allShopCategories.length}
              />

              {allShopCategories.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                  <Layers
                    size={45}
                    className="mx-auto text-gray-300"
                  />

                  <h3 className="mt-4 font-bold text-gray-800">
                    No categories available
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Categories will appear here when they
                    are added to the marketplace.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {allShopCategories.map((category) => (
                    <ShopCategoryCard
                      key={category.id}
                      category={category}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* PRODUCT CATEGORIES */}

            <section id="product-categories">
              <SectionHeading
                title="Product Categories"
                subtitle="Browse product categories offered by active shops. Select a category to view its products."
                count={totalUniqueProductCategories}
              />

              {productCategoryGroups.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                  <ShoppingBag
                    size={45}
                    className="mx-auto text-gray-300"
                  />

                  <h3 className="mt-4 font-bold text-gray-800">
                    No product categories available
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {selectedShopCategoryId ||
                    selectedProductCategoryName
                      ? "No product categories match your selected filters."
                      : "Product categories from active shops will appear here when available."}
                  </p>

                  {(selectedShopCategoryId ||
                    selectedProductCategoryName) && (
                    <Link
                      to="/categories"
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      View All Categories
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {productCategoryGroups.map((group) => (
                    <ProductCategoryCard
                      key={`${group.category.id}-${group.shop.id}-${group.productCategory.id}`}
                      productCategory={group.productCategory}
                      shop={group.shop}
                      shopCategory={group.category}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Categories;
