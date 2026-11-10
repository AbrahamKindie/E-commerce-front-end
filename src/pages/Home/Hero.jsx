
import { ArrowRight, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">

      {/* Left banner */}
      <div
        className="relative min-h-[300px] md:min-h-[490px] bg-cover bg-center rounded-lg overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800')",
        }}
      >
        <div className="absolute inset-0 bg-black/10 p-6 flex flex-col justify-between">
          <div>
            <p className="text-orange-500 font-semibold">20% OFF</p>
            <h2 className="text-3xl font-bold text-gray-900">
              New Fashion
            </h2>
            <p className="text-gray-700 mt-2">Discover your style</p>
          </div>

          <Link
            to="/shop"
            className="bg-orange-500 text-white px-5 py-3 rounded w-fit text-sm"
          >
            Shop Now <ArrowRight size={16} className="inline ml-2" />
          </Link>
        </div>
      </div>

      {/* Main banner */}
      <div
        className="relative md:col-span-2 min-h-[300px] md:min-h-[490px] rounded-lg overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200')",
        }}
      >
        <div className="absolute inset-0 bg-white/40 p-8 md:p-10 flex flex-col justify-center">
          <p className="text-orange-500 italic text-xl">New Collection</p>

          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            NEW & EXCLUSIVE
            <span className="block text-blue-700">HEADPHONES</span>
          </h1>

          <p className="mt-4 text-gray-700">
            Experience sound like never before.
          </p>

          <Link
            to="/shop"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 mt-6 rounded w-fit font-semibold"
          >
            Shop Now <ArrowRight size={18} className="inline ml-2" />
          </Link>
        </div>

        <div className="absolute bottom-5 right-5 bg-blue-800 text-white rounded-full w-24 h-24 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">50%</span>
          <span className="text-xs">OFF</span>
        </div>
      </div>

      {/* Right banners */}
      <div className="flex flex-col gap-4">
        <div
          className="relative flex-1 min-h-[220px] bg-cover bg-center rounded-lg overflow-hidden"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=700')",
          }}
        >
          <div className="absolute inset-0 bg-white/30 p-5">
            <p className="text-orange-500 font-bold">10% OFF</p>
            <h2 className="font-bold text-xl text-gray-900">
              SMARTPHONES
            </h2>
          </div>
        </div>

        <div
          className="relative flex-1 min-h-[220px] bg-cover bg-center rounded-lg overflow-hidden"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700')",
          }}
        >
          <div className="absolute inset-0 bg-white/30 p-5">
            <p className="text-orange-500 font-bold">40% OFF</p>
            <h2 className="font-bold text-xl text-gray-900">
              TRAVEL BAGS
            </h2>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
