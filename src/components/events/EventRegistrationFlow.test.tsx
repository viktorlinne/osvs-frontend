import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventRegistrationFlow } from "./EventRegistrationFlow";

type Saved = { rsvp: boolean | null; bookFood: boolean };

function renderFlow(
  saved: Saved | null,
  options: { food?: boolean; price?: number; canChange?: boolean } = {},
) {
  const onConfirm = vi.fn();

  // Mirrors the page: a successful save replaces the saved registration.
  function Harness() {
    const [current, setCurrent] = useState<Saved | null>(saved);
    return (
      <EventRegistrationFlow
        eventHasFood={options.food ?? true}
        price={options.price ?? 0}
        saved={current}
        loading={false}
        saving={false}
        canChange={options.canChange ?? true}
        fieldErrors={{}}
        onConfirm={async (payload) => {
          onConfirm(payload);
          setCurrent(payload);
          return true;
        }}
      />
    );
  }

  const utils = render(<Harness />);
  return { onConfirm, ...utils };
}

describe("EventRegistrationFlow", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps focus in the section when the clicked button unmounts", async () => {
    const user = userEvent.setup();
    renderFlow({ rsvp: true, bookFood: true });

    await user.click(screen.getByRole("button", { name: "Ändra anmälan" }));
    expect(screen.getByText("Anmälan")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Nästa" }));
    await user.click(screen.getByRole("button", { name: "Nästa" }));
    await user.click(screen.getByRole("button", { name: "Bekräfta" }));

    expect(await screen.findByText("Din anmälan är bekräftad.")).toBeInTheDocument();
    expect(screen.getByText("Din anmälan")).toHaveFocus();
  });

  it("does not steal focus on first render", () => {
    renderFlow({ rsvp: true, bookFood: true });
    expect(document.body).toHaveFocus();
  });

  it("runs Närvaro -> Mat -> Bekräfta and saves both choices together", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderFlow({ rsvp: null, bookFood: false });

    await user.click(screen.getByRole("button", { name: "Kommer" }));
    await user.click(screen.getByRole("button", { name: "Nästa" }));
    await user.click(screen.getByRole("switch"));
    expect(screen.getByText("Äter")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nästa" }));
    await user.click(screen.getByRole("button", { name: "Bekräfta" }));

    expect(onConfirm).toHaveBeenCalledWith({ rsvp: true, bookFood: true });
    expect(await screen.findByText("Din anmälan är bekräftad.")).toBeInTheDocument();
  });

  it("starts from prefilled values and skips Mat when not attending", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderFlow({ rsvp: true, bookFood: true });

    expect(screen.getByText("Kommer")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ändra anmälan" }));
    expect(screen.getByRole("button", { name: "Kommer" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Kommer inte" }));
    await user.click(screen.getByRole("button", { name: "Nästa" }));
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getByText("Äter inte")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bekräfta" }));
    expect(onConfirm).toHaveBeenCalledWith({ rsvp: false, bookFood: false });
  });

  it("shows the payment seam text only for paid events when attending", () => {
    renderFlow({ rsvp: true, bookFood: false }, { price: 250 });
    expect(screen.getByText(/Betalning hanteras separat/)).toBeInTheDocument();
  });

  it("hides the change button when registration is closed", () => {
    renderFlow({ rsvp: true, bookFood: false }, { canChange: false });
    expect(
      screen.queryByRole("button", { name: "Ändra anmälan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Anmälan är stängd för det här mötet."),
    ).toBeInTheDocument();
  });
});
