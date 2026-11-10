
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import categoryService from "../../services/categoryService";
import ProductCard from "../../commponents/Products/ProductCard";

const CategoryDetails = () => {
  const { id } = useParams();

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await categoryService.getCategoryById(id);
        setCategory(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load this category."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        Loading category...
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="py-20 text-center">
        <p className="mb-5 text-red-600">
          {error || "Category not found."}
        </p>
        <Link
          to="/categories"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Browse Categories
        </Link>
      </div>
    );
  }

  const products = category.products || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <Link
        to="/categories"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        All Categories
      </Link>

      <div className="mb-10 border-b border-gray-200 pb-7">
        <p className="font-medium text-blue-600">Category</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          {category.name}
        </h1>
        <p className="mt-2 text-gray-500">
          {products.length} products in this category
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            No products in this category yet
          </h2>
          <p className="mt-2 text-gray-500">
            Please check back later or explore other categories.
          </p>
          <Link
            to="/categories"
            className="mt-5 inline-block text-blue-600 hover:underline"
          >
            Explore Categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
};

export default CategoryDetails;
