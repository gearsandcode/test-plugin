/**
 * @fileoverview src/components/SuccessDialog.tsx
 * Success dialog shown after commit
 */
import { ArrowSquareOut, GitPullRequest } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { ExistingPR } from "../types";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prUrl: string;
  branch: string;
  existingPR?: ExistingPR;
}

export function SuccessDialog({
  isOpen,
  onClose,
  prUrl,
  existingPR,
}: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Changes committed successfully
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm opacity-70">
              What would you like to do next?
            </p>

            <div className="pt-4 flex gap-4 justify-end">
              <button
                onClick={onClose}
                className="flex items-center px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5 rounded-sm"
              >
                Continue
              </button>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 text-sm bg-black text-white dark:bg-white dark:text-black rounded-sm hover:opacity-90"
              >
                <GitPullRequest size={16} />
                {existingPR
                  ? "View existing pull request"
                  : "Create pull request"}
                <ArrowSquareOut size={14} />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
