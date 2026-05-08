import { useCallback, useEffect, useState } from "react";
import { loadTags, saveTags, type Tag } from "@/lib/tags";

export function useTags(): [Tag[], (next: Tag[]) => void] {
  const [tags, setTags] = useState<Tag[]>(() => loadTags());

  useEffect(() => {
    const sync = () => setTags(loadTags());
    window.addEventListener("bl0g:tags-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bl0g:tags-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((next: Tag[]) => {
    setTags(next);
    saveTags(next);
  }, []);

  return [tags, update];
}
