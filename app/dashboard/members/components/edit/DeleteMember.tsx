"use client";

import { Button } from "@/components/ui/button";
import { TrashIcon } from "@radix-ui/react-icons";
import { deleteMemberById } from "../../actions";
import { useTransition } from "react";
import { toast } from "@/components/ui/use-toast";

const DeleteMember = ({ user_id }: { user_id: string }) => {
  const [isPending, startTransition] = useTransition();

  const onSubmit = async () => {
    startTransition(async () => {
      const result = await deleteMemberById(user_id);

      if (result.error?.message) {
        toast({
          variant: "destructive",
          title: "Failed to delete",
        });
      } else {
        toast({
          title: "Successfully deleted",
        });
      }
    });
  };

  return (
    <form action={onSubmit}>
      <Button variant="outline">
        <TrashIcon />
        Delete
      </Button>
    </form>
  );
};

export default DeleteMember;
