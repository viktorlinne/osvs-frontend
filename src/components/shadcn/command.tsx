import type { ComponentProps } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

/*
 * shadcn/ui Command (cmdk), adapted to the OSVS palette. cmdk renders an
 * input with role="combobox" controlling a role="listbox"; arrow keys move
 * the highlighted option and Enter selects it.
 */

function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-neutral-900",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center border-b border-neutral-200 px-1 pb-2" cmdk-input-wrapper="">
      <CommandPrimitive.Input
        className={cn(
          "ui-input disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-72 overflow-y-auto overflow-x-hidden overscroll-contain", className)}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className={cn("px-2 py-4 text-center text-sm text-neutral-600", className)}
      {...props}
    />
  );
}

function CommandLoading({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      className={cn("px-2 py-2 text-sm text-neutral-600", className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden p-1 text-neutral-900 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-neutral-600",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 h-px bg-neutral-200", className)}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 outline-hidden",
        "data-[selected=true]:bg-primary-50 data-[selected=true]:text-neutral-900 data-[selected=true]:shadow-[inset_3px_0_0_var(--color-primary-600)]",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandLoading,
  CommandGroup,
  CommandItem,
  CommandSeparator,
};
