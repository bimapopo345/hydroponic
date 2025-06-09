import { useState, useEffect } from "react";
import { Menu, X, Sprout } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const landingPageNavigation = [
  { name: "Beranda", href: "#home" },
  { name: "Fitur", href: "#features" },
  { name: "Keunggulan", href: "#benefits" },
  { name: "Model 3D", href: "#model3d" },
  { name: "Statistik", href: "#water-stats" },
  { name: "Kontak", href: "#contact" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY <= 20 || window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const navHeight = 64;
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setMobileMenuOpen(false);
    }
  };

  const handleGetStarted = () => {
    navigate("/register");
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Sprout
              className={`h-8 w-8 ${scrolled ? "text-teal-600" : "text-white"}`}
            />
            <span
              className={`text-xl font-bold ${
                scrolled ? "text-gray-900" : "text-white"
              }`}
            >
              HidroNutrient
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {isLandingPage &&
              landingPageNavigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className={`${
                    scrolled
                      ? "text-gray-600 hover:text-teal-600"
                      : "text-gray-100 hover:text-white"
                  } transition-colors relative group`}
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-500 group-hover:w-full transition-all duration-300"></span>
                </button>
              ))}

            {!location.pathname.includes("/dashboard") && (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className={`${
                    scrolled
                      ? "text-gray-600 hover:text-teal-600"
                      : "text-gray-100 hover:text-white"
                  } transition-colors`}
                >
                  Masuk
                </button>
                <button
                  onClick={handleGetStarted}
                  className="btn-primary ml-4 shadow-lg hover:shadow-teal-500/20"
                >
                  Mulai Sekarang
                </button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${
                scrolled ? "text-gray-600" : "text-white"
              } hover:text-teal-500`}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 bg-white rounded-lg shadow-xl mt-2">
            {isLandingPage &&
              landingPageNavigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full px-4 py-2 text-left text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors"
                >
                  {item.name}
                </button>
              ))}
            {!location.pathname.includes("/dashboard") && (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="block w-full px-4 py-2 text-left text-gray-600 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors"
                >
                  Masuk
                </button>
                <div className="px-4 pt-2">
                  <button
                    onClick={handleGetStarted}
                    className="btn-primary w-full"
                  >
                    Mulai Sekarang
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
