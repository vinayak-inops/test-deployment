import { Button } from "@repo/ui/components/ui/button";

interface SubmitButtonProps {
  onSubmit: () => void;
}

export const SubmitButton = ({ onSubmit }: SubmitButtonProps) => {
  return (
    <Button
      className="w-full font-medium"
      size="lg"
      onClick={onSubmit}
    >
      Submit
    </Button>
  );
};