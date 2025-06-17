import { useState, useEffect } from "react";

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768);
    };

    checkTablet();
    window.addEventListener("resize", checkTablet);

    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  return isTablet;
}