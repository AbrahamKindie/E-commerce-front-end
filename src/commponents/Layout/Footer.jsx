const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-white">ShopEase</h2>

        <p className="mt-3 text-sm">
          Your destination for quality products and great shopping.
        </p>

        <div className="border-t border-gray-800 mt-8 pt-6 text-sm">
          © {new Date().getFullYear()} ShopEase. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;