import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("id, slug, name").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000,
});
