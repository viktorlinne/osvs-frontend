import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AchievementEntryForm,
  DeleteEntryForm,
  OfficialEntryForm,
} from "./MemberHistoryForms";
import { ChangeLogList } from "./MemberHistoryEditor";

afterEach(() => {
  cleanup();
});

const officials = [
  { id: 1, title: "Ordförande" },
  { id: 2, title: "Sekreterare" },
];

describe("OfficialEntryForm", () => {
  it("keeps Spara disabled until both dates are explicitly confirmed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <OfficialEntryForm
        mode="create"
        initial={{ officialId: 2, appointedAt: "2020-01-01", unappointedAt: null }}
        options={officials}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );

    const save = screen.getByRole("button", { name: "Spara" });
    expect(save).toBeDisabled();

    await user.click(screen.getByLabelText("Jag bekräftar startdatumet 2020-01-01"));
    expect(save).toBeDisabled();

    await user.click(
      screen.getByLabelText("Jag bekräftar att tjänsten är pågående (inget slutdatum)"),
    );
    expect(save).toBeEnabled();

    await user.click(save);
    expect(onSubmit).toHaveBeenCalledWith({
      officialId: 2,
      appointedAt: "2020-01-01",
      unappointedAt: null,
      datesConfirmed: true,
      note: null,
    });
  });

  it("clears a confirmation when its date changes and requires a note when editing", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <OfficialEntryForm
        mode="edit"
        initial={{
          officialId: 1,
          appointedAt: "2019-01-15",
          unappointedAt: "2021-01-15",
        }}
        options={officials}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );

    const save = screen.getByRole("button", { name: "Spara" });
    await user.click(screen.getByLabelText("Jag bekräftar startdatumet 2019-01-15"));
    await user.click(screen.getByLabelText("Jag bekräftar slutdatumet 2021-01-15"));
    expect(save).toBeDisabled(); // note missing

    fireEvent.change(screen.getByLabelText("Slutdatum"), {
      target: { value: "2021-06-30" },
    });
    expect(
      screen.getByLabelText("Jag bekräftar slutdatumet 2021-06-30"),
    ).not.toBeChecked();

    await user.click(screen.getByLabelText("Jag bekräftar slutdatumet 2021-06-30"));
    await user.type(screen.getByLabelText(/Anteckning/), "Avgick vid årsmötet");
    expect(save).toBeEnabled();
    await user.click(save);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        unappointedAt: "2021-06-30",
        datesConfirmed: true,
        note: "Avgick vid årsmötet",
      }),
    );
  });

  it("shows backend field errors inline", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({
      status: 400,
      message: "Formuläret innehåller fel",
      details: {
        fields: { officialId: "Brodern har redan denna tjänst som pågående" },
      },
    });
    render(
      <OfficialEntryForm
        mode="create"
        initial={{ officialId: 1, appointedAt: "2020-01-01", unappointedAt: null }}
        options={officials}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    await user.click(screen.getByLabelText("Jag bekräftar startdatumet 2020-01-01"));
    await user.click(screen.getByLabelText(/pågående/));
    await user.click(screen.getByRole("button", { name: "Spara" }));

    await waitFor(() =>
      expect(
        screen.getByText("Brodern har redan denna tjänst som pågående"),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("AchievementEntryForm", () => {
  it("requires a note when changing an achievement", async () => {
    const user = userEvent.setup();
    render(
      <AchievementEntryForm
        mode="edit"
        initial={{ achievementId: 3, awardedAt: "2021-03-20" }}
        options={[{ id: 3, title: "III" }]}
        onSubmit={vi.fn()}
        onCancel={() => {}}
      />,
    );
    const save = screen.getByRole("button", { name: "Spara" });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/Anteckning/), "Rättat datum");
    expect(save).toBeEnabled();
  });
});

describe("DeleteEntryForm", () => {
  it("requires a note before deleting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <DeleteEntryForm
        description="Ta bort tjänsten?"
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    const remove = screen.getByRole("button", { name: "Ta bort" });
    expect(remove).toBeDisabled();
    await user.type(screen.getByLabelText(/Anteckning/), "  Dubblett  ");
    await user.click(remove);
    expect(onSubmit).toHaveBeenCalledWith("Dubblett");
  });
});

describe("ChangeLogList", () => {
  it("renders old and new values with note and editor", () => {
    render(
      <ChangeLogList
        entries={[
          {
            id: 2,
            entityType: "official",
            action: "update",
            entryId: 31,
            oldValue: {
              itemId: 1,
              title: "Ordförande",
              date: "2019-01-15 00:00:00",
              endDate: null,
            },
            newValue: {
              itemId: 1,
              title: "Ordförande",
              date: "2019-01-15 00:00:00",
              endDate: "2021-06-30 00:00:00",
            },
            note: "Avgick",
            editorId: 9,
            editorName: "Anders Andersson",
            createdAt: "2026-10-21 22:14:03",
          },
        ]}
      />,
    );
    expect(screen.getByText("Tjänst ändrad")).toBeInTheDocument();
    expect(screen.getByText("Ordförande, 2019-01-15 – pågående")).toBeInTheDocument();
    expect(screen.getByText("Ordförande, 2019-01-15 – 2021-06-30")).toBeInTheDocument();
    expect(screen.getByText("Avgick")).toBeInTheDocument();
    expect(screen.getByText(/Anders Andersson/)).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<ChangeLogList entries={[]} />);
    expect(screen.getByText("Inga ändringar loggade")).toBeInTheDocument();
  });
});
