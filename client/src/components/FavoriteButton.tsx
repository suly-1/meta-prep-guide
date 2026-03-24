/**
 * FavoriteButton — heart icon that toggles a question in/out of the user's favorites.
 * Uses optimistic updates for instant feedback. Falls back gracefully when logged out.
 */
import { Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  questionId: string;
  questionType: "coding" | "behavioral" | "design" | "ctci";
  questionText: string;
  /** Optional extra class names */
  className?: string;
  /** Size of the heart icon in px (default 14) */
  size?: number;
}

export function FavoriteButton({
  questionId,
  questionType,
  questionText,
  className,
  size = 14,
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: favorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const isFavorited =
    favorites?.some(f => f.questionId === questionId) ?? false;

  const toggle = trpc.favorites.toggle.useMutation({
    // Optimistic update
    onMutate: async () => {
      await utils.favorites.list.cancel();
      const prev = utils.favorites.list.getData();
      utils.favorites.list.setData(undefined, old => {
        if (!old) return old;
        if (isFavorited) {
          return old.filter(f => f.questionId !== questionId);
        } else {
          return [
            {
              id: -1,
              userId: -1,
              questionId,
              questionType,
              questionText,
              notes: null,
              createdAt: new Date(),
            },
            ...old,
          ];
        }
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.favorites.list.setData(undefined, ctx.prev);
      toast.error("Could not update favorites");
    },
    onSuccess: data => {
      toast.success(
        data.favorited ? "Added to favorites ♥" : "Removed from favorites"
      );
    },
    onSettled: () => {
      utils.favorites.list.invalidate();
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Sign in to save favorites");
      return;
    }
    toggle.mutate({ questionId, questionType, questionText });
  };

  return (
    <button
      onClick={handleClick}
      title={isFavorited ? "Remove from favorites" : "Save to favorites"}
      aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "inline-flex items-center justify-center rounded transition-colors",
        "hover:scale-110 active:scale-95",
        isFavorited
          ? "text-rose-400 hover:text-rose-300"
          : "text-muted-foreground hover:text-rose-400",
        className
      )}
    >
      <Heart
        size={size}
        className={cn("transition-all", isFavorited && "fill-rose-400")}
      />
    </button>
  );
}
