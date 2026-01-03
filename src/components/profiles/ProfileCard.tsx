import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormError } from "@/components/ui/form-error";
import { MoreVertical, Pencil, Trash2, Play } from "lucide-react";

export interface ProfileCardProps {
  profile: {
    id: string;
    profileName: string;
    age: number;
    level: number;
  };
  onDelete?: () => void;
}

/**
 * ProfileCard - Card component for displaying a child profile
 *
 * Displays profile information with:
 * - Avatar with first letter of name
 * - Name, age, and level information
 * - "Play" button to start a game session
 * - Dropdown menu with edit and delete options
 * - Delete confirmation dialog with inline error handling
 */

export default function ProfileCard({ profile, onDelete }: ProfileCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>("");

  const handlePlay = useCallback(() => {
    window.location.href = `/game/start?profileId=${profile.id}`;
  }, [profile.id]);

  const handleEdit = useCallback(() => {
    window.location.href = `/profiles/${profile.id}/edit`;
  }, [profile.id]);

  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleDeleteClick = useCallback(() => {
    setDeleteError(""); // Clear any previous errors
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      setIsDeleteDialogOpen(false);

      // Call onDelete callback or refresh the page
      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (error) {
      setIsDeleting(false);

      // Error handling
      if (error && typeof error === "object" && "status" in error) {
        const err = error as { status: number; message: string };

        if (err.status === 409) {
          setDeleteError("Profil z aktywną sesją gry nie może być usunięty. Zakończ grę i spróbuj ponownie.");
        } else if (err.status === 404) {
          setDeleteError("Ten profil nie istnieje lub został już usunięty.");
        } else {
          setDeleteError("Nie udało się usunąć profilu. Spróbuj ponownie później.");
        }
      } else {
        setDeleteError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
      }
    }
  }, [profile.id, onDelete]);

  return (
    <>
      <div
        className={cn(
          "bg-card rounded-lg border shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow relative"
        )}
        role="listitem"
      >
        {/* Context Menu Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute top-2 right-2"
              aria-label={`Opcje profilu ${profile.profileName}`}
              onClick={handleMenuClick}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold mb-4">
          {profile.profileName.charAt(0).toUpperCase()}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-xl mb-1">{profile.profileName}</h3>

        {/* Age + Level */}
        <p className="text-sm text-muted-foreground mb-6">
          {profile.age} lat • poziom {profile.level}
        </p>

        {/* Play Button */}
        <Button onClick={handlePlay} className="w-full" size="lg" aria-label={`Graj jako ${profile.profileName}`}>
          <Play className="mr-2 h-5 w-5" />
          Graj
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Usunąć profil?</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed pt-2 text-foreground">
              Ta akcja jest <strong>nieodwracalna</strong>. Profil{" "}
              <strong className="text-foreground">{profile.profileName}</strong> oraz wszystkie powiązane dane (sesje,
              wyniki zadań) zostaną trwale usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Delete Error Message */}
          {deleteError && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <FormError>{deleteError}</FormError>
            </div>
          )}

          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-3">
            <AlertDialogCancel disabled={isDeleting} className="flex-1 sm:flex-1 mt-0">
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              variant={"destructive" as const}
              className="flex-1 sm:flex-1"
            >
              {isDeleting ? "Usuwanie..." : "Usuń profil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
