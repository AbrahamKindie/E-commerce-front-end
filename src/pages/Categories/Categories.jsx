
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import categoryService from "../../services/categoryService";

// Backend URL
const API_URL = new URL(
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).origin;

// Convert relative image paths into complete URLs
const getImageUrl = (image) => {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_URL}/${image.replace(/^\/+/, "")}`;
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await categoryService.getCategories();
        setCategories(response.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load categories."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      {/* Page Header */}
      <div className="mb-10 text-center">
        <p className="font-semibold text-blue-600">
          Explore our store
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Shop by Category
        </h1>

        <p className="mt-3 text-gray-500">
          Discover products from all our shopping categories.
        </p>
      </div>

      {error && (
        <p className="mb-6 text-center text-red-600">
          {error}
        </p>
      )}

      {!error && categories.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          No categories are available yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const productCount = category._count?.products ?? 0;

            // Use category image first, otherwise use a product image.
            const categoryImage =
              category.image ||
              (Array.isArray(category.images)
                ? category.images[0]
                : null) ||
              category.products?.find(
                (product) => product.images?.length > 0
              )?.images?.[0];

            const imageUrl = getImageUrl(categoryImage);

            return (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Category Image */}
                <div className="flex h-52 items-center justify-center overflow-hidden bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={category.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://placehold.co/600x400?text=No+Image";
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Layers
                      size={64}
                      className="text-gray-300"
                    />
                  )}
                </div>

                {/* Category Information */}
                <div className="flex items-center justify-between p-5">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {category.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {productCount} products
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <ArrowRight size={20} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Categories;
