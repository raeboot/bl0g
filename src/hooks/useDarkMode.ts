import { useEffect, useState } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("bl0g:dark");
    const isDark = saved === "1";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const nd = !d;
      document.documentElement.classList.toggle("dark", nd);
      localStorage.setItem("bl0g:dark", nd ? "1" : "0");
      return nd;
    });
  };
  return { dark, toggle };
}
